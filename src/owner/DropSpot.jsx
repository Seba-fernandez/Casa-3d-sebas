import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Spot } from '../game/Spot'
import { useGame } from '../store'

/* Lugar donde se puede soltar lo que llevás. Solo existe si llevás algo de ese tipo. */
export function DropSpot({ kind, x, z, r = 0.9, label, target }) {
  const carry = useGame((s) => s.carry)
  if (!carry || carry.kind !== kind) return null
  const drop = () => {
    useGame.getState().setPending({ carry, target })
    useGame.getState().openPanel({ type: 'save' })
  }
  return (
    <>
      <Spot x={x} z={z} r={r} label={label} verb="Soltar" onUse={drop} marker markerY={1.9} />
      <Ring x={x} z={z} />
    </>
  )
}

/* Aro que late en el piso marcando el destino */
function Ring({ x, z }) {
  const m = useRef()
  useFrame(({ clock }) => {
    if (!m.current) return
    const k = (clock.elapsedTime * 0.8) % 1
    m.current.scale.setScalar(0.6 + k * 0.7)
    m.current.material.opacity = 0.7 * (1 - k)
  })
  return (
    <mesh ref={m} position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.38, 0.5, 32]} />
      <meshBasicMaterial color="#FF6A2B" transparent opacity={0.6} depthWrite={false} />
    </mesh>
  )
}
