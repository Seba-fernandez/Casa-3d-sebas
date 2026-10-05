import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RBox, Ball, Cyl, Caps, Label, Toon, Spark } from '../kit'
import { C } from '../../theme'

/* ─────────────── Captura de un proyecto como textura (con fallback) ─────────────── */
const texCache = new Map()
export function useRemoteTexture(url) {
  const [tex, setTex] = useState(() => (url ? texCache.get(url) || null : null))
  useEffect(() => {
    if (!url || texCache.has(url)) return
    let alive = true
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')
    loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 4
        texCache.set(url, t)
        if (alive) setTex(t)
      },
      undefined,
      () => {} // sin imagen: queda el color de fondo
    )
    return () => {
      alive = false
    }
  }, [url])
  return tex
}

/* Pantalla/cuadro con la captura recortada arriba (estilo "cover") */
export function Screenshot({ url, w = 1.2, h = 0.75, color = C.mint, crop = 'top' }) {
  const tex = useRemoteTexture(url)
  useEffect(() => {
    if (!tex?.image) return
    const imgAspect = tex.image.width / tex.image.height
    const boxAspect = w / h
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    if (imgAspect > boxAspect) {
      tex.repeat.set(boxAspect / imgAspect, 1)
      tex.offset.set((1 - tex.repeat.x) / 2, 0)
    } else {
      tex.repeat.set(1, imgAspect / boxAspect)
      tex.offset.set(0, crop === 'top' ? 1 - tex.repeat.y : (1 - tex.repeat.y) / 2)
    }
    tex.needsUpdate = true
  }, [tex, w, h, crop])
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <Toon color={color} />}
    </mesh>
  )
}

/* Lucecita de estado: live verde · en progreso ámbar · pendiente gris */
export function StatusLamp({ status = 'live', ...props }) {
  const m = useRef()
  const color = status === 'live' ? '#4ED18A' : status === 'wip' ? '#F7B23B' : '#B9B2AA'
  useFrame(({ clock }) => {
    if (m.current) m.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08)
  })
  return (
    <group {...props}>
      <mesh ref={m}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.085, 12, 10]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ─────────────── Objetos que representan cada proyecto ─────────────── */

function Racket() {
  return (
    <group rotation={[0, 0, 0.35]}>
      <Ball r={0.2} scale={[0.85, 1, 0.18]} position={[0, 0.42, 0]} color={C.orange} outline />
      {[-0.08, 0, 0.08].map((x) =>
        [0.34, 0.44, 0.52].map((y) => <Ball key={x + '' + y} r={0.018} position={[x, y, 0.04]} color={C.ink} shadow={false} />)
      )}
      <Caps r={0.035} len={0.22} position={[0, 0.12, 0]} color={C.ink} outline />
      <Ball r={0.06} position={[0.28, 0.06, 0.1]} color="#E6F46B" outline />
    </group>
  )
}

function Perfume() {
  const bottles = [
    [-0.16, C.lilac, 0.26, 'round'],
    [0.02, C.blush, 0.32, 'square'],
    [0.2, C.butter, 0.22, 'round'],
  ]
  return (
    <group>
      {bottles.map(([x, color, h, shape], i) => (
        <group key={i} position={[x, 0, (i % 2) * 0.08]}>
          {shape === 'round' ? (
            <Ball r={h * 0.45} position={[0, h * 0.45, 0]} color={color} outline />
          ) : (
            <RBox size={[0.16, h, 0.1]} position={[0, h / 2, 0]} color={color} radius={0.04} outline />
          )}
          <Cyl r={0.025} h={0.06} position={[0, h * 0.9 + 0.03, 0]} color={C.metal} />
          <Ball r={0.04} position={[0, h * 0.9 + 0.09, 0]} color={C.butter} outline />
        </group>
      ))}
    </group>
  )
}

