import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoomShell, Rug } from '../RoomShell'
import { RBox, Ball, Cyl, Caps, Label, Spark, useSolid } from '../kit'
import { Spot } from '../Spot'
import { Plant } from '../props/furniture'
import { ROOM_THEME, C } from '../../theme'
import { DOOR_COLORS } from './Hall'

const W = 6.4
const D = 5.4

/* Azulejos hasta media pared (textura de canvas, coordenadas locales de pared) */
function Tiles({ len, h = 1.35, color = '#FFFFFF', grout = '#A9D3D8' }) {
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = 128
    cv.height = 128
    const g = cv.getContext('2d')
    g.fillStyle = grout
    g.fillRect(0, 0, 128, 128)
    g.fillStyle = color
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) g.fillRect(x * 64 + 3, y * 64 + 3, 58, 58)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(len / 0.5, h / 0.5)
    return t
  }, [len, h, color, grout])
  return (
    <mesh position={[0, h / 2 + 0.28, 0.005]}>
      <planeGeometry args={[len, h]} />
      <meshToonMaterial map={tex} />
    </mesh>
  )
}

/* Patito de goma original que flota */
function Duck(props) {
  const g = useRef()
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.position.y = props.position[1] + Math.sin(clock.elapsedTime * 2) * 0.015
    g.current.rotation.y = Math.sin(clock.elapsedTime * 0.7) * 0.4
  })
  return (
    <group ref={g} {...props}>
      <Ball r={0.11} scale={[1.2, 0.8, 1]} color={C.butter} outline />
      <Ball r={0.07} position={[0.08, 0.1, 0]} color={C.butter} outline />
      <Caps r={0.02} len={0.04} position={[0.15, 0.09, 0]} rotation={[0, 0, Math.PI / 2]} color={C.orange} />
      <Ball r={0.012} position={[0.12, 0.13, 0.04]} color={C.ink} shadow={false} />
    </group>
  )
}

function Bathtub({ x, z }) {
  useSolid(x, z, 1.8, 0.9)
  const bubbles = useMemo(() => Array.from({ length: 14 }, (_, i) => [((i * 37) % 13) / 13 - 0.5, ((i * 17) % 7) / 7 - 0.5, 0.06 + (i % 4) * 0.025]), [])
  return (
    <group position={[x, 0, z]}>
      <RBox size={[1.8, 0.62, 0.9]} position={[0, 0.31, 0]} color={C.white} radius={0.2} outline />
      <RBox size={[1.55, 0.1, 0.66]} position={[0, 0.58, 0]} color="#8ED3E0" radius={0.05} shadow={false} />
      {bubbles.map(([bx, bz, r], i) => (
        <Ball key={i} r={r} position={[bx * 1.3, 0.64, bz * 0.5]} color="#FFFFFF" shadow={false} />
      ))}
      <Duck position={[0.45, 0.66, 0.1]} />
      {[[-0.75, -0.32], [0.75, -0.32], [-0.75, 0.32], [0.75, 0.32]].map(([px, pz]) => (
        <Ball key={px + '' + pz} r={0.06} position={[px, 0.03, pz]} color={C.butter} />
      ))}
      {/* canilla */}
      <Cyl r={0.025} h={0.3} position={[-0.82, 0.78, 0]} color={C.metal} />
      <Caps r={0.022} len={0.12} position={[-0.75, 0.92, 0]} rotation={[0, 0, Math.PI / 2]} color={C.metal} />
    </group>
  )
}

function Toilet({ x, z, ry }) {
  useSolid(x, z, 0.6, 0.75)
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Cyl r={0.17} rt={0.22} h={0.4} position={[0, 0.2, 0.05]} color={C.white} outline />
      <Cyl r={0.24} h={0.06} position={[0, 0.43, 0.08]} color={C.white} outline />
      <RBox size={[0.5, 0.45, 0.2]} position={[0, 0.65, -0.22]} color={C.white} radius={0.06} outline />
      <RBox size={[0.08, 0.03, 0.04]} position={[0.15, 0.9, -0.22]} color={C.metal} radius={0.01} />
    </group>
  )
}

