import { forwardRef, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import { Toon, Spark } from './kit'
import { AVATAR as A } from '../avatar.config'

const LINE = { thickness: 0.016, color: '#3B2A22' }

function Part({ geo, color, outline = true, ...props }) {
  return (
    <mesh castShadow {...props}>
      {geo}
      <Toon color={color} />
      {outline && <Outlines {...LINE} />}
    </mesh>
  )
}

/**
 * Avatar chibi hecho con primitivas (sin modelos externos): ~1,6 m, cabeza grande, cel-shading.
 * Se anima por código según la velocidad que le pasa el controlador.
 */
export const Avatar = forwardRef(function Avatar(_, ref) {
  const root = useRef()
  const body = useRef()
  const head = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()
  const eyes = useRef()
  const state = useRef({ phase: 0, speed: 0, blink: 2.5, wave: 0 })

  useImperativeHandle(ref, () => ({
    setSpeed: (v) => (state.current.speed = v),
    wave: () => (state.current.wave = 1.4),
  }))

  useFrame(({ clock }, dt) => {
    const s = state.current
    const t = clock.elapsedTime
    const k = Math.min(1, s.speed / 2.6) // 0 quieto · 1 caminando · >1 corriendo
    const run = Math.min(1, Math.max(0, (s.speed - 2.8) / 1.6))
    s.phase += dt * (4 + s.speed * 2.6)

    const swing = Math.sin(s.phase)
    const legAmp = 0.65 * k + run * 0.25
    const armAmp = 0.55 * k + run * 0.35

    legL.current.rotation.x = swing * legAmp
    legR.current.rotation.x = -swing * legAmp
    armL.current.rotation.x = -swing * armAmp
    armR.current.rotation.x = swing * armAmp
    armL.current.rotation.z = 0.12 + (1 - k) * 0.04
    armR.current.rotation.z = -0.12 - (1 - k) * 0.04

    // saludo
    if (s.wave > 0) {
      s.wave -= dt
      const w = Math.min(1, s.wave * 2)
      armR.current.rotation.z = THREE.MathUtils.lerp(armR.current.rotation.z, -2.6, w)
      armR.current.rotation.x = Math.sin(t * 14) * 0.25 * w
    }

    // rebote, respiración e inclinación
    const bob = Math.abs(Math.cos(s.phase)) * 0.055 * k
    const breathe = Math.sin(t * 2.2) * 0.012 * (1 - k)
    body.current.position.y = bob + breathe
    body.current.rotation.x = 0.06 * k + run * 0.1
    head.current.rotation.x = -0.05 * k + Math.sin(t * 1.3) * 0.02 * (1 - k)
    head.current.rotation.z = Math.sin(t * 0.9) * 0.03 * (1 - k)

    // parpadeo
    s.blink -= dt
    let eyeY = 1
    if (s.blink < 0.12) eyeY = 0.15
    if (s.blink < 0) s.blink = 2 + Math.random() * 3
    eyes.current.scale.y = THREE.MathUtils.damp(eyes.current.scale.y, eyeY, 30, dt)
  })

  return (
    <group ref={root}>
      <group ref={body}>
        {/* ── piernas ── */}
        {[
          [legL, -0.1],
          [legR, 0.1],
        ].map(([r, x]) => (
          <group key={x} ref={r} position={[x, 0.58, 0]}>
            <Part geo={<capsuleGeometry args={[0.085, 0.3, 6, 12]} />} color={A.pants} position={[0, -0.24, 0]} />
            <group position={[0, -0.5, 0.04]}>
              <Part geo={<boxGeometry args={[0.17, 0.11, 0.27]} />} color={A.shoes} />
              <Part geo={<boxGeometry args={[0.18, 0.035, 0.28]} />} color={A.shoeSole} position={[0, -0.06, 0]} outline={false} />
            </group>
          </group>
        ))}

        {/* ── torso (buzo) ── */}
        <Part geo={<capsuleGeometry args={[0.2, 0.26, 8, 18]} />} color={A.hoodie} position={[0, 0.84, 0]} scale={[1.08, 1, 0.82]} />
        <Part geo={<torusGeometry args={[0.13, 0.045, 8, 18]} />} color={A.hoodieTrim} position={[0, 1.07, -0.03]} rotation={[Math.PI / 2 + 0.2, 0, 0]} />
        {/* bolsillo canguro + cordones + ✳ */}
        <Part geo={<boxGeometry args={[0.26, 0.1, 0.04]} />} color={A.hoodieTrim} position={[0, 0.7, 0.16]} outline={false} />
        <Spark size={0.11} color="#FFF9F1" position={[0.08, 0.9, 0.172]} />
        <mesh position={[-0.05, 0.98, 0.16]}>
          <cylinderGeometry args={[0.008, 0.008, 0.14]} />
          <Toon color="#FFF9F1" />
        </mesh>
        <mesh position={[0.05, 0.98, 0.16]}>
          <cylinderGeometry args={[0.008, 0.008, 0.14]} />
          <Toon color="#FFF9F1" />
        </mesh>

        {A.backpack && (
          <group position={[0, 0.88, -0.2]}>
            <Part geo={<boxGeometry args={[0.32, 0.36, 0.14]} />} color={A.backpackColor} />
            <Part geo={<boxGeometry args={[0.24, 0.12, 0.05]} />} color={A.hoodieTrim} position={[0, -0.08, -0.08]} outline={false} />
          </group>
        )}

        {/* ── brazos ── */}
        {[
          [armL, -0.27, 1],
          [armR, 0.27, -1],
        ].map(([r, x]) => (
          <group key={x} ref={r} position={[x, 1.0, 0]}>
            <Part geo={<capsuleGeometry args={[0.068, 0.26, 6, 12]} />} color={A.hoodie} position={[0, -0.17, 0]} />
            <Part geo={<sphereGeometry args={[0.072, 14, 10]} />} color={A.skin} position={[0, -0.38, 0]} />
          </group>
        ))}

        {/* ── cabeza ── */}
        <group ref={head} position={[0, 1.33, 0]}>
          <Part geo={<sphereGeometry args={[0.255, 28, 20]} />} color={A.skin} scale={[1.02, 0.96, 0.95]} />
          {/* orejas */}
          <Part geo={<sphereGeometry args={[0.055, 12, 8]} />} color={A.skin} position={[-0.25, -0.02, 0]} />
          <Part geo={<sphereGeometry args={[0.055, 12, 8]} />} color={A.skin} position={[0.25, -0.02, 0]} />

          {/* pelo */}
          <Part
            geo={<sphereGeometry args={[0.272, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />}
            color={A.hair}
            position={[0, 0.02, -0.015]}
            rotation={[-0.32, 0, 0]}
          />
          {A.hairStyle === 'curly'
            ? Array.from({ length: 9 }).map((_, i) => {
                const a = (i / 9) * Math.PI * 2
                return <Part key={i} geo={<sphereGeometry args={[0.09, 10, 8]} />} color={A.hair} position={[Math.cos(a) * 0.2, 0.17, Math.sin(a) * 0.2 - 0.02]} outline={false} />
              })
            : [
                [-0.13, 0.17, 0.17, 0.5],
                [-0.02, 0.2, 0.19, 0.2],
                [0.1, 0.18, 0.18, -0.35],
                ...(A.hairStyle === 'messy' ? [[0.04, 0.29, 0.02, -0.6], [-0.08, 0.28, -0.06, 0.7]] : []),
              ].map(([x, y, z, rz], i) => (
                <Part
                  key={i}
                  geo={<sphereGeometry args={[0.1, 12, 8]} />}
                  color={A.hair}
                  position={[x, y, z]}
                  rotation={[0.6, 0, rz]}
                  scale={[0.9, 0.55, 1.2]}
                  outline={false}
                />
              ))}

          {/* ojos grandes con brillo */}
          <group ref={eyes} position={[0, -0.02, 0.215]}>
            {[-0.085, 0.085].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <mesh scale={[0.042, 0.06, 0.025]}>
                  <sphereGeometry args={[1, 14, 10]} />
                  <Toon color={A.eyes} />
                </mesh>
                <mesh position={[0.014, 0.022, 0.022]}>
                  <sphereGeometry args={[0.014, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
          </group>
          {/* cachetes y sonrisa */}
          <mesh position={[-0.15, -0.09, 0.19]} scale={[0.045, 0.025, 0.01]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial color={A.blush} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.15, -0.09, 0.19]} scale={[0.045, 0.025, 0.01]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial color={A.blush} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, -0.1, 0.236]} rotation={[0.15, 0, Math.PI]}>
            <torusGeometry args={[0.03, 0.008, 6, 12, Math.PI]} />
            <Toon color={A.eyes} />
          </mesh>
          {A.glasses && (
            <group position={[0, -0.02, 0.245]}>
              {[-0.085, 0.085].map((x) => (
                <mesh key={x} position={[x, 0, 0]}>
                  <torusGeometry args={[0.07, 0.01, 6, 20]} />
                  <Toon color={A.eyes} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      </group>

      {/* sombra suave de contacto bajo los pies */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#3B2A22" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
})
