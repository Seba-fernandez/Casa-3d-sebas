import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { player, useGame } from '../store'
import { ROOM_THEME } from '../theme'
import { travel } from './transition'

/*
 * Plano de la casa visto desde arriba, en metros reales (1 m = S unidades del SVG).
 * Las salas se ubican a mano para que los pasillos no se crucen; las puertas y los
 * puntos de interés salen de las mismas coordenadas que usa el mundo 3D.
 */
const S = 15

const ROOMS = {
  proyectos: { name: 'Proyectos', w: 12, d: 9, x: 40, y: 70 },
  skills: { name: 'Skills', w: 11, d: 8.5, x: 290, y: 78 },
  sobremi: { name: 'Sobre mí', w: 9, d: 8, x: 60, y: 238 },
  hall: { name: 'Hall', w: 10, d: 8, x: 230, y: 250 },
  bano: { name: 'Baño', w: 6.4, d: 5.4, x: 110, y: 375 },
}

const DOOR_COLORS = { proyectos: '#5FA777', skills: '#F2A93B', sobremi: '#A98BD6', bano: '#6FB7C9', hall: '#FF6A2B', exit: '#FF6A2B' }

// puertas como en el mundo: [sala, lado, posición sobre la pared, a dónde lleva]
const DOORS = [
  ['hall', 'n', -2.4, 'proyectos'],
  ['hall', 'n', 2.4, 'skills'],
  ['hall', 'w', 0.4, 'sobremi'],
  ['hall', 'w', -2.6, 'bano'],
  ['hall', 's', 0, 'exit'],
  ['proyectos', 's', 0, 'hall'],
  ['skills', 's', 0, 'hall'],
  ['sobremi', 'e', 0.4, 'hall'],
  ['bano', 'e', 0, 'hall'],
]

// pasillos que unen cada par de puertas (en unidades del mapa)
const HALLS = [
  'M269 250 V228 H130 V205',
  'M341 250 V228 H372.5 V205.5',
  'M230 304 H195',
  'M230 349 H214 V415.5 H206',
]

// puntos de interés (coordenadas del mundo x, z)
const LANDMARKS = [
  { room: 'hall', x: -1.9, z: 2.3, text: 'Pizarrón · cómo jugar' },
  { room: 'hall', x: 3.3, z: 2.9, text: 'Buzón · contacto' },
  { room: 'hall', x: 0, z: -2.6, text: 'Sofá y mate' },
  { room: 'hall', x: 1.75, z: -1.25, text: 'Michi' },
  { room: 'proyectos', x: 2.2, z: -2.6, text: 'Proyectos destacados' },
  { room: 'proyectos', x: -5.1, z: 0.6, text: 'Más proyectos' },
  { room: 'proyectos', x: 5.1, z: 2.9, text: 'Arcade de GitHub' },
  { room: 'skills', x: 0, z: -3.4, text: 'Estantes de skills' },
  { room: 'skills', x: 0, z: 1.1, text: 'Banco de trabajo' },
  { room: 'sobremi', x: 2.6, z: -2.9, text: 'Escritorio · sobre mí' },
  { room: 'sobremi', x: -4.0, z: 0.4, text: 'Corcho · experiencia' },
  { room: 'sobremi', x: 1.7, z: 3.4, text: 'CV y números' },
  { room: 'bano', x: 1.3, z: -2.0, text: 'Espejo · consola', owner: true },
]

const toMap = (room, x, z) => {
  const r = ROOMS[room]
  return [r.x + (x + r.w / 2) * S, r.y + (z + r.d / 2) * S]
}

function doorPoint(room, side, at) {
  const r = ROOMS[room]
  const hw = r.w / 2
  const hd = r.d / 2
  const [x, z] = side === 'n' ? [at, -hd] : side === 's' ? [-at, hd] : side === 'w' ? [-hw, -at] : [hw, at]
  return { pt: toMap(room, x, z), vertical: side === 'w' || side === 'e' }
}

