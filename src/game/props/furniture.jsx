import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RBox, Ball, Cyl, Caps, Label, Toon, Spark, Cabinet, useSolid } from '../kit'
import { C } from '../../theme'

/* Registra la huella (footprint) del mueble como sólido, respetando rotaciones de 90° */
function useFoot([x, , z], ry = 0, w, d, enabled = true) {
  const quarter = Math.abs(Math.round(ry / (Math.PI / 2))) % 2 === 1
  useSolid(x, z, quarter ? d : w, quarter ? w : d, enabled)
}

/* ─────────────── Living ─────────────── */

export function Sofa({ position = [0, 0, 0], ry = 0, color = C.sage, cushion = C.orangeSoft }) {
  useFoot(position, ry, 2.3, 1.0)
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[2.2, 0.42, 0.95]} position={[0, 0.3, 0]} color={color} radius={0.14} outline />
      <RBox size={[2.2, 0.75, 0.28]} position={[0, 0.7, -0.36]} color={color} radius={0.13} outline />
      <RBox size={[0.3, 0.6, 0.95]} position={[-1.05, 0.45, 0]} color={color} radius={0.13} outline />
      <RBox size={[0.3, 0.6, 0.95]} position={[1.05, 0.45, 0]} color={color} radius={0.13} outline />
      <RBox size={[0.86, 0.16, 0.66]} position={[-0.44, 0.58, 0.08]} color={C.mint} radius={0.07} />
      <RBox size={[0.86, 0.16, 0.66]} position={[0.44, 0.58, 0.08]} color={C.mint} radius={0.07} />
      {/* almohadones */}
      <group position={[-0.62, 0.86, -0.12]} rotation={[0.2, 0.25, 0.12]}>
        <RBox size={[0.44, 0.42, 0.14]} color={cushion} radius={0.07} outline />
        <Spark position={[0, 0, 0.075]} size={0.22} color={C.white} />
      </group>
      <RBox size={[0.4, 0.38, 0.13]} position={[0.66, 0.84, -0.14]} rotation={[0.2, -0.2, -0.1]} color={C.butter} radius={0.07} outline />
      {[-0.95, 0.95].map((x) =>
        [-0.35, 0.35].map((z) => <Cyl key={x + '' + z} r={0.04} h={0.12} position={[x, 0.06, z]} color={C.woodDark} />)
      )}
    </group>
  )
}

export function CoffeeTable({ position = [0, 0, 0], ry = 0 }) {
  useFoot(position, ry, 1.2, 0.7)
  const steam = useRef()
  useFrame(({ clock }) => {
    if (!steam.current) return
    const t = clock.elapsedTime
    steam.current.children.forEach((m, i) => {
      const k = (t * 0.5 + i / 3) % 1
      m.position.y = 0.2 + k * 0.35
      m.scale.setScalar(0.6 + k * 0.8)
      m.material.opacity = 0.5 * (1 - k)
    })
  })
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[1.2, 0.08, 0.7]} position={[0, 0.42, 0]} color={C.woodLight} radius={0.035} outline />
      {[[-0.5, -0.27], [0.5, -0.27], [-0.5, 0.27], [0.5, 0.27]].map(([x, z]) => (
        <Cyl key={x + '' + z} r={0.035} h={0.4} position={[x, 0.2, z]} color={C.wood} />
      ))}
      {/* mate y termo */}
      <group position={[-0.22, 0.46, 0.05]}>
        <Cyl r={0.06} rt={0.075} h={0.12} position={[0, 0.06, 0]} color={C.leafDark} outline />
        <Ball r={0.07} position={[0, 0.12, 0]} scale={[1, 0.5, 1]} color={C.leaf} />
        <Cyl r={0.008} h={0.2} position={[0.03, 0.2, 0]} rotation={[0, 0, -0.3]} color={C.metal} />
        <group ref={steam}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.2, 0]}>
              <sphereGeometry args={[0.025, 8, 6]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
      <group position={[0.02, 0.46, -0.08]}>
        <Cyl r={0.06} h={0.34} position={[0, 0.17, 0]} color={C.orange} outline />
        <Cyl r={0.045} h={0.05} position={[0, 0.36, 0]} color={C.ink} />
      </group>
      {/* libro abierto */}
      <group position={[0.34, 0.47, 0.04]} rotation={[0, -0.4, 0]}>
        <RBox size={[0.36, 0.04, 0.26]} color={C.white} radius={0.01} />
        <RBox size={[0.37, 0.025, 0.27]} position={[0, -0.025, 0]} color={C.green} radius={0.01} />
      </group>
    </group>
  )
}