function Mic() {
  return (
    <group>
      <Cyl r={0.14} h={0.03} position={[0, 0.015, 0]} color={C.ink} />
      <Cyl r={0.015} h={0.35} position={[0, 0.19, 0]} color={C.metal} />
      <Caps r={0.07} len={0.08} position={[0, 0.42, 0]} rotation={[0.3, 0, 0]} color={C.sage} outline />
      <Ball r={0.065} position={[0, 0.48, 0.02]} color="#555" />
      {/* checklist */}
      <group position={[0.22, 0.02, 0.05]} rotation={[-Math.PI / 2 + 0.2, 0, -0.3]}>
        <RBox size={[0.2, 0.26, 0.01]} color={C.white} radius={0.005} />
        {[0.07, 0, -0.07].map((y) => (
          <group key={y} position={[-0.05, y, 0.01]}>
            <RBox size={[0.03, 0.03, 0.01]} color={C.sage} radius={0.004} shadow={false} />
            <RBox size={[0.1, 0.012, 0.005]} position={[0.08, 0, 0]} color={C.metal} radius={0.003} shadow={false} />
          </group>
        ))}
      </group>
    </group>
  )
}

function Court() {
  return (
    <group>
      <RBox size={[0.52, 0.04, 0.32]} position={[0, 0.02, 0]} color="#5FA777" radius={0.01} outline />
      <RBox size={[0.5, 0.005, 0.01]} position={[0, 0.045, 0]} color={C.white} radius={0.002} shadow={false} />
      <RBox size={[0.01, 0.08, 0.3]} position={[0, 0.08, 0]} color={C.white} radius={0.003} />
      <Ball r={0.03} position={[0.12, 0.07, 0.06]} color="#E6F46B" />
    </group>
  )
}

function Coffee() {
  const steam = useRef()
  useFrame(({ clock }) => {
    if (!steam.current) return
    steam.current.children.forEach((m, i) => {
      const k = (clock.elapsedTime * 0.5 + i / 3) % 1
      m.position.y = 0.2 + k * 0.25
      m.material.opacity = 0.5 * (1 - k)
    })
  })
  return (
    <group>
      <Cyl r={0.14} h={0.02} position={[0, 0.01, 0]} color={C.white} outline />
      <Cyl r={0.08} rt={0.095} h={0.15} position={[0, 0.095, 0]} color={C.white} outline />
      <Cyl r={0.085} h={0.01} position={[0, 0.168, 0]} color="#6B3F25" shadow={false} />
      <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.035, 0.012, 8, 14, Math.PI]} />
        <Toon color={C.white} />
      </mesh>
      <group ref={steam}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[(i - 1) * 0.03, 0.2, 0]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshBasicMaterial color="#fff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Vinyl() {
  const disc = useRef()
  useFrame((_, dt) => {
    if (disc.current) disc.current.rotation.y += dt * 1.6
  })
  return (
    <group>
      <RBox size={[0.42, 0.06, 0.42]} position={[0, 0.03, 0]} color={C.blush} radius={0.02} outline />
      <group ref={disc} position={[0, 0.07, 0]}>
        <Cyl r={0.17} h={0.012} color={C.ink} />
        <Cyl r={0.06} h={0.014} color="#E86A8C" />
      </group>
      <Cyl r={0.01} h={0.18} position={[0.16, 0.1, -0.14]} rotation={[0, 0, 1.2]} color={C.metal} />
    </group>
  )
}

function Crate({ color = C.sage }) {
  return (
    <group>
      <RBox size={[0.34, 0.3, 0.34]} position={[0, 0.15, 0]} color={color} radius={0.04} outline />
      <Spark size={0.16} color={C.white} position={[0, 0.15, 0.175]} />
    </group>
  )
}

export function ProjectProp({ prop, color }) {
  switch (prop) {
    case 'racket':
      return <Racket />
    case 'perfume':
      return <Perfume />
    case 'mic':
      return <Mic />
    case 'court':
      return <Court />
    case 'coffee':
      return <Coffee />
    case 'vinyl':
      return <Vinyl />
    default:
      return <Crate color={color} />
  }
}

/* ─────────────── Objetos de cada categoría de skills ─────────────── */