function Sink({ x, z }) {
  useSolid(x, z, 0.95, 0.55)
  return (
    <group position={[x, 0, z]}>
      <RBox size={[0.9, 0.78, 0.5]} position={[0, 0.39, 0]} color="#6FB7C9" radius={0.05} outline />
      <RBox size={[0.4, 0.3, 0.02]} position={[-0.21, 0.4, 0.255]} color="#8ECCD9" radius={0.03} />
      <RBox size={[0.4, 0.3, 0.02]} position={[0.21, 0.4, 0.255]} color="#8ECCD9" radius={0.03} />
      <RBox size={[0.95, 0.06, 0.55]} position={[0, 0.81, 0]} color={C.white} radius={0.03} outline />
      <Cyl r={0.17} h={0.04} position={[0, 0.84, 0.02]} color="#BFE6EE" />
      <Cyl r={0.02} h={0.18} position={[0, 0.92, -0.18]} color={C.metal} />
      <Caps r={0.018} len={0.1} position={[0, 1.0, -0.12]} rotation={[Math.PI / 2, 0, 0]} color={C.metal} />
      {/* frasquitos de perfume */}
      <RBox size={[0.07, 0.14, 0.05]} position={[0.32, 0.91, -0.12]} color={C.lilac} radius={0.02} outline />
      <Ball r={0.05} position={[0.4, 0.89, -0.15]} color={C.blush} outline />
    </group>
  )
}

/* Espejo-consola: refleja el estado del modo dueño */
function MirrorConsole({ x }) {
  const glow = useRef()
  useFrame(({ clock }) => {
    if (glow.current) glow.current.material.opacity = 0.18 + Math.sin(clock.elapsedTime * 2) * 0.06
  })
  return (
    <group position={[x, 1.7, 0.04]}>
      <RBox size={[1.0, 1.0, 0.06]} color={C.white} radius={0.5} outline shadow={false} />
      <mesh position={[0, 0, 0.035]}>
        <circleGeometry args={[0.44, 40]} />
        <meshBasicMaterial color="#CFEFF4" />
      </mesh>
      <mesh ref={glow} position={[0, 0, 0.037]}>
        <circleGeometry args={[0.44, 40]} />
        <meshBasicMaterial color="#38E0B0" transparent opacity={0.2} />
      </mesh>
      <Label position={[0, 0.08, 0.04]} size={0.07} color={C.green}>CONSOLA</Label>
      <Label position={[0, -0.04, 0.04]} size={0.05} color={C.greenSoft}>del dueño</Label>
      <Spark size={0.1} color={C.orange} position={[0, -0.18, 0.04]} />
    </group>
  )
}

export function Bano() {
  const t = ROOM_THEME.bano
  const tiles = (len) => <Tiles len={len} />

  return (
    <RoomShell
      id="bano"
      w={W}
      d={D}
      theme={t}
      doors={[{ side: 'e', at: 0, to: 'hall', label: 'Hall', color: DOOR_COLORS.exit }]}
      n={
        <>
          {tiles(W)}
          <MirrorConsole x={1.3} />
          <group position={[-1.6, 2.35, 0.05]}>
            <RBox size={[1.8, 0.34, 0.05]} color={C.green} radius={0.08} outline shadow={false} />
            <Label position={[0, 0, 0.04]} size={0.11} color={C.butter}>SOLO EL DUEÑO</Label>
          </group>
        </>
      }
      s={
        <>
          {tiles(W)}
          {/* toallero */}
          <group position={[1.2, 1.25, 0.08]}>
            <Cyl r={0.02} h={0.9} rotation={[0, 0, Math.PI / 2]} color={C.metal} />
            <RBox size={[0.42, 0.6, 0.04]} position={[-0.2, -0.3, 0.02]} color={C.orange} radius={0.03} />
            <RBox size={[0.36, 0.5, 0.04]} position={[0.22, -0.26, 0.02]} color={C.mint} radius={0.03} />
          </group>
        </>
      }
      wSide={<>{tiles(D)}</>}
      e={<>{tiles(D)}</>}
    >
      <Rug w={1.6} d={1.0} color={t.rug} color2={t.rug2} position={[1.3, 0, -1.3]} />
      <Bathtub x={-1.95} z={-2.05} />
      <Toilet x={-2.75} z={1.3} ry={Math.PI / 2} />
      <Sink x={1.3} z={-2.38} />
      <Plant position={[2.7, 0, 2.2]} kind="round" size={0.9} />

      <Spot x={1.3} z={-1.55} r={0.85} label="Espejo · Consola del dueño" verb="Usar" panel={{ type: 'console' }} marker markerY={2.45} />
      <Spot x={-1.4} z={-1.2} r={0.8} label="Patito" verb="Apretar" say={['¡Cuac!', 'El patito aprueba tus últimos cambios.']} who="Patito" />
      <Spot x={-2.1} z={1.3} r={0.7} label="Inodoro" verb="Mirar" say={['Todo en orden por acá.', 'Mejor volvamos a la consola.']} />
    </RoomShell>
  )
}
