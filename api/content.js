// GET /api/content → el contenido actual de la casa (público)
// PUT /api/content { data } → guarda cambios (solo con sesión de dueño); deja la versión anterior en el historial
import { db, isOwner, noStore, validateContent } from './_lib/server.js'

export default async function handler(req, res) {
  noStore(res)
  let supa
  try {
    supa = db()
  } catch (err) {
    // falta configurar Supabase en Vercel: la casa usa su copia local
    return res.status(503).json({ error: 'not-configured', message: String(err.message || err) })
  }

  if (req.method === 'GET') {
    const { data, error } = await supa.from('casa_content').select('data, updated_at').eq('id', 'main').maybeSingle()
    if (error) return res.status(500).json({ error: 'server' })
    if (!data) return res.status(404).json({ error: 'empty' })
    res.setHeader('Access-Control-Allow-Origin', '*') // tu porta también puede leerlo
    return res.status(200).json({ data: data.data, updatedAt: data.updated_at })
  }

  if (req.method === 'PUT') {
    if (!(await isOwner(req))) return res.status(401).json({ error: 'owner-only' })
    const next = req.body?.data
    const problem = validateContent(next)
    if (problem) return res.status(400).json({ error: 'invalid', message: problem })

    const { data: prev } = await supa.from('casa_content').select('data').eq('id', 'main').maybeSingle()
    if (prev?.data) await supa.from('casa_content_history').insert({ data: prev.data })

    next.updated = new Date().toISOString().slice(0, 10)
    const { data, error } = await supa
      .from('casa_content')
      .upsert({ id: 'main', data: next, updated_at: new Date().toISOString() })
      .select('data, updated_at')
      .single()
    if (error) return res.status(500).json({ error: 'server', message: error.message })
    return res.status(200).json({ data: data.data, updatedAt: data.updated_at })
  }

  return res.status(405).json({ error: 'method' })
}
