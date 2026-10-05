// GET /api/auth/me → { owner }   ·   POST /api/auth/me?logout → cierra la sesión
import { isOwner, endSession, noStore } from '../_lib/server.js'

export default async function handler(req, res) {
  noStore(res)
  if (req.method === 'POST' && 'logout' in (req.query || {})) {
    endSession(res, req)
    return res.status(200).json({ owner: false })
  }
  try {
    return res.status(200).json({ owner: await isOwner(req) })
  } catch {
    return res.status(200).json({ owner: false })
  }
}
