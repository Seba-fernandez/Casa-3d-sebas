import { useEffect, useRef } from 'react'
import { useGame } from '../store'
import { useData, abs, timeAgo } from '../data/usePortfolio'

/* Versión clásica: la misma info en HTML semántico, accesible y sin WebGL */
export function Classic({ canPlay }) {
  const data = useData((s) => s.portfolio)
  const repos = useData((s) => s.github)
  const setClassic = useGame((s) => s.setClassic)
  const h1 = useRef()
  const { person, contact, projects, skills } = data

  useEffect(() => {
    h1.current?.focus()
  }, [])

  return (
    <div className="classic">
      <header className="c-head">
        <a className="c-logo" href="#c-main">JSF®</a>
        <nav aria-label="Secciones">
          <a href="#c-proyectos">Proyectos</a>
          <a href="#c-skills">Skills</a>
          <a href="#c-sobre">Sobre mí</a>
          <a href="#c-contacto">Contacto</a>
        </nav>
        {canPlay && <button className="btn btn-primary" onClick={() => setClassic(false)}>Volver a la casa 3D</button>}
      </header>

      <main id="c-main">
        <section className="c-hero">
          <p className="eyebrow">{person.coords} · {person.location}</p>
          <h1 ref={h1} tabIndex={-1}>{person.name}</h1>
          <p className="lead">{person.tagline}</p>
          <p>{person.bio}</p>
        </section>

        <section id="c-proyectos" aria-labelledby="h-proy">
          <h2 id="h-proy">Proyectos</h2>
          <div className="c-grid">
            {projects.map((p) => (
              <article key={p.id} className="c-card">
                {p.images?.desktop && <img src={abs(data, p.images.desktop)} alt="" loading="lazy" width="1440" height="900" />}
                <p className="eyebrow"><span className={'dot dot-' + p.status} /> {p.kind}</p>
                <h3>{p.title}</h3>
                {p.summary && <p>{p.summary}</p>}
                {p.stack && <ul className="chips">{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>}
                <p className="links">
                  {p.live && <a className="btn btn-primary" href={p.live} target="_blank" rel="noopener noreferrer">Ver en vivo<span className="sr-only"> {p.title}</span> ↗</a>}
                  {p.code && <a className="btn" href={p.code} target="_blank" rel="noopener noreferrer">Código<span className="sr-only"> de {p.title}</span> ↗</a>}
                </p>
              </article>
            ))}
          </div>
          {repos.length > 0 && (
            <>
              <h3>Últimos repos en GitHub</h3>
              <ul className="repos">
                {repos.slice(0, 6).map((r) => (
                  <li key={r.name}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <strong>{r.name}</strong>
                      {r.description && <span>{r.description}</span>}
                      <small>{r.language || '—'} · {timeAgo(r.pushedAt)}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section id="c-skills" aria-labelledby="h-skills">
          <h2 id="h-skills">Skills</h2>
          <div className="c-grid c-grid-sm">
            {skills.map((c) => (
              <div key={c.category} className="c-card">
                <h3>{c.category}</h3>
                <ul className={'chips ' + (c.learning ? 'learning' : '')}>{c.items.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section id="c-sobre" aria-labelledby="h-sobre">
          <h2 id="h-sobre">Sobre mí</h2>
          {person.manifesto && <blockquote>{person.manifesto}</blockquote>}
          <dl className="stats">
            {person.stats?.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
          </dl>
          {person.experience?.map((e) => (
            <article key={e.title} className="exp">
              <h3>{e.title}</h3>
              <p className="muted">{e.period} · {e.place}</p>
              <ul>{e.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
            </article>
          ))}
        </section>

        <section id="c-contacto" aria-labelledby="h-contacto">
          <h2 id="h-contacto">Contacto</h2>
          <p>{person.availability}</p>
          <p className="links">
            <a className="btn btn-primary" href={`mailto:${contact.email}`}>{contact.email}</a>
            <a className="btn" href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
            <a className="btn" href={contact.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a className="btn" href={abs(data, contact.cv?.es)}>CV ↓</a>
          </p>
        </section>
      </main>
      <footer className="c-foot">Diseñado y desarrollado por {person.name} · {person.location}</footer>
    </div>
  )
}