export function Plant({ position = [0, 0, 0], size = 1, kind = 'monstera', pot = C.pot, solid = true }) {
  useFoot(position, 0, 0.55 * size, 0.55 * size, solid)
  const leaves = useRef()
  useFrame(({ clock }) => {
    if (leaves.current) leaves.current.rotation.z = Math.sin(clock.elapsedTime * 0.8 + position[0]) * 0.03
  })
  return (
    <group position={position} scale={size}>
      <Cyl r={0.2} rt={0.25} h={0.42} position={[0, 0.21, 0]} color={pot} outline />
      <Cyl r={0.23} h={0.03} position={[0, 0.42, 0]} color="#7A4E33" />
      <group ref={leaves} position={[0, 0.42, 0]}>
        {kind === 'cactus' ? (
          <>
            <Caps r={0.12} len={0.45} position={[0, 0.34, 0]} color={C.leaf} outline />
            <Caps r={0.07} len={0.18} position={[0.16, 0.36, 0]} rotation={[0, 0, -0.6]} color={C.leaf} outline />
            <Ball r={0.05} position={[0, 0.7, 0]} color={C.blush} />
          </>
        ) : kind === 'round' ? (
          <>
            <Ball r={0.32} position={[0, 0.38, 0]} color={C.leaf} outline />
            <Ball r={0.2} position={[0.2, 0.28, 0.12]} color={C.leafDark} />
          </>
        ) : (
          Array.from({ length: 7 }).map((_, i) => {
            const a = (i / 7) * Math.PI * 2
            const tilt = 0.55 + (i % 3) * 0.15
            return (
              <group key={i} rotation={[0, a, 0]}>
                <group rotation={[tilt, 0, 0]}>
                  <Cyl r={0.012} h={0.4} position={[0, 0.2, 0]} color={C.leafDark} shadow={false} />
                  <Ball r={0.17} position={[0, 0.45, 0]} scale={[1, 0.18, 1.35]} color={i % 2 ? C.leaf : C.leafDark} outline />
                </group>
              </group>
            )
          })
        )}
      </group>
    </group>
  )
}

export function FloorLamp({ position = [0, 0, 0], color = C.butter, light = true }) {
  useFoot(position, 0, 0.45, 0.45)
  return (
    <group position={position}>
      <Cyl r={0.2} h={0.05} position={[0, 0.025, 0]} color={C.woodDark} outline />
      <Cyl r={0.025} h={1.5} position={[0, 0.78, 0]} color={C.woodDark} />
      <Cyl r={0.3} rt={0.18} h={0.36} position={[0, 1.6, 0]} color={color} outline />
      <mesh position={[0, 1.46, 0]}>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshBasicMaterial color="#FFF3C4" />
      </mesh>
      {light && <pointLight position={[0, 1.4, 0]} intensity={4} distance={5} decay={1.6} color="#FFD9A0" />}
    </group>
  )
}

