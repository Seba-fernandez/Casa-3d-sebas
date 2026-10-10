import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Outlines, Text } from '@react-three/drei'
import { C, FONT_URL } from '../theme'

/* ───────────────────────── Material toon ───────────────────────── */

let gradient
function getGradient() {
  if (gradient) return gradient
  // 4 escalones de luz: el "look" cel-shading de juego de consola
  const data = new Uint8Array([90, 90, 90, 255, 165, 165, 165, 255, 222, 222, 222, 255, 255, 255, 255, 255])
  gradient = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat)
  gradient.minFilter = THREE.NearestFilter
  gradient.magFilter = THREE.NearestFilter
  gradient.generateMipmaps = false
  gradient.needsUpdate = true
  return gradient
}

const matCache = new Map()
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts)
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: getGradient(), ...opts }))
  }
  return matCache.get(key)
}

export function Toon({ color = C.white, ...opts }) {
  return <primitive object={toon(color, opts)} attach="material" />
}

/* ───────────────────────── Primitivas ───────────────────────── */

const OUT = { thickness: 0.018, color: '#3B2A22' }

export function RBox({ size = [1, 1, 1], radius = 0.06, color, outline = false, shadow = true, children, ...props }) {
  const r = Math.min(radius, ...size.map((s) => s / 2 - 0.001))
  return (
    <RoundedBox args={size} radius={Math.max(r, 0.001)} smoothness={3} castShadow={shadow} receiveShadow {...props}>
      <Toon color={color} />
      {outline && <Outlines {...OUT} />}
      {children}
    </RoundedBox>
  )
}

export function Ball({ r = 0.2, color, outline = false, seg = 24, shadow = true, ...props }) {
  return (
    <mesh castShadow={shadow} receiveShadow {...props}>
      <sphereGeometry args={[r, seg, Math.round(seg * 0.75)]} />
      <Toon color={color} />
      {outline && <Outlines {...OUT} />}
    </mesh>
  )
}

export function Cyl({ r = 0.2, rt, h = 0.4, color, seg = 24, outline = false, shadow = true, ...props }) {
  return (
    <mesh castShadow={shadow} receiveShadow {...props}>
      <cylinderGeometry args={[rt ?? r, r, h, seg]} />
      <Toon color={color} />
      {outline && <Outlines {...OUT} />}
    </mesh>
  )
}

export function Caps({ r = 0.1, len = 0.3, color, outline = false, shadow = true, ...props }) {
  return (
    <mesh castShadow={shadow} receiveShadow {...props}>
      <capsuleGeometry args={[r, len, 6, 14]} />
      <Toon color={color} />
      {outline && <Outlines {...OUT} />}
    </mesh>
  )
}

export function Label({ children, size = 0.16, color = C.ink, weight, maxWidth, ...props }) {
  return (
    <Text
      font={FONT_URL}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      maxWidth={maxWidth}
      textAlign="center"
      lineHeight={1.1}
      {...props}
    >
      {children}
    </Text>
  )
}

/*
 * Lo que va colgado de una pared (cuadros, ventanas, puertas, carteles) no proyecta sombra:
 * las paredes no tapan la luz, así que esas sombras caían al piso sueltas, como flotando.
 * Revisa cada tanto porque algunos hijos se montan después (texturas, textos, candado del baño).
 */
export function NoCast({ children }) {
  const g = useRef()
  const t = useRef(0)
  const strip = () => g.current?.traverse((o) => {
    if (o.castShadow) o.castShadow = false
  })
  useLayoutEffect(strip)
  useFrame((_, dt) => {
    t.current -= dt
    if (t.current > 0) return
    t.current = 0.3
    strip()
  })
  return <group ref={g}>{children}</group>
}

/* ─────────────── Mundo: colisiones, interacciones y spawns ─────────────── */
// Cada habitación registra sus sólidos, objetos interactivos y puntos de aparición.
// Se limpian solos cuando la habitación se desmonta.

export const world = {
  solids: new Map(), // id → { x, z, hw, hd }
  items: new Map(), // id → { x, z, r, label, verb, onUse, door? }
  spawns: new Map(), // nombre → { x, z, yaw }
  bounds: { hw: 5, hd: 4 },
}

let uid = 0
export function useSolid(x, z, w, d, enabled = true) {
  const id = useMemo(() => 's' + uid++, [])
  useEffect(() => {
    if (!enabled) return
    world.solids.set(id, { x, z, hw: w / 2, hd: d / 2 })
    return () => world.solids.delete(id)
  }, [id, x, z, w, d, enabled])
}

export function useItem(item) {
  const id = useMemo(() => 'i' + uid++, [])
  useEffect(() => {
    if (!item) return
    world.items.set(id, { id, ...item })
    return () => world.items.delete(id)
  })
  return id
}

export function useSpawn(name, x, z, yaw) {
  useEffect(() => {
    world.spawns.set(name, { x, z, yaw })
    return () => world.spawns.delete(name)
  }, [name, x, z, yaw])
}

/* Sólido invisible + visible en un solo componente */
export function Solid({ x, z, w, d }) {
  useSolid(x, z, w, d)
  return null
}

/* ─────────────── Contexto de habitación ─────────────── */
export const RoomCtx = createContext({ w: 10, d: 8, h: 3, id: 'hall' })
export const useRoom = () => useContext(RoomCtx)

// Convierte (lado de pared, desplazamiento) en coordenadas de mundo y dirección hacia adentro.
export function wallPoint(side, at, w, d, inset = 0) {
  switch (side) {
    case 'n':
      return { x: at, z: -d / 2 + inset, nx: 0, nz: 1, rot: 0 }
    case 's':
      return { x: -at, z: d / 2 - inset, nx: 0, nz: -1, rot: Math.PI }
    case 'w':
      return { x: -w / 2 + inset, z: -at, nx: 1, nz: 0, rot: Math.PI / 2 }
    case 'e':
      return { x: w / 2 - inset, z: at, nx: -1, nz: 0, rot: -Math.PI / 2 }
    default:
      return { x: 0, z: 0, nx: 0, nz: 1, rot: 0 }
  }
}

/* Asterisco ✳ de la marca, hecho en geometría (la tipografía no trae ese glifo) */
export function Spark({ size = 0.2, color = C.orange, thick = 0.18, ...props }) {
  return (
    <group {...props}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
          <boxGeometry args={[size, size * thick, size * 0.12]} />
          <Toon color={color} />
        </mesh>
      ))}
    </group>
  )
}

/* Mueble hueco (fondo + laterales + techo + base) para que se vea lo que hay adentro */
export function Cabinet({ w = 1.4, h = 1.8, d = 0.42, color = C.woodLight, back = C.woodDark, t = 0.06, ...props }) {
  return (
    <group {...props}>
      <RBox size={[w, h, t]} position={[0, h / 2, -d / 2 + t / 2]} color={back} radius={0.02} />
      <RBox size={[t, h, d]} position={[-w / 2 + t / 2, h / 2, 0]} color={color} radius={0.025} outline />
      <RBox size={[t, h, d]} position={[w / 2 - t / 2, h / 2, 0]} color={color} radius={0.025} outline />
      <RBox size={[w, t, d]} position={[0, h - t / 2, 0]} color={color} radius={0.025} outline />
      <RBox size={[w, t * 1.6, d]} position={[0, t * 0.8, 0]} color={color} radius={0.025} outline />
    </group>
  )
}