function Books() {
  return (
    <group>
      {[C.orange, C.green, C.butter].map((c, i) => (
        <RBox key={i} size={[0.36 - i * 0.04, 0.07, 0.26]} position={[0, 0.035 + i * 0.075, 0]} rotation={[0, i * 0.2, 0]} color={c} radius={0.015} outline />
      ))}
    </group>
  )
}
function Blocks() {
  return (
    <group>
      <RBox size={[0.16, 0.16, 0.16]} position={[-0.09, 0.08, 0]} color={C.butter} radius={0.03} outline />
      <RBox size={[0.16, 0.16, 0.16]} position={[0.09, 0.08, 0.02]} color={C.sky} radius={0.03} outline />
      <RBox size={[0.16, 0.16, 0.16]} position={[0, 0.24, 0.01]} rotation={[0, 0.4, 0]} color={C.orange} radius={0.03} outline />
      <Label position={[0, 0.24, 0.1]} size={0.07} color={C.white}>JS</Label>
    </group>
  )
}
function Gauge() {
  const needle = useRef()
  useFrame(({ clock }) => {
    if (needle.current) needle.current.rotation.z = -0.9 + Math.sin(clock.elapsedTime * 1.2) * 0.25
  })
  return (
    <group position={[0, 0.2, 0]}>
      <Cyl r={0.2} h={0.06} rotation={[Math.PI / 2, 0, 0]} color={C.white} outline />
      <mesh position={[0, 0, 0.032]}>
        <ringGeometry args={[0.12, 0.17, 24, 1, 0, Math.PI]} />
        <Toon color="#4ED18A" />
      </mesh>
      <group ref={needle} position={[0, 0, 0.04]}>
        <RBox size={[0.02, 0.16, 0.01]} position={[0, 0.07, 0]} color={C.orange} radius={0.004} />
      </group>
      <Label position={[0, -0.08, 0.04]} size={0.06} color={C.green}>90+</Label>
    </group>
  )
}
function Heart() {
  const g = useRef()
  useFrame(({ clock }) => {
    if (g.current) g.current.scale.setScalar(1 + Math.max(0, Math.sin(clock.elapsedTime * 4)) * 0.08)
  })
  return (
    <group ref={g} position={[0, 0.2, 0]}>
      <Ball r={0.09} position={[-0.06, 0.04, 0]} color={C.blush} outline />
      <Ball r={0.09} position={[0.06, 0.04, 0]} color={C.blush} outline />
      <mesh position={[0, -0.04, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <Toon color={C.blush} />
      </mesh>
    </group>
  )
}
function Tools() {
  return (
    <group>
      <RBox size={[0.4, 0.14, 0.2]} position={[0, 0.07, 0]} color={C.orange} radius={0.03} outline />
      <Caps r={0.02} len={0.1} position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} color={C.ink} />
      <Cyl r={0.015} h={0.28} position={[0.08, 0.2, 0.05]} rotation={[0, 0, 1.2]} color={C.metal} />
      <RBox size={[0.08, 0.05, 0.05]} position={[0.2, 0.25, 0.05]} color={C.metal} radius={0.01} />
    </group>
  )
}
function Sprouts() {
  const g = useRef()
  useFrame(({ clock }) => {
    if (g.current) g.current.children.forEach((c, i) => (c.rotation.z = Math.sin(clock.elapsedTime * 1.5 + i) * 0.12))
  })
  return (
    <group>
      <RBox size={[0.42, 0.12, 0.18]} position={[0, 0.06, 0]} color={C.pot} radius={0.03} outline />
      <group ref={g}>
        {[-0.12, 0, 0.12].map((x, i) => (
          <group key={x} position={[x, 0.12, 0]}>
            <Cyl r={0.008} h={0.1 + i * 0.04} position={[0, 0.05 + i * 0.02, 0]} color={C.leafDark} shadow={false} />
            <Ball r={0.035} position={[-0.025, 0.1 + i * 0.04, 0]} scale={[1.4, 0.5, 1]} color={C.leaf} />
            <Ball r={0.035} position={[0.025, 0.11 + i * 0.04, 0]} scale={[1.4, 0.5, 1]} color={C.leaf} />
          </group>
        ))}
      </group>
    </group>
  )
}

export function SkillProp({ prop }) {
  switch (prop) {
    case 'books':
      return <Books />
    case 'blocks':
      return <Blocks />
    case 'gauge':
      return <Gauge />
    case 'heart':
      return <Heart />
    case 'tools':
      return <Tools />
    case 'sprouts':
      return <Sprouts />
    default:
      return <Blocks />
  }
}

/* Flecha flotante "!" sobre objetos interactivos (tipo indicador de juego) */
export function Bubble({ position = [0, 2, 0], color = C.orange }) {
  const g = useRef()
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2.5) * 0.06
    g.current.rotation.y += 0.02
  })
  return (
    <group ref={g} position={position}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, 0.16, 4]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}
