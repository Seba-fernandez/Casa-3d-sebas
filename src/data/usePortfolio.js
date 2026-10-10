import { useEffect } from 'react'
import { create } from 'zustand'
import fallback from './portfolio.fallback.json'

// Fuente de verdad de los proyectos: el projects.json que guarda el panel de la porta
// (juansebastianfernandez-dev.vercel.app/panel). Cargás un proyecto ahí y aparece en las dos.
// Se puede pisar con VITE_PROJECTS_URL en Vercel.
export const PROJECTS_URL =
  import.meta.env.VITE_PROJECTS_URL ||
  'https://juansebastianfernandez-dev.vercel.app/data/projects.json'
export const PORTA_PANEL_URL = new URL('/panel/', PROJECTS_URL).href

// Modo vista previa (build estático sin red externa): imágenes y repos empaquetados al lado
export const PREVIEW = import.meta.env.VITE_PREVIEW === '1'
const BASE = import.meta.env.BASE_URL

const CACHE_KEY = 'casa-jsf:data-v2'
const GH_CACHE_KEY = 'casa-jsf:github'

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* modo privado o storage bloqueado: seguimos sin caché */
  }
}

// Convierte rutas relativas ("/img/p/x.webp") en absolutas contra la porta.
export function abs(data, path) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  if (PREVIEW && path.startsWith('/img/')) return BASE + path.slice(1)
  return (data?.baseUrl || '').replace(/\/$/, '') + path
}

/* ─────────── Proyectos de la porta → formato de la casa ─────────── */

// Colores de bloque de la porta (paleta Wada Nº 166), por si un proyecto no trae color propio
const ACCENT = { coral: '#F48067', sage: '#D1C58B', peach: '#F8B384' }

export function fromPorta(json) {
  const L = (o) => (o && (o.es || o.en)) || ''
  const repoOf = (url) => (url || '').match(/github\.com\/[^/]+\/([^/#?]+)/)?.[1]?.replace(/\.git$/, '') || null
  return (json.projects || []).map((p) => {
    const c = p.casa || {}
    return {
      id: p.id,
      source: 'porta',
      title: L(p.name),
      kind: L(json.types?.[p.type]) || 'Sitio',
      label: L(p.badge) || undefined,
      status: c.status || (p.live ? 'live' : 'wip'),
      featured: !!p.featured,
      prop: c.prop || 'box',
      color: c.color || ACCENT[p.accent] || '#FF6A2B',
      context: L(p.kicker) || undefined,
      summary: L(p.context) || undefined,
      solved: p.solved?.es || [],
      stack: p.stack || [],
      tags: [L(json.origins?.[p.origin]), ...(p.focus || []).map((f) => L(json.focus?.[f]))].filter(Boolean),
      live: p.live || null,
      code: p.code || null,
      repo: repoOf(p.code),
      images: { desktop: `/img/p/${p.id}-d-1440.webp`, mobile: `/img/p/${p.id}-m-780.webp` },
    }
  })
}

// Contenido general (persona, skills, contacto) + proyectos de la porta.
// Los proyectos cargados solo desde el baño (Supabase) se suman al final; los de la copia
// local no, así lo que borrás en la porta no reaparece en la casa.
function compose({ base, baseLive, porta }) {
  if (!porta) return base
  const ids = new Set(porta.map((p) => p.id))
  const extra = baseLive ? (base.projects || []).filter((p) => p.source !== 'porta' && !ids.has(p.id)) : []
  return { ...base, projects: [...porta, ...extra] }
}

const cached = !PREVIEW && readCache(CACHE_KEY)
const initial = {
  base: cached?.base || fallback,
  baseLive: !!cached?.baseLive,
  porta: cached?.porta || null,
}

export const useData = create(() => ({
  ...initial,
  portfolio: compose(initial),
  source: cached ? 'cache' : 'local', // 'local' | 'cache' | 'live'
  github: readCache(GH_CACHE_KEY)?.repos || [],
  githubStatus: 'idle', // idle | loading | ok | error
}))

function update(patch) {
  const next = { ...useData.getState(), ...patch }
  const parts = { base: next.base, baseLive: next.baseLive, porta: next.porta }
  useData.setState({ ...patch, portfolio: compose(parts), source: next.porta || next.baseLive ? 'live' : next.source })
  writeCache(CACHE_KEY, parts)
}

let started = false

export function useLoadData() {
  useEffect(() => {
    if (started) return
    started = true

    const getJSON = (url, opts) =>
      fetch(url, { cache: 'no-cache', ...opts }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))

    // 1) Proyectos: el projects.json de la porta (lo que guarda su panel)
    if (!PREVIEW) {
      getJSON(PROJECTS_URL)
        .then((json) => {
          if (!Array.isArray(json?.projects)) throw new Error('formato inválido')
          update({ porta: fromPorta(json) })
        })
        .catch(() => {
          // Sin conexión: quedan los últimos que vimos, o la copia local
        })
    }

    // 2) Persona, skills y contacto: lo que editás desde el baño (Supabase), si está configurado
    ;(PREVIEW ? Promise.reject() : getJSON('/api/content', { credentials: 'same-origin' }).then((j) => j.data))
      .then((json) => {
        if (!json?.person) throw new Error('formato inválido')
        update({ base: json, baseLive: true })
      })
      .catch(() => {
        // Sin Supabase: queda la copia local
      })

    // 3) GitHub: primero la función de Vercel (cacheada), si no la API pública directa
    useData.setState({ githubStatus: 'loading' })
    const user = useData.getState().portfolio.githubUser || 'Seba-fernandez'
    if (PREVIEW) return useData.setState({ githubStatus: 'error' })
    fetch('/api/github')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => j.repos)
      .catch(() =>
        fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`)
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((repos) =>
            repos
              .filter((x) => !x.fork && !x.archived)
              .map((x) => ({
                name: x.name,
                description: x.description,
                url: x.html_url,
                homepage: x.homepage || null,
                language: x.language,
                topics: x.topics || [],
                stars: x.stargazers_count,
                pushedAt: x.pushed_at,
              }))
          )
      )
      .then((repos) => {
        useData.setState({ github: repos, githubStatus: 'ok' })
        writeCache(GH_CACHE_KEY, { repos, at: Date.now() })
      })
      .catch(() => useData.setState({ githubStatus: 'error' }))
  }, [])
}

export function timeAgo(iso) {
  if (!iso) return ''
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  const steps = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Infinity, 'year'],
  ]
  let v = -s
  for (const [k, unit] of steps) {
    if (Math.abs(v) < k) return rtf.format(Math.round(v), unit)
    v /= k
  }
  return ''
}

/* ─────────── Guardar cambios (solo dueño) ─────────── */
// `mutate` recibe una copia del contenido y la modifica; si el servidor acepta, se aplica en la casa.
// Los proyectos de la porta no se guardan acá: se editan en su panel (son la fuente de verdad).
export async function saveContent(mutate) {
  const next = structuredClone(useData.getState().portfolio)
  mutate(next)
  next.projects = (next.projects || []).filter((p) => p.source !== 'porta')
  const r = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ data: next }),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.message || (r.status === 401 ? 'Tu sesión venció: escaneá la huella otra vez' : 'No se pudo guardar'))
  update({ base: j.data, baseLive: true })
  return useData.getState().portfolio
}