export function Bookshelf({ position = [0, 0, 0], ry = 0, w = 1.4, h = 1.9, color = C.woodLight, books = true }) {
  useFoot(position, ry, w, 0.45)
  const rows = 4
  const colors = [C.orange, C.sage, C.butter, C.lilac, C.green, C.blush, C.sky, C.peach]
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <Cabinet w={w} h={h} d={0.42} color={color} />
      {Array.from({ length: rows - 1 }).map((_, r) => (
        <RBox key={r} size={[w - 0.1, 0.05, 0.36]} position={[0, ((r + 1) * h) / rows, 0.05]} color={color} radius={0.01} />
      ))}
      {books &&
        Array.from({ length: rows }).map((_, r) => {
          let x = -w / 2 + 0.12
          const out = []
          let i = 0
          while (x < w / 2 - 0.2) {
            const bw = 0.06 + ((r * 7 + i * 3) % 4) * 0.02
            const bh = 0.26 + ((r + i * 5) % 3) * 0.05
            const lean = (r + i) % 9 === 0 ? 0.25 : 0
            out.push(
              <RBox
                key={i}
                size={[bw, bh, 0.24]}
                radius={0.01}
                position={[x + bw / 2, (r * h) / rows + 0.04 + bh / 2, 0.08]}
                rotation={[0, 0, lean]}
                color={colors[(r * 3 + i) % colors.length]}
                shadow={false}
              />
            )
            x += bw + 0.012 + (lean ? 0.08 : 0)
            i++
            if ((r + i) % 6 === 0) x += 0.18 // huequito con decoración
          }
          return <group key={r}>{out}</group>
        })}
    </group>
  )
}

/* ─────────────── Pared (coordenadas locales de pared) ─────────────── */

export function WallWindow({ x = 0, y = 1.65, w = 1.8, h = 1.3 }) {
  // Cielo de tarde + sierras de Córdoba recortadas
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 256
    cv.height = 192
    const g = cv.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 192)
    grad.addColorStop(0, '#9FD3EE')
    grad.addColorStop(0.6, '#FCD9B8')
    grad.addColorStop(1, '#F6B08E')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 192)
    g.fillStyle = '#FFF3D6'
    g.beginPath()
    g.arc(190, 105, 18, 0, Math.PI * 2)
    g.fill()
    const ridge = (color, base, amp, seed) => {
      g.fillStyle = color
      g.beginPath()
      g.moveTo(0, 192)
      for (let x = 0; x <= 256; x += 8) g.lineTo(x, base - Math.abs(Math.sin(x * 0.02 + seed)) * amp - Math.sin(x * 0.07 + seed) * 6)
      g.lineTo(256, 192)
      g.fill()
    }
    ridge('#B7A7C9', 140, 34, 1)
    ridge('#8DB596', 160, 24, 3)
    ridge('#5E8F6C', 178, 14, 5)
    // nubes
    g.fillStyle = 'rgba(255,255,255,0.85)'
    ;[[50, 40], [120, 28], [210, 50]].forEach(([cx, cy]) => {
      g.beginPath()
      g.ellipse(cx, cy, 22, 8, 0, 0, Math.PI * 2)
      g.ellipse(cx + 14, cy - 5, 14, 8, 0, 0, Math.PI * 2)
      g.fill()
    })
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} />
      </mesh>
      <RBox size={[w + 0.16, 0.1, 0.12]} position={[0, h / 2, 0.04]} color={C.white} radius={0.03} outline />
      <RBox size={[w + 0.3, 0.1, 0.24]} position={[0, -h / 2 - 0.02, 0.1]} color={C.white} radius={0.03} outline />
      <RBox size={[0.1, h, 0.12]} position={[-w / 2, 0, 0.04]} color={C.white} radius={0.03} outline />
      <RBox size={[0.1, h, 0.12]} position={[w / 2, 0, 0.04]} color={C.white} radius={0.03} outline />
      <RBox size={[0.06, h, 0.06]} position={[0, 0, 0.04]} color={C.white} radius={0.02} />
      <RBox size={[w, 0.06, 0.06]} position={[0, 0.05, 0.04]} color={C.white} radius={0.02} />
      {/* cortinas */}
      <RBox size={[0.36, h + 0.35, 0.06]} position={[-w / 2 - 0.25, -0.08, 0.14]} color={C.peach} radius={0.05} />
      <RBox size={[0.36, h + 0.35, 0.06]} position={[w / 2 + 0.25, -0.08, 0.14]} color={C.peach} radius={0.05} />
      <Cyl r={0.025} h={w + 1.1} position={[0, h / 2 + 0.16, 0.16]} rotation={[0, 0, Math.PI / 2]} color={C.woodDark} />
      {/* macetita en el alféizar */}
      <group position={[w / 2 - 0.25, -h / 2 + 0.03, 0.14]} scale={0.45}>
        <Plant position={[0, 0, 0]} kind="cactus" solid={false} />
      </group>
    </group>
  )
}

