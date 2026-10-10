import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { input, useGame } from '../store'
import { useData, abs, timeAgo, PREVIEW, PORTA_PANEL_URL } from '../data/usePortfolio'
import { travel } from './transition'
import { ConsolePanel, SavePanel } from '../owner/OwnerPanels'
import { ProjectForm, AboutForm, SkillsEditor, projectFromForm, useOwnerSave } from '../owner/forms'

/* Barra de edición que solo ve el dueño */
function OwnerBar({ onEdit, label = 'Editar', href }) {
  const owner = useGame((s) => s.owner)
  if (!owner) return null
  return (
    <div className="owner-bar">
      <span>Modo dueño</span>
      {href ? (
        <a className="btn btn-small" href={href} target="_blank" rel="noopener noreferrer">{label}</a>
      ) : (
        <button className="btn btn-small" onClick={onEdit}>{label}</button>
      )}
    </div>
  )
}

const STATUS = { live: 'Live', wip: 'En progreso', pending: 'Pendiente' }

function Links({ items }) {
  return (
    <div className="links">
      {items.filter((l) => l.href).map((l) => (
        <a key={l.label} className={'btn' + (l.primary ? ' btn-primary' : '')} href={l.href} target={l.self ? undefined : '_blank'} rel="noopener noreferrer" download={l.download}>
          {l.label}
        </a>
      ))}
    </div>
  )
}

function Chips({ items, tone }) {
  if (!items?.length) return null
  return (
    <ul className={'chips ' + (tone || '')}>
      {items.map((x) => <li key={x}>{x}</li>)}
    </ul>
  )
}

/* ─────────── Contenido de cada panel ─────────── */

