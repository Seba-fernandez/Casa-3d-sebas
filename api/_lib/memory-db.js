// Imitación mínima del cliente de Supabase, en memoria. Solo para desarrollo y pruebas.
import { readFileSync } from 'node:fs'

const tables = globalThis.__casaMemoryTables || (globalThis.__casaMemoryTables = {
  casa_content: [],
  casa_content_history: [],
  casa_owner_credentials: [],
})

if (!tables.casa_content.length) {
  try {
    const seed = JSON.parse(readFileSync(new URL('../../src/data/portfolio.fallback.json', import.meta.url), 'utf8'))
    tables.casa_content.push({ id: 'main', data: seed, updated_at: new Date().toISOString() })
  } catch {
    /* sin semilla */
  }
}

function query(name) {
  const rows = tables[name]
  const filters = []
  let op = 'select'
  let payload = null
  const run = () => {
    const match = (r) => filters.every(([c, v]) => r[c] === v)
    if (op === 'insert') {
      ;[].concat(payload).forEach((p) => rows.push({ created_at: new Date().toISOString(), ...structuredClone(p) }))
      return { data: payload, error: null }
    }
    if (op === 'update') {
      rows.filter(match).forEach((r) => Object.assign(r, structuredClone(payload)))
      return { data: null, error: null }
    }
    if (op === 'upsert') {
      const i = rows.findIndex((r) => r.id === payload.id)
      if (i >= 0) rows[i] = { ...rows[i], ...structuredClone(payload) }
      else rows.push(structuredClone(payload))
      return { data: rows.filter((r) => r.id === payload.id).map((r) => structuredClone(r)), error: null }
    }
    return { data: rows.filter(match).map((r) => structuredClone(r)), error: null }
  }
  const api = {
    select: () => api,
    insert: (p) => ((op = 'insert'), (payload = p), api),
    update: (p) => ((op = 'update'), (payload = p), api),
    upsert: (p) => ((op = 'upsert'), (payload = p), api),
    eq: (c, v) => (filters.push([c, v]), api),
    maybeSingle: async () => {
      const r = run()
      return { data: r.data?.[0] ?? null, error: null }
    },
    single: async () => {
      const r = run()
      return { data: r.data?.[0] ?? null, error: r.data?.length ? null : { message: 'not found' } }
    },
    then: (ok, ko) => Promise.resolve(run()).then(ok, ko),
  }
  return api
}

export function memoryDb() {
  return { from: (name) => query(name) }
}
