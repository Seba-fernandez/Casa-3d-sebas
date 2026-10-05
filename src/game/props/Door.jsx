import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RBox, Ball, Label, Toon, Spark, useItem, useSpawn, wallPoint, useRoom } from '../kit'
import { player } from '../../store'
import { C } from '../../theme'

/**
 * Puerta entre habitaciones. Se dibuja en coordenadas locales de la pared
 * y se registra en el mundo: zona de paso + punto de aparición del otro lado.
 */
export function Door({ side, at = 0, to, label, color = C.orange, onUse }) {
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
    label: isExit ? 'Salir a la porta clásica' : label,
    verb: isExit ? 'Salir' : 'Entrar',
    door: isExit ? null : { to, nx: p.nx, nz: p.nz },
    onUse,
  })

  useFrame((_, dt) => {
    const dist = Math.hypot(player.x - p.x, player.z - p.z)
    const open = dist < 1.7 ? -1.25 : 0
    leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, open, 7, dt)
  })

  return (
    <group position={[at, 0, 0]}>
      {/* hueco oscuro (lo que se ve al abrir) */}
      <mesh position={[0, 1.08, -0.01]}>
        <planeGeometry args={[1.1, 2.16]} />
        <meshBasicMaterial color={C.green} />
      </mesh>
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
