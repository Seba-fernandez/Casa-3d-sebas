// Servidor local para /api (sin instalar Vercel CLI): node scripts/dev-api.js
// Vite reenvía /api a este puerto (ver vite.config.js). Lee variables de .env.local.
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const routes = {
  '/api/auth/begin': () => import('../api/auth/begin.js'),
  '/api/auth/finish': () => import('../api/auth/finish.js'),
  '/api/auth/me': () => import('../api/auth/me.js'),
  '/api/content': () => import('../api/content.js'),
  '/api/github': () => import('../api/github.js'),
}

const PORT = Number(process.env.API_PORT || 3001)

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    const load = routes[url.pathname]
    if (!load) return res.writeHead(404).end()
    let raw = ''
    for await (const chunk of req) raw += chunk
    req.query = Object.fromEntries(url.searchParams)
    try {
      req.body = raw ? JSON.parse(raw) : {}
    } catch {
      req.body = {}
    }
    res.status = (c) => ((res.statusCode = c), res)
    res.json = (o) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(o))
    }
    const { default: handler } = await load()
    await handler(req, res)
  })
  .listen(PORT, () => console.log(`API local en http://localhost:${PORT}`))
