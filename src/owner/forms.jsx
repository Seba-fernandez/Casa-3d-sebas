import { useId, useState } from 'react'
import { useGame } from '../store'
import { saveContent, useData } from '../data/usePortfolio'
import { list } from './changes'

export const PROJECT_PROPS = [
  ['racket', 'Paleta de pádel'],
  ['perfume', 'Perfumes'],
  ['mic', 'Micrófono'],
  ['court', 'Cancha'],
  ['coffee', 'Taza de café'],
  ['vinyl', 'Tocadiscos'],
  ['box', 'Caja ✳'],
]
export const SKILL_PROPS = [
  ['blocks', 'Bloques'],
  ['books', 'Libros'],
  ['gauge', 'Velocímetro'],
  ['heart', 'Corazón'],
  ['tools', 'Herramientas'],
  ['sprouts', 'Brotes'],
]

/* Guardado con estado de carga y error, y aviso al terminar */
export function useOwnerSave() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const run = async (mutate, okText = 'Guardado') => {
    setSaving(true)
    setError('')
    try {
      await saveContent(mutate)
      useGame.getState().showToast(okText)
      return true
    } catch (e) {
      setError(e.message || 'No se pudo guardar')
      return false
    } finally {
      setSaving(false)
    }
  }
  return { saving, error, run }
}

export function Field({ label, hint, children }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {typeof children === 'function' ? children(id) : children}
      {hint && <small>{hint}</small>}
    </div>
  )
}

export function FormActions({ saving, error, onCancel, saveLabel = 'Guardar', cancelLabel = 'Descartar' }) {
  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="links">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : saveLabel}</button>
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>{cancelLabel}</button>
      </div>
    </>
  )
}

/* ─────────── Proyecto ─────────── */
export function projectFromForm(f, base = {}) {
  return {
    ...base,
    title: f.title.trim(),
    kind: f.kind,
    status: f.status,
    featured: !!f.featured,
    prop: f.prop,
    color: f.color,
    summary: f.summary.trim() || undefined,
    live: f.live.trim() || null,
    code: f.code.trim() || null,
    repo: f.repo.trim() || null,
    stack: list(f.stack),
    tags: list(f.tags),
    images: f.image.trim() ? { ...(base.images || {}), desktop: f.image.trim() } : base.images,
  }
}