export function MapView({ open, onClose }) {
  const room = useGame((s) => s.room)
  const visited = useGame((s) => s.visited)
  const owner = useGame((s) => s.owner)
  const setClassic = useGame((s) => s.setClassic)
  const box = useRef()
  const closeBtn = useRef()
  const lastFocus = useRef(null)

  // numeración global de los puntos (como en los mapas de los juegos de antes)
  const marks = useMemo(() => LANDMARKS.filter((m) => !m.owner || owner).map((m, i) => ({ ...m, n: i + 1 })), [owner])

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement
    requestAnimationFrame(() => closeBtn.current?.focus())
    if (box.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(box.current, { y: 20, opacity: 0, rotate: -1.2 }, { y: 0, opacity: 1, rotate: 0, duration: 0.4, ease: 'back.out(1.5)' })
    }
    return () => lastFocus.current?.focus?.()
  }, [open])

  if (!open) return null

  const me = ROOMS[room] ? toMap(room, player.x, player.z) : null
  const meAngle = (Math.atan2(Math.sin(player.yaw), -Math.cos(player.yaw)) * 180) / Math.PI

  const go = (id) => {
    if (id === room) return onClose()
    if (id === 'bano' && !owner) {
      useGame.getState().showToast('El baño es privado: se entra con la huella del dueño', 'info')
      return
    }
    onClose()
    travel(id, id === 'hall' ? `from:${room}` : 'from:hall')
  }

  const trap = (e) => {
    if (e.key !== 'Tab') return
    const f = box.current.querySelectorAll('button, [tabindex="0"]')
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
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <section ref={box} className="map-sheet" role="dialog" aria-modal="true" aria-labelledby="map-title" onKeyDown={trap}>
        <button ref={closeBtn} className="close" onClick={onClose} aria-label="Cerrar mapa (Esc)">✕</button>
        <header className="map-head">
          <p className="eyebrow">Planta baja · vista desde arriba</p>
          <h2 id="map-title">Mapa de la casa</h2>
        </header>

        <div className="map-body">
          <svg className="floorplan" viewBox="20 40 460 445" role="group" aria-label="Plano de la casa. Tocá una sala para ir.">
            <defs>
              <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#E9E1D6" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="#C9BBA8" strokeWidth="3" />
              </pattern>
              <pattern id="grid" width="15" height="15" patternUnits="userSpaceOnUse">
                <path d="M15 0H0V15" fill="none" stroke="var(--map-grid)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect x="20" y="40" width="460" height="445" fill="url(#grid)" />

            {/* pasillos */}
            {HALLS.map((d) => (
              <g key={d}>
                <path d={d} fill="none" stroke="var(--map-line)" strokeWidth="17" strokeLinejoin="round" />
                <path d={d} fill="none" stroke="var(--map-hall)" strokeWidth="12" strokeLinejoin="round" />
              </g>
            ))}

            {/* salas */}
            {Object.entries(ROOMS).map(([id, r]) => {
              const locked = id === 'bano' && !owner
              const here = id === room
              const seen = visited[id] || here
              const w = r.w * S
              const h = r.d * S
              return (
                <g
                  key={id}
                  className={'map-room' + (here ? ' here' : '') + (locked ? ' locked' : '') + (seen ? '' : ' unseen')}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r.name}${here ? ', estás acá' : locked ? ', privado' : seen ? ', visitada' : ', sin explorar'}`}
                  onClick={() => go(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      go(id)
                    }
                  }}
                >
                  <rect x={r.x} y={r.y} width={w} height={h} rx="6" fill={locked ? 'url(#hatch)' : ROOM_THEME[id].wall} stroke="var(--map-line)" strokeWidth="3" />
                  {!locked && (
                    <rect x={r.x + 10} y={r.y + 10} width={w - 20} height={h - 20} rx="4" fill="none" stroke={ROOM_THEME[id].trim} strokeWidth="2" strokeDasharray={seen ? 'none' : '5 5'} />
                  )}
                  {here && <rect className="here-ring" x={r.x - 5} y={r.y - 5} width={w + 10} height={h + 10} rx="10" fill="none" />}
                  <text className="map-name" x={r.x + 16} y={r.y + 28}>
                    {r.name}
                  </text>
                  {locked && (
                    <g transform={`translate(${r.x + w / 2} ${r.y + h / 2 + 4})`}>
                      <rect x="-9" y="-2" width="18" height="14" rx="3" fill="var(--map-line)" />
                      <path d="M-5 -2 V-6 a5 5 0 0 1 10 0 V-2" fill="none" stroke="var(--map-line)" strokeWidth="3" />
                    </g>
                  )}
                  {!seen && !locked && (
                    <text className="map-sub" x={r.x + 16} y={r.y + 42}>sin explorar</text>
                  )}
                </g>
              )
            })}

            {/* puertas */}
            {DOORS.map(([rid, side, at, to]) => {
              const { pt, vertical } = doorPoint(rid, side, at)
              return (
                <rect
                  key={rid + to}
                  x={pt[0] - (vertical ? 3.5 : 11)}
                  y={pt[1] - (vertical ? 11 : 3.5)}
                  width={vertical ? 7 : 22}
                  height={vertical ? 22 : 7}
                  rx="2"
                  fill={DOOR_COLORS[to === 'hall' ? rid : to]}
                  stroke="var(--map-line)"
                  strokeWidth="1.5"
                  pointerEvents="none"
                />
              )
            })}

            {/* salida */}
            <g pointerEvents="none">
              <path d="M305 378 V402 M297 394 L305 402 L313 394" fill="none" stroke="#FF6A2B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <text className="map-sub strong" x="305" y="420" textAnchor="middle">Salida · porta clásica</text>
            </g>

            {/* puntos numerados */}
            {marks.map((m) => {
              const [x, y] = toMap(m.room, m.x, m.z)
              return (
                <g key={m.n} className="map-mark" pointerEvents="none">
                  <circle cx={x} cy={y} r="8.5" />
                  <text x={x} y={y + 3.6} textAnchor="middle">{m.n}</text>
                </g>
              )
            })}

            {/* vos */}
            {me && (
              <g className="map-me" transform={`translate(${me[0]} ${me[1]})`} pointerEvents="none">
                <circle r="13" className="pulse" />
                <circle r="7.5" />
                <path d="M0 -15 L5 -7 H-5 Z" transform={`rotate(${meAngle})`} />
              </g>
            )}

            {/* norte */}
            <g transform="translate(450 70)" pointerEvents="none" className="map-north">
              <circle r="14" />
              <path d="M0 -9 L5 4 L0 1 L-5 4 Z" />
              <text y="-18" textAnchor="middle">N</text>
            </g>
          </svg>

          <aside className="map-legend" aria-label="Referencias del mapa">
            <p className="legend-me"><span className="dot-me" aria-hidden="true" /> Estás en <strong>{ROOMS[room]?.name}</strong></p>
            {Object.entries(ROOMS)
              .filter(([id]) => marks.some((m) => m.room === id))
              .map(([id, r]) => (
                <div key={id} className={'legend-group' + (id === room ? ' current' : '')}>
                  <h3>{r.name}</h3>
                  <ol>
                    {marks
                      .filter((m) => m.room === id)
                      .map((m) => (
                        <li key={m.n} value={m.n}>{m.text}</li>
                      ))}
                  </ol>
                </div>
              ))}
            <p className="muted small">Tocá una sala para ir directo.</p>
          </aside>
        </div>

        <div className="links map-actions">
          <button className="btn" onClick={() => useGame.setState({ menu: false, panel: { type: 'contact' }, prompt: null })}>Contacto</button>
          <button className="btn btn-ghost" onClick={() => { onClose(); setClassic(true) }}>Versión clásica (sin 3D)</button>
        </div>
      </section>
    </div>
  )
}