export function Frame({ x = 0, y = 1.7, w = 0.6, h = 0.45, color = C.woodLight, art = C.sage, children }) {
  return (
    <group position={[x, y, 0.03]}>
      <RBox size={[w + 0.1, h + 0.1, 0.05]} color={color} radius={0.02} outline shadow={false} />
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <Toon color={art} />
      </mesh>
      <group position={[0, 0, 0.035]}>{children}</group>
    </group>
  )
}

export function Clock({ x = 0, y = 2.2 }) {
  const hand = useRef()
  const hand2 = useRef()
  useFrame(() => {
    const d = new Date()
    if (hand.current) hand.current.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) * (Math.PI / 6)
    if (hand2.current) hand2.current.rotation.z = -(d.getMinutes() + d.getSeconds() / 60) * (Math.PI / 30)
  })
  return (
    <group position={[x, y, 0.05]}>
      <Cyl r={0.26} h={0.06} rotation={[Math.PI / 2, 0, 0]} color={C.orange} outline shadow={false} />
      <Cyl r={0.21} h={0.07} rotation={[Math.PI / 2, 0, 0]} color={C.white} shadow={false} />
      <group ref={hand} position={[0, 0, 0.045]}>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.025, 0.12, 0.01]} />
          <Toon color={C.ink} />
        </mesh>
      </group>
      <group ref={hand2} position={[0, 0, 0.05]}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.016, 0.16, 0.01]} />
          <Toon color={C.ink} />
        </mesh>
      </group>
    </group>
  )
}

/* Guirnalda de lucecitas a lo largo de la pared */
export function StringLights({ from = -3, to = 3, y = 2.65, count = 14 }) {
  const bulbs = useRef()
  useFrame(({ clock }) => {
    if (!bulbs.current) return
    bulbs.current.children.forEach((m, i) => {
      m.material.color.setHSL(0.11, 1, 0.72 + Math.sin(clock.elapsedTime * 2 + i) * 0.08)
    })
  })
  const pts = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    return [from + (to - from) * t, y - Math.sin(t * Math.PI * 3) ** 2 * 0.18, 0.08]
  })
  return (
    <group ref={bulbs}>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshBasicMaterial color="#FFE3A3" />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────── Dormitorio / estudio ─────────────── */

export function Bed({ position = [0, 0, 0], ry = 0, color = C.lilac }) {
  useFoot(position, ry, 1.4, 2.1)
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[1.4, 0.32, 2.1]} position={[0, 0.2, 0]} color={C.woodLight} radius={0.06} outline />
      <RBox size={[1.32, 0.22, 2.0]} position={[0, 0.45, 0.02]} color={C.white} radius={0.1} />
      <RBox size={[1.36, 0.16, 1.3]} position={[0, 0.56, 0.38]} color={color} radius={0.08} outline />
      <RBox size={[0.6, 0.18, 0.38]} position={[-0.3, 0.64, -0.72]} color={C.white} radius={0.09} outline />
      <RBox size={[0.6, 0.18, 0.38]} position={[0.32, 0.64, -0.72]} color={C.butter} radius={0.09} outline />
      <RBox size={[1.4, 0.95, 0.12]} position={[0, 0.48, -1.04]} color={C.woodLight} radius={0.06} outline />
    </group>
  )
}

