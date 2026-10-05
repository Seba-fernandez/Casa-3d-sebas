import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { input, useGame } from '../store'
import { useData } from '../data/usePortfolio'
import { travel } from './transition'
import { logout } from '../owner/api'
import { CARRY_INFO } from '../owner/changes'

export const ROOM_NAMES = {
  hall: 'Hall de entrada',
  proyectos: 'Sala de Proyectos',
  skills: 'Taller de Skills',
  sobremi: 'Mi cuarto · Sobre mí',
  bano: 'Baño privado',
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function goToRoom(to) {
  const cur = useGame.getState().room
  if (to === cur) return
  travel(to, to === 'hall' ? `from:${cur}` : 'from:hall')
}

/* Cartel de ubicación que entra al cambiar de habitación (como al llegar a un pueblo) */
function LocationSign() {
  const room = useGame((s) => s.room)
  const started = useGame((s) => s.started)
  const el = useRef()
  useEffect(() => {
    if (!started || !el.current) return
    const tl = gsap.timeline()
    tl.fromTo(el.current, { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: reduced() ? 0.01 : 0.5, ease: 'back.out(1.7)', delay: 0.25 })
    return () => tl.kill()
  }, [room, started])
  return (
    <div ref={el} className="location" aria-live="polite">
      <span className="spark" aria-hidden="true">✳</span> {ROOM_NAMES[room]}
    </div>
  )
}

function Prompt({ touch }) {
  const prompt = useGame((s) => s.prompt)
  const dialog = useGame((s) => s.dialog)
  if (!prompt || dialog) return null
  return (
    <button className="prompt" onClick={() => (input.interact = true)}>
      <kbd aria-hidden="true">{touch ? 'A' : 'E'}</kbd>
      <span>
        <strong>{prompt.verb}</strong> · {prompt.label}
      </span>
    </button>
  )
}

/* Caja de diálogo con texto que se escribe solo */
function DialogBox() {
  const dialog = useGame((s) => s.dialog)
  const close = useGame((s) => s.closeDialog)
  const [line, setLine] = useState(0)
  const [shown, setShown] = useState('')
  const full = dialog?.lines[line] || ''

  useEffect(() => setLine(0), [dialog])
  useEffect(() => {
    if (!dialog) return
    if (reduced()) return setShown(full)
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i += 2
      setShown(full.slice(0, i))
      if (i >= full.length) clearInterval(id)
    }, 22)
    return () => clearInterval(id)
  }, [full, dialog])

  useEffect(() => {
    const next = () => {
      if (shown.length < full.length) return setShown(full)
      if (line < dialog.lines.length - 1) setLine(line + 1)
      else close()
    }
    if (!dialog) return
    window.addEventListener('dialog:next', next)
    return () => window.removeEventListener('dialog:next', next)
  }, [dialog, shown, full, line, close])

  if (!dialog) return null
  return (
    <div className="dialog" role="status" onClick={() => window.dispatchEvent(new CustomEvent('dialog:next'))}>
      {dialog.who && <span className="who">{dialog.who}</span>}
      <p>{shown}</p>
      <span className="next" aria-hidden="true">▼</span>
      <span className="sr-only">{full}</span>
    </div>
  )
}