function ProjectPanel({ id }) {
  const data = useData((s) => s.portfolio)
  const repos = useData((s) => s.github)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { saving, error, run } = useOwnerSave()
  const p = data.projects.find((x) => x.id === id)
  if (!p) return <p>Este proyecto ya no está en la casa.</p>
  const repo = p.repo && repos.find((r) => r.name.toLowerCase() === p.repo.toLowerCase())

  if (editing) {
    return (
      <>
        <p className="eyebrow">Editando proyecto</p>
        <h2 id="panel-title">{p.title}</h2>
        <ProjectForm
          initial={p}
          submitLabel="Guardar"
          saving={saving}
          error={error}
          onCancel={() => setEditing(false)}
          onSubmit={async (f) => {
            const ok = await run((d) => {
              const i = d.projects.findIndex((x) => x.id === id)
              d.projects[i] = projectFromForm(f, d.projects[i])
            }, 'Proyecto actualizado')
            if (ok) setEditing(false)
          }}
        />
        <div className="danger">
          {!confirmDelete ? (
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(true)}>Eliminar proyecto</button>
          ) : (
            <>
              <span>¿Seguro? Se saca de la casa.</span>
              <button
                className="btn btn-danger"
                disabled={saving}
                onClick={async () => {
                  const ok = await run((d) => (d.projects = d.projects.filter((x) => x.id !== id)), 'Proyecto eliminado')
                  if (ok) useGame.getState().closePanel()
                }}
              >
                Sí, eliminar
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>No</button>
            </>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {p.source === 'porta' ? (
        // Viene de la porta: se edita en su panel y aparece en las dos
        <OwnerBar href={PORTA_PANEL_URL} label="Editar en el panel de la porta ↗" />
      ) : (
        <OwnerBar onEdit={() => setEditing(true)} />
      )}
      <p className="eyebrow">
        <span className={'dot dot-' + p.status} /> {STATUS[p.status] || p.status} · {p.label || p.kind}
      </p>
      <h2 id="panel-title">{p.title}</h2>
      {p.context && <p className="muted">{p.context}</p>}
      <figure className="shots">
        {p.images?.desktop && <img src={abs(data, p.images.desktop)} alt={`Captura de escritorio de ${p.title}`} loading="lazy" width="1440" height="900" />}
        {p.images?.mobile && <img className="m" src={abs(data, p.images.mobile)} alt={`Captura mobile de ${p.title}`} loading="lazy" width="390" height="844" />}
      </figure>
      {p.summary && <p>{p.summary}</p>}
      {p.solved?.length > 0 && (
        <>
          <h3>Qué resolví</h3>
          <ol className="solved">{p.solved.map((s) => <li key={s}>{s}</li>)}</ol>
        </>
      )}
      {p.stack?.length > 0 && (<><h3>Stack</h3><Chips items={p.stack} /></>)}
      <Chips items={p.tags} tone="soft" />
      {repo && <p className="muted small">GitHub · último push {timeAgo(repo.pushedAt)}{repo.language ? ` · ${repo.language}` : ''}</p>}
      <Links items={[{ label: 'Ver en vivo ↗', href: p.live, primary: true }, { label: 'Código ↗', href: p.code }]} />
    </>
  )
}

function GithubPanel() {
  const repos = useData((s) => s.github)
  const status = useData((s) => s.githubStatus)
  const contact = useData((s) => s.portfolio.contact)
  return (
    <>
      <p className="eyebrow">Arcade · en vivo desde GitHub</p>
      <h2 id="panel-title">Mis repos</h2>
      {status === 'loading' && !repos.length && <p className="muted">Cargando repos…</p>}
      {status === 'error' && !repos.length && (
        <p className="muted">
          {PREVIEW
            ? 'Esta vista previa no se conecta a GitHub. En tu deploy de Vercel esta máquina muestra tus repos en vivo.'
            : 'GitHub no respondió ahora. Probá en un rato o mirá el perfil directo.'}
        </p>
      )}
      <ul className="repos">
        {repos.slice(0, 12).map((r) => (
          <li key={r.name}>
            <a href={r.url} target="_blank" rel="noopener noreferrer">
              <strong>{r.name}</strong>
              {r.description && <span>{r.description}</span>}
              <small>
                {r.language || '—'} · {timeAgo(r.pushedAt)}{r.stars ? ` · ★ ${r.stars}` : ''}
              </small>
            </a>
          </li>
        ))}
      </ul>
      <Links items={[{ label: 'Perfil de GitHub ↗', href: contact.github, primary: true }]} />
    </>
  )
}

function SkillsPanel({ index = 0 }) {
  const skills = useData((s) => s.portfolio.skills)
  const [i, setI] = useState(index)
  const [editing, setEditing] = useState(false)
  const cat = skills[i] || skills[0]
  if (!cat) return <p>No hay skills cargadas.</p>
  if (editing) {
    return (
      <>
        <p className="eyebrow">Corrigiendo estante</p>
        <h2 id="panel-title">{cat.category}</h2>
        <SkillsEditor index={Math.min(i, skills.length - 1)} onDone={() => setEditing(false)} />
      </>
    )
  }
  return (
    <>
      <OwnerBar onEdit={() => setEditing(true)} label="Corregir estante" />
      <p className="eyebrow">Taller de skills</p>
      <h2 id="panel-title">{cat.category}</h2>
      <div className="tabs" role="tablist" aria-label="Categorías">
        {skills.map((c, k) => (
          <button key={c.category} role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} onClick={() => setI(k)}>
            {c.category}
          </button>
        ))}
      </div>
      <Chips items={cat.items} tone={cat.learning ? 'learning' : ''} />
      {cat.learning && <p className="muted small">Lo estoy aprendiendo ahora: todavía no lo vendo como experiencia.</p>}
    </>
  )
}

function AboutPanel() {
  const person = useData((s) => s.portfolio.person)
  const [editing, setEditing] = useState(false)
  const { saving, error, run } = useOwnerSave()
  if (editing) {
    return (
      <>
        <p className="eyebrow">Editando Sobre mí</p>
        <h2 id="panel-title">{person.name}</h2>
        <AboutForm
          person={person}
          submitLabel="Guardar"
          saving={saving}
          error={error}
          onCancel={() => setEditing(false)}
          onSubmit={async (fields) => {
            const ok = await run((d) => Object.assign(d.person, fields), 'Sobre mí actualizado')
            if (ok) setEditing(false)
          }}
        />
      </>
    )
  }
  return (
    <>
      <OwnerBar onEdit={() => setEditing(true)} />
      <p className="eyebrow">{person.location} · {person.coords}</p>
      <h2 id="panel-title">{person.name}</h2>
      <p className="lead">{person.tagline}</p>
      <p>{person.bio}</p>
      {person.manifesto && <blockquote>{person.manifesto}</blockquote>}
      <dl className="stats">
        {(person.stats || []).map((s) => (
          <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
        ))}
      </dl>
      {person.available && <p className="avail"><span className="dot dot-live" /> {person.availability}</p>}
    </>
  )
}

function ExperiencePanel() {
  const exp = useData((s) => s.portfolio.person.experience) || []
  return (
    <>
      <p className="eyebrow">Corcho</p>
      <h2 id="panel-title">Experiencia</h2>
      {exp.map((e) => (
        <article key={e.title} className="exp">
          <h3>{e.title}</h3>
          <p className="muted">{e.period} · {e.place}</p>
          <ul>{e.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
        </article>
      ))}
    </>
  )
}

function CvPanel() {
  const data = useData((s) => s.portfolio)
  const { contact, person } = data
  return (
    <>
      <p className="eyebrow">Carpeta</p>
      <h2 id="panel-title">CV y números</h2>
      <dl className="stats">
        {(person.stats || []).map((s) => (
          <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
        ))}
      </dl>
      <Links
        items={[
          { label: 'CV en español ↓', href: abs(data, contact.cv?.es), primary: true },
          { label: 'CV in English ↓', href: abs(data, contact.cv?.en) },
          { label: 'LinkedIn ↗', href: contact.linkedin },
        ]}
      />
    </>
  )
}

function ContactPanel() {
  const data = useData((s) => s.portfolio)
  const { contact, person } = data
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* sin permiso de portapapeles */
    }
  }
  return (
    <>
      <p className="eyebrow">Buzón</p>
      <h2 id="panel-title">Hablemos</h2>
      <p>{person.availability}</p>
      <p className="email">
        <a href={`mailto:${contact.email}?subject=${encodeURIComponent('Hola Sebastián')}`}>{contact.email}</a>
        <button className="btn btn-ghost" onClick={copy}>{copied ? '¡Copiado!' : 'Copiar'}</button>
      </p>
      <span className="sr-only" aria-live="polite">{copied ? 'Email copiado' : ''}</span>
      <Links
        items={[
          { label: 'Escribirme ↗', href: `mailto:${contact.email}`, primary: true, self: true },
          { label: 'LinkedIn ↗', href: contact.linkedin },
          { label: 'GitHub ↗', href: contact.github },
          { label: 'CV ↓', href: abs(data, contact.cv?.es) },
        ]}
      />
    </>
  )
}

