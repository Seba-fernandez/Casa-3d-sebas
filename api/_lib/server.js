// Utilidades compartidas por las funciones de /api (los archivos con "_" no son rutas).
import { SignJWT, jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

const SESSION_COOKIE = 'casa_owner'
const CHALLENGE_COOKIE = 'casa_chal'

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Falta SESSION_SECRET (mínimo 32 caracteres)')
  return new TextEncoder().encode(s)
}

import { memoryDb } from './memory-db.js'

export function db() {
  // Solo para desarrollo/pruebas locales: base en memoria (se borra al reiniciar)
  if (process.env.CASA_MEMORY_DB === '1') return memoryDb()
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

/* Dominio para las passkeys: RP_ID si está definido, si no el host del pedido */
export function rp(req) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0]
  const rpID = process.env.RP_ID || host
  // en local el puerto cambia según el servidor de desarrollo: se usa el Origin del navegador
  const localOrigin = /^http:\/\/localhost(:\d+)?$/.test(req.headers.origin || '') ? req.headers.origin : 'http://localhost:5173'
  const origin = process.env.RP_ORIGIN || (rpID === 'localhost' ? localOrigin : `https://${rpID}`)
  return { rpID, origin, rpName: 'Casa de Sebas' }
}

export function readCookies(req) {
  const out = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

function cookie(name, value, maxAge, req) {
  const secure = rp(req).rpID !== 'localhost' ? '; Secure' : ''
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`
}

export async function sign(payload, ttl) {
  return new SignJWT(payload).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(ttl).sign(secret())
}
export async function verify(token) {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch {
    return null
  }
}

export async function setChallenge(res, req, data) {
  const t = await sign(data, '5m')
  res.setHeader('Set-Cookie', cookie(CHALLENGE_COOKIE, t, 300, req))
}
export async function readChallenge(req) {
  const t = readCookies(req)[CHALLENGE_COOKIE]
  return t ? verify(t) : null
}

export async function startSession(res, req) {
  const t = await sign({ sub: 'owner' }, '12h')
  res.setHeader('Set-Cookie', [cookie(SESSION_COOKIE, t, 60 * 60 * 12, req), cookie(CHALLENGE_COOKIE, '', 0, req)])
}
export function endSession(res, req) {
  res.setHeader('Set-Cookie', cookie(SESSION_COOKIE, '', 0, req))
}
export async function isOwner(req) {
  const t = readCookies(req)[SESSION_COOKIE]
  const p = t ? await verify(t) : null
  return p?.sub === 'owner'
}

/* Compara códigos sin filtrar información por el tiempo de respuesta */
export function sameCode(a, b) {
  if (!a || !b) return false
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

export function noStore(res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* Validación liviana del documento antes de guardarlo */
export function validateContent(data) {
  if (!data || typeof data !== 'object') return 'El contenido no es un objeto'
  if (!Array.isArray(data.projects)) return 'Falta la lista de proyectos'
  if (!Array.isArray(data.skills)) return 'Falta la lista de skills'
  if (!data.person || typeof data.person !== 'object') return 'Faltan tus datos personales'
  if (JSON.stringify(data).length > 300_000) return 'El contenido es demasiado grande'
  for (const p of data.projects) {
    if (!p.id || !p.title) return 'Hay un proyecto sin id o sin título'
    if (p.status && !['live', 'wip', 'pending'].includes(p.status)) return `Estado inválido en ${p.title}`
  }
  for (const c of data.skills) {
    if (!c.category || !Array.isArray(c.items)) return 'Hay una categoría de skills mal formada'
  }
  return null
}
