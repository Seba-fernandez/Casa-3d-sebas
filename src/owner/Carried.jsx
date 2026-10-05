import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RBox, Ball, Label, Spark } from '../game/kit'
import { useGame } from '../store'
import { C } from '../theme'

/* El objeto que Sebas lleva en las manos (hijo del grupo del jugador) */
export function Carried() {
  const carry = useGame((s) => s.carry)
  const g = useRef()
  useFrame(({ clock }) => {
    if (!g.current) return
    g.current.position.y = 1.02 + Math.sin(clock.elapsedTime * 5) * 0.012
    // aparece con un "pop"
    const s = g.current.scale.x + (1 - g.current.scale.x) * 0.2
    g.current.scale.setScalar(s)
  })
  if (!carry) return null

  return (
    <group ref={g} key={carry.label} position={[0, 1.02, 0.42]} scale={0.01}>
      {carry.kind === 'skill' && (
        <group>
          <RBox size={[0.26, 0.2, 0.2]} position={[0, 0.02, 0]} color={C.sky} radius={0.05} outline />
          <RBox size={[0.29, 0.05, 0.22]} position={[0, 0.14, 0]} color={C.white} radius={0.02} />
          <RBox size={[0.24, 0.1, 0.01]} position={[0, 0.02, 0.105]} color={C.white} radius={0.02} shadow={false} />
          <Label position={[0, 0.02, 0.112]} size={0.03} color={C.ink} maxWidth={0.22}>{carry.label}</Label>
        </group>
      )}
      {carry.kind === 'category' && (
        <group>
          <RBox size={[0.42, 0.26, 0.3]} color={C.woodLight} radius={0.04} outline />
          <RBox size={[0.36, 0.08, 0.02]} position={[0, 0.04, 0.155]} color={C.orange} radius={0.02} shadow={false} />
          <Label position={[0, 0.04, 0.17]} size={0.035} color={C.white} maxWidth={0.34}>{carry.label}</Label>
          <Spark size={0.08} color={C.white} position={[0, -0.06, 0.155]} />
        </group>
      )}
      {carry.kind === 'project' && (
        <group>
          <RBox size={[0.4, 0.3, 0.32]} color="#D9A273" radius={0.03} outline />
          <RBox size={[0.08, 0.31, 0.33]} color="#C08353" radius={0.01} />
          <RBox size={[0.3, 0.1, 0.01]} position={[0.08, 0.05, 0.165]} color={C.white} radius={0.01} shadow={false} />
          <Label position={[0.08, 0.05, 0.172]} size={0.032} color={C.ink} maxWidth={0.28}>{carry.label}</Label>
        </group>
      )}
      {carry.kind === 'about' && (
        <group rotation={[0.2, 0, 0]}>
          <RBox size={[0.3, 0.06, 0.22]} color={C.lilac} radius={0.015} outline />
          <RBox size={[0.27, 0.045, 0.2]} position={[0.012, 0.004, 0]} color={C.white} radius={0.01} />
          <Ball r={0.02} position={[-0.1, 0.035, 0.07]} color={C.orange} shadow={false} />
        </group>
      )}
    </group>
  )
}
