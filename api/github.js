// Función serverless de Vercel: GET /api/github
// Trae tus repos públicos, los resume y los cachea 1 h en el CDN de Vercel.
// Opcional: definí GITHUB_TOKEN en Vercel (Settings → Environment Variables)
// para subir el límite de la API de 60 a 5000 pedidos por hora.

const USER = process.env.GITHUB_USER || 'Seba-fernandez'

export default async function handler(req, res) {
  const headers = {
    'User-Agent': 'casa-jsf',
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  try {
    const r = await fetch(
      `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&type=owner`,
      { headers }
    )
    if (!r.ok) throw new Error(`GitHub respondió ${r.status}`)
    const repos = await r.json()

    const slim = repos
      .filter((repo) => !repo.fork && !repo.archived)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage || null,
        language: repo.language,
        topics: repo.topics || [],
        stars: repo.stargazers_count,
        pushedAt: repo.pushed_at,
      }))

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
    res.status(200).json({ user: USER, fetchedAt: new Date().toISOString(), repos: slim })
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=60')
    res.status(502).json({ error: String(err.message || err), repos: [] })
  }
}