export function Desk({ position = [0, 0, 0], ry = 0, w = 1.5, children }) {
  useFoot(position, ry, w, 0.75)
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[w, 0.07, 0.72]} position={[0, 0.76, 0]} color={C.woodLight} radius={0.03} outline />
      <RBox size={[0.45, 0.66, 0.66]} position={[w / 2 - 0.26, 0.38, 0]} color={C.white} radius={0.04} outline />
      <RBox size={[0.36, 0.16, 0.03]} position={[w / 2 - 0.26, 0.55, 0.34]} color={C.orangeSoft} radius={0.02} />
      <RBox size={[0.36, 0.16, 0.03]} position={[w / 2 - 0.26, 0.33, 0.34]} color={C.orangeSoft} radius={0.02} />
      <Cyl r={0.03} h={0.74} position={[-w / 2 + 0.06, 0.37, 0.3]} color={C.woodDark} />
      <Cyl r={0.03} h={0.74} position={[-w / 2 + 0.06, 0.37, -0.3]} color={C.woodDark} />
      <group position={[0, 0.8, 0]}>{children}</group>
    </group>
  )
}

export function Laptop({ position = [0, 0, 0], ry = 0, screen = C.screen }) {
  const glow = useRef()
  useFrame(({ clock }) => {
    if (glow.current) glow.current.material.opacity = 0.75 + Math.sin(clock.elapsedTime * 3) * 0.08
  })
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[0.5, 0.025, 0.34]} color={C.metal} radius={0.01} />
      <group position={[0, 0.01, -0.17]} rotation={[-0.25, 0, 0]}>
        <RBox size={[0.5, 0.33, 0.02]} position={[0, 0.165, 0]} color={C.metal} radius={0.01} outline />
        <mesh position={[0, 0.165, 0.012]}>
          <planeGeometry args={[0.45, 0.28]} />
          <meshBasicMaterial color={screen} />
        </mesh>
        <mesh ref={glow} position={[0, 0.165, 0.013]}>
          <planeGeometry args={[0.45, 0.28]} />
          <meshBasicMaterial color="#38E0B0" transparent opacity={0.75} />
        </mesh>
        <Label position={[0, 0.17, 0.016]} size={0.05} color={C.green}>{'<JSF />'}</Label>
      </group>
    </group>
  )
}

export function Chair({ position = [0, 0, 0], ry = 0, color = C.orange }) {
  useFoot(position, ry, 0.5, 0.5)
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[0.5, 0.08, 0.5]} position={[0, 0.46, 0]} color={color} radius={0.04} outline />
      <RBox size={[0.5, 0.5, 0.07]} position={[0, 0.74, 0.22]} color={color} radius={0.04} outline />
      <Cyl r={0.03} h={0.42} position={[0, 0.22, 0]} color={C.metal} />
      <Cyl r={0.22} h={0.04} position={[0, 0.03, 0]} color={C.ink} />
    </group>
  )
}

export function Mailbox({ position = [0, 0, 0], ry = 0 }) {
  useFoot(position, ry, 0.5, 0.5)
  const flag = useRef()
  useFrame(({ clock }) => {
    if (flag.current) flag.current.rotation.z = -0.2 + Math.sin(clock.elapsedTime * 2) * 0.12
  })
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <Cyl r={0.05} h={0.9} position={[0, 0.45, 0]} color={C.woodDark} />
      <RBox size={[0.42, 0.34, 0.6]} position={[0, 1.05, 0]} color={C.orange} radius={0.15} outline />
      <RBox size={[0.3, 0.04, 0.02]} position={[0, 1.08, 0.31]} color={C.ink} radius={0.01} />
      <group ref={flag} position={[0.24, 1.05, -0.12]}>
        <RBox size={[0.03, 0.3, 0.03]} position={[0, 0.15, 0]} color={C.butter} radius={0.01} />
        <RBox size={[0.03, 0.12, 0.16]} position={[0, 0.25, 0.08]} color={C.butter} radius={0.01} outline />
      </group>
      {/* cartita asomando */}
      <RBox size={[0.22, 0.02, 0.14]} position={[0, 1.1, 0.33]} rotation={[0.4, 0, 0]} color={C.white} radius={0.005} />
    </group>
  )
}

