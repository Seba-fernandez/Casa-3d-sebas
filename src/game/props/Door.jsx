import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RBox, Ball, Label, Toon, Spark, useItem, useSpawn, wallPoint, useRoom } from '../kit'
import { player, useGame } from '../../store'
import { C, ROOM_THEME } from '../../theme'

/**
 * Puerta entre habitaciones. Se dibuja en coordenadas locales de la pared
 * y se registra en el mundo: zona de paso + punto de aparición del otro lado.
 */
export function Door({ side, at = 0, to, label, color = C.orange, onUse, locked = false }) {
  const { w, d } = useRoom()
  const p = wallPoint(side, at, w, d)
  const leaf = useRef()
  const isExit = to === 'exit'

  // Cuando llegás DESDE `to`, aparecés frente a esta puerta mirando hacia adentro.
  const yaw = Math.atan2(p.nx, p.nz)
  useSpawn(isExit ? 'start' : `from:${to}`, p.x + p.nx * 1.35, p.z + p.nz * 1.35, yaw)

  useItem({
    x: p.x + p.nx * 0.45,
    z: p.z + p.nz * 0.45,
    r: 0.75,
    label: isExit ? 'Salir a la porta clásica' : locked ? 'Cerradura biométrica' : label,
    verb: isExit ? 'Salir' : locked ? 'Escanear' : 'Entrar',
    door: isExit || locked ? null : { to, nx: p.nx, nz: p.nz },
    onUse: locked ? () => useGame.getState().setScanner(true) : onUse,
  })

  useFrame((_, dt) => {
    const dist = Math.hypot(player.x - p.x, player.z - p.z)
    const open = dist < 1.7 && !locked ? -1.25 : 0
    leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, open, 7, dt)
  })

  return (
    <group position={[at, 0, 0]}>
      <Doorway to={to} />
      {/* marco */}
      <RBox size={[0.16, 2.35, 0.16]} position={[-0.63, 1.17, 0.02]} color={C.white} radius={0.04} outline />
      <RBox size={[0.16, 2.35, 0.16]} position={[0.63, 1.17, 0.02]} color={C.white} radius={0.04} outline />
      <RBox size={[1.42, 0.18, 0.18]} position={[0, 2.3, 0.02]} color={C.white} radius={0.05} outline />

      {/* hoja de la puerta con bisagra a la izquierda */}
      <group ref={leaf} position={[-0.55, 0, 0.04]}>
        <RBox size={[1.1, 2.15, 0.08]} position={[0.55, 1.08, 0]} color={color} radius={0.04} outline />
        <RBox size={[0.78, 0.8, 0.03]} position={[0.55, 1.55, 0.05]} color={C.white} radius={0.03} />
        <RBox size={[0.78, 0.6, 0.03]} position={[0.55, 0.55, 0.05]} color={C.white} radius={0.03} />
        <Spark position={[0.55, 1.55, 0.075]} size={0.36} color={color} />
        <Ball r={0.055} position={[0.95, 1.05, 0.08]} color={C.butter} outline />
      </group>

      {/* cerradura biométrica: luz roja cerrada, verde para el dueño */}
      {locked !== undefined && to === 'bano' && <LockPanel locked={locked} />}

      {/* cartel de madera */}
      <group position={[0, 2.66, 0.08]}>
        <RBox size={[Math.max(1.3, label.length * 0.13 + 0.4), 0.4, 0.08]} color={C.woodLight} radius={0.08} outline />
        <Label position={[0, 0, 0.05]} size={0.19} color={C.ink}>{label}</Label>
      </group>
    </group>
  )
}

/* Felpudo en el piso, frente a la puerta (no se hunde con la pared) */
export function DoorMat({ side, at = 0, color = C.orange }) {
  const { w, d } = useRoom()
  const p = wallPoint(side, at, w, d, 0.55)
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
      <RBox size={[1.1, 0.025, 0.6]} radius={0.01} position={[0, 0.013, 0]} color={color} shadow={false} />
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.17, 24]} />
        <Toon color={C.white} />
      </mesh>
    </group>
  )
}

/* Panelcito con escáner de huella al lado de la puerta */
function LockPanel({ locked }) {
  const led = useRef()
  useFrame(({ clock }) => {
    if (led.current) led.current.material.color.set(locked ? (Math.sin(clock.elapsedTime * 4) > 0 ? '#FF3B30' : '#8A1C17') : '#4ED18A')
  })
  return (
    <group position={[0.9, 1.3, 0.06]}>
      <RBox size={[0.26, 0.4, 0.06]} color={C.ink} radius={0.04} outline />
      <mesh position={[0, 0.03, 0.035]}>
        <planeGeometry args={[0.18, 0.2]} />
        <meshBasicMaterial color="#1C4D3F" />
      </mesh>
      {[0.03, 0.055, 0.08].map((r) => (
        <mesh key={r} position={[0, 0.03, 0.037]}>
          <ringGeometry args={[r - 0.006, r, 20, 1, Math.PI * 0.1, Math.PI * 1.8]} />
          <meshBasicMaterial color="#7CF2B8" />
        </mesh>
      ))}
      <mesh ref={led} position={[0, -0.14, 0.035]}>
        <circleGeometry args={[0.022, 16]} />
        <meshBasicMaterial color="#FF3B30" />
      </mesh>
    </group>
  )
}

/* Vano de la puerta: tapa molduras y zócalo de la pared y deja ver la luz de la otra habitación */
function Doorway({ to }) {
  const tex = useMemo(() => {
    const glow = to === 'exit' ? '#CFEAF7' : ROOM_THEME[to]?.wall || '#F3E1C7'
    const cv = document.createElement('canvas')
    cv.width = 8
    cv.height = 128
    const g = cv.getContext('2d')
    const grad = g.createLinearGradient(0, 0, 0, 128)
    grad.addColorStop(0, '#16302B')
    grad.addColorStop(0.45, '#2A4A43')
    grad.addColorStop(1, glow)
    g.fillStyle = grad
    g.fillRect(0, 0, 8, 128)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [to])
  return (
    <group>
      {/* fondo del vano, por delante de todo lo que hay pegado a la pared */}
      <mesh position={[0, 1.08, 0.016]}>
        <planeGeometry args={[1.12, 2.16]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* jambas interiores para que el vano tenga profundidad */}
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, 1.08, 0.03]}>
          <boxGeometry args={[0.02, 2.16, 0.03]} />
          <meshBasicMaterial color="#0F2622" />
        </mesh>
      ))}
      {/* umbral en el piso */}
      <mesh position={[0, 0.012, 0.09]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.12, 0.16]} />
        <meshBasicMaterial color="#B98A5E" />
      </mesh>
    </group>
  )
}