export function ProjectForm({ initial = {}, submitLabel, onSubmit, onCancel, saving, error }) {
  const [f, setF] = useState({
    title: initial.title || '',
    kind: initial.kind || 'Sitio',
    status: initial.status || 'wip',
    featured: !!initial.featured,
    prop: initial.prop || 'box',
    color: initial.color || '#FF6A2B',
    summary: initial.summary || '',
    live: initial.live || '',
    code: initial.code || '',
    repo: initial.repo || '',
    stack: (initial.stack || []).join(', '),
    tags: (initial.tags || []).join(', '),
    image: initial.images?.desktop || '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (f.title.trim()) onSubmit(f)
      }}
    >
      <Field label="Nombre del proyecto">{(id) => <input id={id} required value={f.title} onChange={set('title')} autoFocus />}</Field>
      <div className="row">
        <Field label="Tipo">
          {(id) => (
            <select id={id} value={f.kind} onChange={set('kind')}>
              {['Sitio', 'Landing', 'Tienda', 'App', 'Otro'].map((k) => <option key={k}>{k}</option>)}
            </select>
          )}
        </Field>
        <Field label="Estado">
          {(id) => (
            <select id={id} value={f.status} onChange={set('status')}>
              <option value="live">Live</option>
              <option value="wip">En curso</option>
              <option value="pending">Pendiente</option>
            </select>
          )}
        </Field>
      </div>
      <div className="row">
        <Field label="Objeto en la casa">
          {(id) => (
            <select id={id} value={f.prop} onChange={set('prop')}>
              {PROJECT_PROPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
        </Field>
        <Field label="Color">{(id) => <input id={id} type="color" value={f.color} onChange={set('color')} />}</Field>
      </div>
      <label className="check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> En pedestal grande (destacado)</label>
      <Field label="De qué se trata">{(id) => <textarea id={id} rows={3} value={f.summary} onChange={set('summary')} />}</Field>
      <Field label="Link en vivo">{(id) => <input id={id} type="url" placeholder="https://" value={f.live} onChange={set('live')} />}</Field>
      <div className="row">
        <Field label="Link al código">{(id) => <input id={id} type="url" placeholder="https://github.com/…" value={f.code} onChange={set('code')} />}</Field>
        <Field label="Repo (para ver el último commit)">{(id) => <input id={id} value={f.repo} onChange={set('repo')} />}</Field>
      </div>
      <Field label="Stack" hint="Separado por comas">{(id) => <input id={id} value={f.stack} onChange={set('stack')} />}</Field>
      <Field label="Etiquetas" hint="Separado por comas">{(id) => <input id={id} value={f.tags} onChange={set('tags')} />}</Field>
      <Field label="Captura" hint="Ruta en tu porta (/img/p/…) o URL completa">{(id) => <input id={id} value={f.image} onChange={set('image')} />}</Field>
      <FormActions saving={saving} error={error} onCancel={onCancel} saveLabel={submitLabel} />
    </form>
  )
}

/* ─────────── Sobre mí ─────────── */
export function AboutForm({ person, submitLabel, onSubmit, onCancel, saving, error }) {
  const stats = person.stats?.length ? person.stats : [{ value: '', label: '' }]
  const [f, setF] = useState({
    tagline: person.tagline || '',
    bio: person.bio || '',
    manifesto: person.manifesto || '',
    availability: person.availability || '',
    available: !!person.available,
    stats: [0, 1, 2].map((i) => stats[i] || { value: '', label: '' }),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const setStat = (i, k) => (e) => {
    const s = f.stats.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x))
    setF({ ...f, stats: s })
  }
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({
          tagline: f.tagline.trim(),
          bio: f.bio.trim(),
          manifesto: f.manifesto.trim(),
          availability: f.availability.trim(),
          available: f.available,
          stats: f.stats.filter((s) => s.value.trim() && s.label.trim()),
        })
      }}
    >
      <Field label="Frase principal">{(id) => <input id={id} value={f.tagline} onChange={set('tagline')} autoFocus />}</Field>
      <Field label="Bio">{(id) => <textarea id={id} rows={3} value={f.bio} onChange={set('bio')} />}</Field>
      <Field label="Manifiesto (póster de tu cuarto)">{(id) => <textarea id={id} rows={2} value={f.manifesto} onChange={set('manifesto')} />}</Field>
      <Field label="Disponibilidad">{(id) => <input id={id} value={f.availability} onChange={set('availability')} />}</Field>
      <label className="check"><input type="checkbox" checked={f.available} onChange={set('available')} /> Disponible para proyectos</label>
      <fieldset className="stats-edit">
        <legend>Números (trofeos)</legend>
        {f.stats.map((s, i) => (
          <div className="row" key={i}>
            <input aria-label={`Valor ${i + 1}`} placeholder="+2 años" value={s.value} onChange={setStat(i, 'value')} />
            <input aria-label={`Etiqueta ${i + 1}`} placeholder="Experiencia" value={s.label} onChange={setStat(i, 'label')} />
          </div>
        ))}
      </fieldset>
      <FormActions saving={saving} error={error} onCancel={onCancel} saveLabel={submitLabel} />
    </form>
  )
}

/* ─────────── Estante de skills (corregir en el lugar) ─────────── */
export function SkillsEditor({ index, onDone }) {
  const { saving, error, run } = useOwnerSave()
  const cat = useGameDataSkill(index)
  const [name, setName] = useState(cat.category)
  const [items, setItems] = useState(cat.items)
  const [learning, setLearning] = useState(!!cat.learning)
  const [add, setAdd] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    const clean = [...items, add].map((x) => x.trim()).filter(Boolean)
    const ok = await run((d) => {
      d.skills[index] = { ...d.skills[index], category: name.trim() || cat.category, items: clean, learning }
    }, 'Estante actualizado')
    if (ok) onDone()
  }
  const remove = async () => {
    const ok = await run((d) => d.skills.splice(index, 1), 'Estante eliminado')
    if (ok) useGame.getState().closePanel()
  }

  return (
    <form className="form" onSubmit={save}>
      <Field label="Nombre del estante">{(id) => <input id={id} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
      <ul className="edit-list">
        {items.map((it, i) => (
          <li key={i}>
            <input aria-label={`Skill ${i + 1}`} value={it} onChange={(e) => setItems(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="icon-btn" aria-label={`Quitar ${it}`} onClick={() => setItems(items.filter((_, j) => j !== i))}>✕</button>
          </li>
        ))}
        <li>
          <input aria-label="Nueva skill" placeholder="+ Agregar skill" value={add} onChange={(e) => setAdd(e.target.value)} />
        </li>
      </ul>
      <label className="check"><input type="checkbox" checked={learning} onChange={(e) => setLearning(e.target.checked)} /> Lo estoy aprendiendo</label>
      <FormActions saving={saving} error={error} onCancel={onDone} />
      <div className="danger">
        {!confirmDelete ? (
          <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(true)}>Eliminar este estante</button>
        ) : (
          <>
            <span>¿Seguro? Se borra con todas sus skills.</span>
            <button type="button" className="btn btn-danger" onClick={remove} disabled={saving}>Sí, eliminar</button>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>No</button>
          </>
        )}
      </div>
    </form>
  )
}

function useGameDataSkill(index) {
  return useData((s) => s.portfolio.skills[index]) || { category: '', items: [] }
}