export function Pedestal({ position = [0, 0, 0], color = C.white, h = 0.9 }) {
  useFoot(position, 0, 0.9, 0.9)
  return (
    <group position={position}>
      <RBox size={[0.85, h, 0.85]} position={[0, h / 2, 0]} color={color} radius={0.08} outline />
      <RBox size={[0.95, 0.08, 0.95]} position={[0, h, 0]} color={C.creamDeep} radius={0.04} />
      <RBox size={[0.95, 0.08, 0.95]} position={[0, 0.04, 0]} color={C.creamDeep} radius={0.04} />
    </group>
  )
}

/* Gato dormilón original (no es ningún personaje existente) */
export function Cat({ position = [0, 0, 0], ry = 0, color = '#F2A65A' }) {
  useFoot(position, ry, 0.55, 0.45)
  const body = useRef()
  const tail = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.6) * 0.04
    if (tail.current) tail.current.rotation.y = Math.sin(t * 0.9) * 0.25
  })
  return (
    <group position={position} rotation={[0, ry, 0]}>
      {/* almohadón */}
      <Cyl r={0.36} h={0.08} position={[0, 0.04, 0]} color={C.blush} outline />
      <group ref={body}>
        <Ball r={0.2} position={[0, 0.2, 0]} scale={[1.3, 0.8, 1]} color={color} outline />
        <Ball r={0.11} position={[0.07, 0.17, 0.12]} scale={[1.3, 0.7, 1]} color={C.white} />
      </group>
      <group position={[0.24, 0.22, 0.08]}>
        <Ball r={0.13} color={color} outline />
        <mesh position={[-0.05, 0.12, -0.02]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.05, 0.1, 4]} />
          <Toon color={color} />
        </mesh>
        <mesh position={[0.06, 0.12, -0.02]} rotation={[0, 0, -0.3]}>
          <coneGeometry args={[0.05, 0.1, 4]} />
          <Toon color={color} />
        </mesh>
        {/* ojitos cerrados */}
        <mesh position={[-0.04, 0.01, 0.12]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.022, 0.006, 6, 10, Math.PI]} />
          <Toon color={C.ink} />
        </mesh>
        <mesh position={[0.05, 0.01, 0.12]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.022, 0.006, 6, 10, Math.PI]} />
          <Toon color={C.ink} />
        </mesh>
        <Ball r={0.015} position={[0.005, -0.03, 0.13]} color={C.blush} shadow={false} />
      </group>
      <group ref={tail} position={[-0.24, 0.12, 0]}>
        <Caps r={0.045} len={0.3} position={[-0.05, 0, 0.12]} rotation={[Math.PI / 2, 0, 0.5]} color={color} outline />
      </group>
      <Zzz position={[0.3, 0.55, 0.1]} />
    </group>
  )
}

function Zzz(props) {
  const g = useRef()
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.children.forEach((c, i) => {
      const k = (clock.elapsedTime * 0.35 + i / 3) % 1
      c.position.set(k * 0.15, k * 0.45, 0)
      c.fillOpacity = Math.sin(k * Math.PI)
      c.scale.setScalar(0.6 + k * 0.6)
    })
  })
  return (
    <group ref={g} {...props}>
      {[0, 1, 2].map((i) => (
        <Label key={i} size={0.12} color={C.greenSoft}>z</Label>
      ))}
    </group>
  )
}

/* Monograma JSF® circular de pared */
export function Monogram({ x = 0, y = 1.9, r = 0.55 }) {
  const ring = useRef()
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z -= dt * 0.25
  })
  return (
    <group position={[x, y, 0.05]}>
      <Cyl r={r} h={0.06} rotation={[Math.PI / 2, 0, 0]} color={C.green} outline shadow={false} />
      <Label position={[0, 0.02, 0.05]} size={r * 0.55} color={C.orange} letterSpacing={-0.04}>JSF</Label>
      <Label position={[r * 0.62, r * 0.22, 0.05]} size={r * 0.14} color={C.orange}>®</Label>
      <group ref={ring} position={[0, 0, 0.05]}>
        {Array.from({ length: 10 }).map((_, i) => {
          const a = (i / 10) * Math.PI * 2
          return (
            <Spark key={i} position={[Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, 0]} size={r * 0.13} color={C.butter} />
          )
        })}
      </group>
    </group>
  )
}
