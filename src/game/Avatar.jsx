import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Outlines } from '@react-three/drei'
import { Toon } from './kit'
import { AVATAR as A } from '../avatar.config'

const LINE = { thickness: 0.016, color: '#2A1A14' }

function Part({ geo, color, outline = true, ...props }) {
  return (
    <mesh castShadow {...props}>
      {geo}
      <Toon color={color} />
      {outline && <Outlines {...LINE} />}
    </mesh>
  )
}

/* Media luna (para la sonrisa abierta y los dientes) */
function useHalfDisc() {
  return useMemo(() => new THREE.CircleGeometry(1, 20, Math.PI, Math.PI), [])
}

/**
 * Sebas en versión chibi 3D: jopo con reflejo cobrizo, barba corta, bigote,
 * sonrisa con dientes, remera negra y jean azul. ~1,6 m, cel-shading.
 * El controlador le pasa la velocidad; `setCarry` cambia a la pose de llevar algo.
 */
export const Avatar = forwardRef(function Avatar(_, ref) {
  const body = useRef()
  const head = useRef()
  const armL = useRef()
  const armR = useRef()
  const legL = useRef()
  const legR = useRef()
  const eyes = useRef()
  const half = useHalfDisc()
  const state = useRef({ phase: 0, speed: 0, blink: 2.5, wave: 0, carry: 0, carrying: false })

  useImperativeHandle(ref, () => ({
    setSpeed: (v) => (state.current.speed = v),
    wave: () => (state.current.wave = 1.4),
    setCarry: (on) => (state.current.carrying = on),
  }))

  useFrame(({ clock }, dt) => {
    const s = state.current
    const t = clock.elapsedTime
    const k = Math.min(1, s.speed / 2.6)
    const run = Math.min(1, Math.max(0, (s.speed - 2.8) / 1.6))
    s.phase += dt * (4 + s.speed * 2.6)
    s.carry = THREE.MathUtils.damp(s.carry, s.carrying ? 1 : 0, 10, dt)

    const swing = Math.sin(s.phase)
    const legAmp = 0.65 * k + run * 0.25
    const armAmp = (0.55 * k + run * 0.35) * (1 - s.carry)

    legL.current.rotation.x = swing * legAmp
    legR.current.rotation.x = -swing * legAmp

    // brazos: caminata normal mezclada con la pose de cargar (brazos al frente)
    const carryX = -1.25 + Math.sin(s.phase) * 0.05 * k
    armL.current.rotation.x = THREE.MathUtils.lerp(-swing * armAmp, carryX, s.carry)
    armR.current.rotation.x = THREE.MathUtils.lerp(swing * armAmp, carryX, s.carry)
    armL.current.rotation.z = THREE.MathUtils.lerp(0.12, -0.28, s.carry)
    armR.current.rotation.z = THREE.MathUtils.lerp(-0.12, 0.28, s.carry)

    if (s.wave > 0 && s.carry < 0.1) {
      s.wave -= dt
      const w = Math.min(1, s.wave * 2)
      armR.current.rotation.z = THREE.MathUtils.lerp(armR.current.rotation.z, -2.6, w)
      armR.current.rotation.x = Math.sin(t * 14) * 0.25 * w
    }

    const bob = Math.abs(Math.cos(s.phase)) * 0.055 * k
    const breathe = Math.sin(t * 2.2) * 0.012 * (1 - k)
    body.current.position.y = bob + breathe
    body.current.rotation.x = 0.06 * k + run * 0.1 - s.carry * 0.04
    head.current.rotation.x = -0.05 * k + Math.sin(t * 1.3) * 0.02 * (1 - k)
    head.current.rotation.z = Math.sin(t * 0.9) * 0.03 * (1 - k)

    s.blink -= dt
    let eyeY = 1
    if (s.blink < 0.12) eyeY = 0.15
    if (s.blink < 0) s.blink = 2 + Math.random() * 3
    eyes.current.scale.y = THREE.MathUtils.damp(eyes.current.scale.y, eyeY, 30, dt)
  })

  return (
    <group>
      <group ref={body}>
        {/* ── piernas (jean) ── */}
        {[
          [legL, -0.1],
          [legR, 0.1],
        ].map(([r, x]) => (
          <group key={x} ref={r} position={[x, 0.6, 0]}>
            <Part geo={<capsuleGeometry args={[0.09, 0.3, 6, 12]} />} color={A.jeans} position={[0, -0.24, 0]} />
            <Part geo={<cylinderGeometry args={[0.094, 0.094, 0.05, 14]} />} color={A.jeansDark} position={[0, -0.42, 0]} outline={false} />
            <group position={[0, -0.52, 0.04]}>
              <Part geo={<boxGeometry args={[0.17, 0.11, 0.27]} />} color={A.shoes} />
              <Part geo={<boxGeometry args={[0.18, 0.035, 0.28]} />} color={A.shoeSole} position={[0, -0.06, 0]} outline={false} />
            </group>
          </group>
        ))}

        {/* cintura del jean */}
        <Part geo={<cylinderGeometry args={[0.2, 0.19, 0.12, 18]} />} color={A.jeans} position={[0, 0.64, 0]} scale={[1.05, 1, 0.82]} />

        {/* ── torso: remera negra ── */}
        <Part geo={<capsuleGeometry args={[0.2, 0.24, 8, 18]} />} color={A.tee} position={[0, 0.86, 0]} scale={[1.1, 1, 0.82]} />
        <Part geo={<torusGeometry args={[0.1, 0.022, 8, 18]} />} color={A.teeTrim} position={[0, 1.08, 0.0]} rotation={[Math.PI / 2 + 0.25, 0, 0]} outline={false} />
        <Part geo={<cylinderGeometry args={[0.075, 0.08, 0.1, 14]} />} color={A.skin} position={[0, 1.1, 0]} outline={false} />

        {/* ── brazos: manga corta negra + brazo de piel ── */}
        {[
          [armL, -0.28],
          [armR, 0.28],
        ].map(([r, x]) => (
          <group key={x} ref={r} position={[x, 1.0, 0]}>
            <Part geo={<capsuleGeometry args={[0.078, 0.08, 6, 12]} />} color={A.tee} position={[0, -0.06, 0]} />
            <Part geo={<capsuleGeometry args={[0.056, 0.22, 6, 12]} />} color={A.skin} position={[0, -0.22, 0]} />
            <Part geo={<sphereGeometry args={[0.068, 14, 10]} />} color={A.skin} position={[0, -0.38, 0]} />
          </group>
        ))}

        {/* ── cabeza ── */}
        <group ref={head} position={[0, 1.34, 0]}>
          <group scale={[1.02, 0.97, 0.95]}>
            <Part geo={<sphereGeometry args={[0.255, 28, 20]} />} color={A.skin} />
            {/* barba corta: casquete en la mitad inferior de la cara */}
            <mesh>
              <sphereGeometry args={[0.258, 28, 14, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.64, Math.PI * 0.26]} />
              <Toon color={A.beard} />
            </mesh>
          </group>
          {/* orejas */}
          <Part geo={<sphereGeometry args={[0.055, 12, 8]} />} color={A.skin} position={[-0.25, -0.01, 0]} />
          <Part geo={<sphereGeometry args={[0.055, 12, 8]} />} color={A.skin} position={[0.25, -0.01, 0]} />

          {/* pelo: costados cortos + jopo voluminoso hacia arriba y atrás */}
          <Part
            geo={<sphereGeometry args={[0.268, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />}
            color={A.hair}
            position={[0, 0.0, -0.02]}
            rotation={[-0.38, 0, 0]}
          />
          {[
            // [x, y, z, rotX, rotZ, escala largo, color]
            [0.0, 0.22, 0.1, -0.75, 0, 1.0, A.hair],
            [-0.11, 0.21, 0.06, -0.8, 0.3, 0.85, A.hair],
            [0.11, 0.21, 0.06, -0.8, -0.3, 0.85, A.hair],
            [0.0, 0.26, -0.02, -1.15, 0.05, 1.0, A.hair],
            [0.02, 0.3, 0.09, -0.55, -0.1, 0.55, A.hairTip],
          ].map(([x, y, z, rx, rz, l, c], i) => (
            <Part
              key={i}
              geo={<sphereGeometry args={[0.1, 14, 10]} />}
              color={c}
              position={[x, y, z]}
              rotation={[rx, 0, rz]}
              scale={[1.0, 1.45 * l, 0.85]}
              outline={i < 3}
            />
          ))}
          {/* patillas */}
          <Part geo={<boxGeometry args={[0.03, 0.12, 0.06]} />} color={A.hair} position={[-0.245, 0.02, 0.06]} outline={false} />
          <Part geo={<boxGeometry args={[0.03, 0.12, 0.06]} />} color={A.hair} position={[0.245, 0.02, 0.06]} outline={false} />

          {/* cejas gruesas */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.085, 0.072, 0.226]} rotation={[0, 0, Math.PI / 2 + sd * 0.14]}>
              <capsuleGeometry args={[0.016, 0.07, 4, 8]} />
              <Toon color={A.hair} />
            </mesh>
          ))}

          {/* ojos achinados de sonrisa, con brillo */}
          <group ref={eyes} position={[0, 0.0, 0.226]}>
            {[-0.085, 0.085].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <mesh scale={[0.038, 0.034, 0.02]}>
                  <sphereGeometry args={[1, 14, 10]} />
                  <Toon color={A.eyes} />
                </mesh>
                <mesh position={[0.012, 0.012, 0.018]}>
                  <sphereGeometry args={[0.01, 8, 6]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
          </group>

          {/* bigote */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.045, -0.083, 0.228]} rotation={[0, 0, Math.PI / 2 + sd * 0.25]}>
              <capsuleGeometry args={[0.017, 0.055, 4, 8]} />
              <Toon color={A.beard} />
            </mesh>
          ))}

          {/* sonrisa grande con dientes */}
          <group position={[0, -0.108, 0.226]} rotation={[-0.45, 0, 0]}>
            <mesh geometry={half} scale={[0.075, 0.05, 1]}>
              <meshBasicMaterial color={A.mouth} />
            </mesh>
            <mesh geometry={half} position={[0, 0, 0.001]} scale={[0.068, 0.024, 1]}>
              <meshBasicMaterial color={A.teeth} />
            </mesh>
          </group>
        </group>
      </group>

      {/* sombra suave de contacto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#3B2A22" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  )
})
