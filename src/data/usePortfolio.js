import { useEffect } from 'react'
import { create } from 'zustand'
import fallback from './portfolio.fallback.json'

// Dónde vive la fuente de verdad. Se puede pisar con VITE_PORTFOLIO_URL en Vercel.
export const PORTFOLIO_URL =
  import.meta.env.VITE_PORTFOLIO_URL ||
  'https://juansebastianfernandez-dev.vercel.app/data/portfolio.json'

// Modo vista previa (build estático sin red externa): imágenes y repos empaquetados al lado
export const PREVIEW = import.meta.env.VITE_PREVIEW === '1'
const BASE = import.meta.env.BASE_URL

const CACHE_KEY = 'casa-jsf:portfolio'
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

export const useData = create(() => ({
  portfolio: (!PREVIEW && readCache(CACHE_KEY)) || fallback,
  source: 'local', // 'local' | 'cache' | 'live'
  github: readCache(GH_CACHE_KEY)?.repos || [],
  githubStatus: 'idle', // idle | loading | ok | error
}))

let started = false

export function useLoadData() {
  useEffect(() => {
    if (started) return
    started = true

    // 1) portfolio.json desde la porta (sin caché del navegador: siempre la última versión)
    ;(PREVIEW ? Promise.reject() : fetch(PORTFOLIO_URL, { cache: 'no-cache' }))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((json) => {
        if (!json?.projects) throw new Error('formato inválido')
        useData.setState({ portfolio: json, source: 'live' })
        writeCache(CACHE_KEY, json)
      })
      .catch(() => {
        // Sin conexión o la porta todavía no publica el JSON: queda la copia local
      })

    // 2) GitHub: primero la función de Vercel (cacheada), si no la API pública directa
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