function WelcomePanel() {
  const person = useData((s) => s.portfolio.person)
  const close = useGame((s) => s.closePanel)
  const go = (room) => {
    close()
    travel(room, 'from:hall')
  }
  return (
    <>
      <p className="eyebrow">Pizarrón</p>
      <h2 id="panel-title">¡Hola! Soy {person.short}</h2>
      <p className="lead">{person.tagline}</p>
      <p>Esta es mi casa: cada puerta es una parte de mi portafolio. Caminá, curioseá y tocá lo que tenga una flechita naranja.</p>
      <ul className="howto">
        <li><kbd>W A S D</kbd> o flechas para caminar · <kbd>Shift</kbd> para correr</li>
        <li>Arrastrá con el mouse para girar la cámara · rueda para acercar</li>
        <li><kbd>E</kbd> para interactuar y también para cerrar carteles · <kbd>M</kbd> mapa · <kbd>Esc</kbd> o el botón atrás también cierran</li>
        <li>En el celu: joystick a la izquierda, botón A a la derecha (con un cartel abierto se vuelve ✕ y lo cierra)</li>
      </ul>
      <div className="links">
        <button className="btn btn-primary" onClick={() => go('proyectos')}>Ir a Proyectos</button>
        <button className="btn" onClick={() => go('skills')}>Skills</button>
        <button className="btn" onClick={() => go('sobremi')}>Sobre mí</button>
      </div>
    </>
  )
}

function ExitPanel() {
  const contact = useData((s) => s.portfolio.contact)
  const close = useGame((s) => s.closePanel)
  return (
    <>
      <p className="eyebrow">Puerta de entrada</p>
      <h2 id="panel-title">¿Salís a la porta clásica?</h2>
      <p>Mi portafolio de siempre, con la misma info en formato web tradicional. Se abre en otra pestaña: la casa te espera acá.</p>
      <div className="links">
        <a className="btn btn-primary" href={contact.portfolio} target="_blank" rel="noopener noreferrer" onClick={close}>Abrir porta ↗</a>
        <button className="btn" onClick={close}>Me quedo</button>
      </div>
    </>
  )
}

const PANELS = {
  project: ProjectPanel,
  github: GithubPanel,
  skills: SkillsPanel,
  about: AboutPanel,
  experience: ExperiencePanel,
  cv: CvPanel,
  contact: ContactPanel,
  welcome: WelcomePanel,
  exit: ExitPanel,
  console: ConsolePanel,
  save: SavePanel,
}

/* ─────────── Contenedor modal accesible ─────────── */
export function PanelHost() {
  const panel = useGame((s) => s.panel)
  const close = useGame((s) => s.closePanel)
  const box = useRef()
  const closeBtn = useRef()
  const lastFocus = useRef(null)

  useEffect(() => {
    if (panel) {
      input.keys.clear()
      lastFocus.current = document.activeElement
      requestAnimationFrame(() => closeBtn.current?.focus())
      if (box.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.fromTo(box.current, { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' })
      }
    } else {
      lastFocus.current?.focus?.()
    }
  }, [panel])

  if (!panel) return null
  const Body = PANELS[panel.type]

  const trap = (e) => {
    if (e.key !== 'Tab') return
    const f = box.current.querySelectorAll('a[href], button:not([disabled]), input, select, textarea')
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <section ref={box} className="panel" role="dialog" aria-modal="true" aria-labelledby="panel-title" onKeyDown={trap}>
        <button ref={closeBtn} className="close" onClick={close} aria-label="Cerrar panel (Esc)">✕</button>
        <div className="panel-body">{Body ? <Body {...panel} /> : null}</div>
      </section>
    </div>
  )
}