/* Joystick táctil (solo en pantallas táctiles) */
function Joystick() {
  const base = useRef()
  const knob = useRef()
  const [active, setActive] = useState(false)
  useEffect(() => {
    const el = base.current
    if (!el) return
    let id = null
    const R = 52
    const set = (e) => {
      const r = el.getBoundingClientRect()
      let dx = e.clientX - (r.left + r.width / 2)
      let dy = e.clientY - (r.top + r.height / 2)
      const len = Math.hypot(dx, dy)
      if (len > R) {
        dx = (dx / len) * R
        dy = (dy / len) * R
      }
      knob.current.style.transform = `translate(${dx}px, ${dy}px)`
      input.joy.x = dx / R
      input.joy.y = -dy / R
    }
    const down = (e) => {
      id = e.pointerId
      el.setPointerCapture(id)
      setActive(true)
      set(e)
      e.stopPropagation()
    }
    const move = (e) => e.pointerId === id && set(e)
    const up = (e) => {
      if (e.pointerId !== id) return
      id = null
      setActive(false)
      knob.current.style.transform = ''
      input.joy.x = input.joy.y = 0
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [])
  return (
    <div ref={base} className={'joystick' + (active ? ' on' : '')} aria-hidden="true">
      <div ref={knob} className="knob" />
    </div>
  )
}

function MapMenu({ open, onClose }) {
  const visited = useGame((s) => s.visited)
  const room = useGame((s) => s.room)
  const setClassic = useGame((s) => s.setClassic)
  const openPanel = useGame((s) => s.openPanel)
  const owner = useGame((s) => s.owner)
  const first = useRef()
  useEffect(() => {
    if (open) requestAnimationFrame(() => first.current?.focus())
  }, [open])
  if (!open) return null
  const go = (r) => {
    onClose()
    goToRoom(r)
  }
  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <nav className="map" aria-label="Mapa de la casa">
        <h2>Mapa</h2>
        <ul>
          {Object.entries(ROOM_NAMES).filter(([id]) => id !== 'bano' || owner).map(([id, name], i) => (
            <li key={id}>
              <button ref={i === 0 ? first : null} className={room === id ? 'here' : ''} onClick={() => go(id)}>
                <span>{name}</span>
                <small>{room === id ? 'Estás acá' : visited[id] ? 'Visitada' : 'Sin explorar'}</small>
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => { onClose(); openPanel({ type: 'contact' }) }}>
              <span>Contacto</span>
              <small>Buzón</small>
            </button>
          </li>
        </ul>
        <div className="links">
          <button className="btn" onClick={() => { onClose(); setClassic(true) }}>Versión clásica (sin 3D)</button>
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </nav>
    </div>
  )
}

export function HUD() {
  const started = useGame((s) => s.started)
  const setClassic = useGame((s) => s.setClassic)
  const source = useData((s) => s.source)
  const map = useGame((s) => s.menu)
  const setMap = useGame((s) => s.setMenu)
  const [touch] = useState(() => window.matchMedia?.('(pointer: coarse)').matches)

  useEffect(() => {
    const t = () => setMap(!useGame.getState().menu)
    window.addEventListener('map:toggle', t)
    return () => window.removeEventListener('map:toggle', t)
  }, [setMap])

  if (!started) return null
  return (
    <>
      <LocationSign />
      <div className="topbar">
        <button className="chip-btn" onClick={() => setMap(true)} aria-label="Abrir mapa (M)">
          <span aria-hidden="true">☰</span> Mapa
        </button>
        <button className="chip-btn" onClick={() => setClassic(true)}>Versión clásica</button>
      </div>
      {source === 'live' && <p className="live-badge" title="Datos leídos en vivo">● datos en vivo</p>}
      <OwnerHUD />
      <Prompt touch={touch} />
      <DialogBox />
      {touch && (
        <>
          <Joystick />
          <button className="action" onClick={() => {
            if (useGame.getState().dialog) window.dispatchEvent(new CustomEvent('dialog:next'))
            else input.interact = true
          }} aria-label="Interactuar">A</button>
        </>
      )}
      {!touch && <p className="hint" aria-hidden="true">WASD caminar · arrastrá para mirar · E interactuar · M mapa</p>}
      <MapMenu open={map} onClose={() => setMap(false)} />
    </>
  )
}

/* Insignia de modo dueño, objeto en las manos y avisos */
function OwnerHUD() {
  const owner = useGame((s) => s.owner)
  const carry = useGame((s) => s.carry)
  const toast = useGame((s) => s.toast)
  return (
    <>
      {owner && (
        <div className="owner-badge">
          <span aria-hidden="true">✳</span> Modo dueño
          <button onClick={() => logout()} aria-label="Salir del modo dueño">Salir</button>
        </div>
      )}
      {carry && (
        <div className="carry-chip" role="status">
          <span className="carry-dot" aria-hidden="true" />
          <span>
            <strong>Llevás un {CARRY_INFO[carry.kind].thing}: {carry.label}</strong>
            <small>{CARRY_INFO[carry.kind].where}</small>
          </span>
          <button
            onClick={() => {
              useGame.getState().setCarry(null)
              useGame.getState().showToast('Descartado', 'info')
            }}
          >
            Descartar
          </button>
        </div>
      )}
      {toast && (
        <div className={'toast toast-' + toast.tone} role="status" key={toast.at}>
          {toast.text}
        </div>
      )}
    </>
  )
}
