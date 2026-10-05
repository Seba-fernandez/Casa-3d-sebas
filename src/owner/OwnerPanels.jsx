import { useState } from 'react'
import { useGame } from '../store'
import { useData } from '../data/usePortfolio'
import { CARRY_INFO, describe, applyDrop, list } from './changes'
import { Field, ProjectForm, AboutForm, projectFromForm, useOwnerSave, SKILL_PROPS } from './forms'
import { logout } from './api'

const OPTIONS = [
  { id: 'skill', title: 'Agregar una skill', sub: 'Te doy un frasquito para dejar en un estante' },
  { id: 'category', title: 'Nuevo estante de skills', sub: 'Un cajón para el banco de trabajo' },
  { id: 'project', title: 'Nuevo proyecto', sub: 'Una caja para la sala de Proyectos' },
  { id: 'about', title: 'Editar Sobre mí', sub: 'Un librito para tu escritorio' },
]

function give(kind, label, payload) {
  const g = useGame.getState()
  g.setCarry({ kind, label, payload })
  g.showToast(`Llevás un ${CARRY_INFO[kind].thing}. ${CARRY_INFO[kind].where}.`, 'info')
}

/* Espejo del baño: elegís qué cambiar, escribís, y la casa te da el objeto para llevar */
export function ConsolePanel() {
  const [mode, setMode] = useState(null)
  const close = useGame((s) => s.closePanel)
  const carry = useGame((s) => s.carry)
  const person = useData((s) => s.portfolio.person)
  const [skill, setSkill] = useState('')
  const [cat, setCat] = useState({ category: '', items: '', learning: false, prop: 'blocks' })

  return (
    <>
      <p className="eyebrow">Baño privado · modo dueño</p>
      <h2 id="panel-title">¿Qué cambiamos hoy?</h2>

      {carry && (
        <p className="note">
          Ya estás llevando un {CARRY_INFO[carry.kind].thing} ({carry.label}). Si elegís otra cosa, lo cambiás por esta.
        </p>
      )}

      {!mode && (
        <>
          <div className="choices">
            {OPTIONS.map((o) => (
              <button key={o.id} className="choice" onClick={() => setMode(o.id)}>
                <strong>{o.title}</strong>
                <span>{o.sub}</span>
              </button>
            ))}
          </div>
          <p className="muted small">
            Para corregir algo que ya existe, tocá el objeto en su sala (un estante, un pedestal, tu escritorio): en modo dueño vas a ver el botón Editar.
          </p>
          <div className="links">
            <button className="btn btn-ghost" onClick={async () => { close(); await logout() }}>Salir del modo dueño</button>
          </div>
        </>
      )}

      {mode === 'skill' && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            const name = skill.trim()
            if (!name) return
            give('skill', name, { name })
            close()
          }}
        >
          <Field label="¿Qué skill agregás?" hint="Después elegís el estante soltándolo ahí">
            {(id) => <input id={id} value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="TypeScript" autoFocus required />}
          </Field>
          <div className="links">
            <button className="btn btn-primary" type="submit">Agarrar frasquito</button>
            <button className="btn" type="button" onClick={() => setMode(null)}>Volver</button>
          </div>
        </form>
      )}

      {mode === 'category' && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            const items = list(cat.items)
            if (!cat.category.trim()) return
            give('category', cat.category.trim(), { ...cat, category: cat.category.trim(), items })
            close()
          }}
        >
          <Field label="Nombre del estante">
            {(id) => <input id={id} value={cat.category} onChange={(e) => setCat({ ...cat, category: e.target.value })} placeholder="Backend" autoFocus required />}
          </Field>
          <Field label="Skills" hint="Separadas por comas">
            {(id) => <input id={id} value={cat.items} onChange={(e) => setCat({ ...cat, items: e.target.value })} placeholder="Node.js, Express, PostgreSQL" />}
          </Field>
          <Field label="Objeto arriba del estante">
            {(id) => (
              <select id={id} value={cat.prop} onChange={(e) => setCat({ ...cat, prop: e.target.value })}>
                {SKILL_PROPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            )}
          </Field>
          <label className="check"><input type="checkbox" checked={cat.learning} onChange={(e) => setCat({ ...cat, learning: e.target.checked })} /> Lo estoy aprendiendo</label>
          <div className="links">
            <button className="btn btn-primary" type="submit">Agarrar cajón</button>
            <button className="btn" type="button" onClick={() => setMode(null)}>Volver</button>
          </div>
        </form>
      )}

      {mode === 'project' && (
        <ProjectForm
          submitLabel="Agarrar caja"
          onCancel={() => setMode(null)}
          onSubmit={(f) => {
            give('project', f.title.trim(), projectFromForm(f))
            close()
          }}
        />
      )}

      {mode === 'about' && (
        <AboutForm
          person={person}
          submitLabel="Agarrar librito"
          onCancel={() => setMode(null)}
          onSubmit={(fields) => {
            give('about', 'Sobre mí', fields)
            close()
          }}
        />
      )}
    </>
  )
}

/* Cartel al soltar: Guardar / Seguir llevando / Descartar */
export function SavePanel() {
  const pending = useGame((s) => s.pending)
  const data = useData((s) => s.portfolio)
  const { saving, error, run } = useOwnerSave()
  if (!pending) return <p>No hay nada para guardar.</p>
  const g = useGame.getState()

  const save = async () => {
    const ok = await run(applyDrop(pending.carry, pending.target), '¡Guardado! Ya se ve en la casa')
    if (ok) {
      g.setPending(null)
      g.setCarry(null)
    }
  }
  const keep = () => {
    g.setPending(null)
    g.closePanel()
  }
  const discard = () => {
    g.setPending(null)
    g.setCarry(null)
    g.showToast('Descartado', 'info')
  }

  return (
    <>
      <p className="eyebrow">Soltaste el {CARRY_INFO[pending.carry.kind].thing}</p>
      <h2 id="panel-title">¿Guardamos el cambio?</h2>
      <p className="lead">{describe(pending.carry, pending.target, data)}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="links">
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        <button className="btn" onClick={keep} disabled={saving}>Seguir llevándolo</button>
        <button className="btn btn-ghost" onClick={discard} disabled={saving}>Descartar</button>
      </div>
    </>
  )
}
