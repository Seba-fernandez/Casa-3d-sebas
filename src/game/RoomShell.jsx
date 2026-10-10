import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoomCtx, Toon, RBox, wallPoint, NoCast } from './kit'
import { world } from './kit'
import { C } from '../theme'
import { Door, DoorMat } from './props/Door'

/* Piso de tablas de madera dibujado en canvas (una sola textura, cero modelos) */
function usePlankTexture(w, d) {
  return useMemo(() => {
    const px = 64 // píxeles por metro
    const cw = Math.min(2048, Math.ceil(w * px))
    const ch = Math.min(2048, Math.ceil(d * px))
    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const g = cv.getContext('2d')
    const plank = 0.32 * px
    const tones = [C.floorA, C.floorB, '#D4A06C', '#C99360']
    let row = 0
    for (let y = 0; y < ch; y += plank, row++) {
      let x = -((row * 97) % 180)
      while (x < cw) {
        const len = (1.4 + ((x * 13 + row * 7) % 5) * 0.25) * px
        g.fillStyle = tones[(row + Math.floor(x / 50)) % tones.length]
        g.fillRect(x, y, len, plank)
        g.fillStyle = 'rgba(80,45,25,0.22)'
        g.fillRect(x, y, 2, plank) // junta
        x += len
      }
      g.fillStyle = 'rgba(80,45,25,0.25)'
      g.fillRect(0, y + plank - 2, cw, 2)
    }
    const tex = new THREE.CanvasTexture(cv)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [w, d])
}

/* Pared que "se hunde" cuando la cámara queda del lado de afuera (corte tipo casa de muñecas) */
function Wall({ side, w, d, h, theme, children }) {
  const g = useRef()
  const p = wallPoint(side, 0, w, d)
  const len = side === 'n' || side === 's' ? w : d
  const target = useRef(0)

  useFrame(({ camera }, dt) => {
    // ¿La cámara está del lado exterior de esta pared?
    const out = side === 'n' ? camera.position.z < -d / 2 + 0.4
      : side === 's' ? camera.position.z > d / 2 - 0.4
      : side === 'w' ? camera.position.x < -w / 2 + 0.4
      : camera.position.x > w / 2 - 0.4
    target.current = out ? -h - 0.2 : 0
    const y = g.current.position.y
    g.current.position.y = THREE.MathUtils.damp(y, target.current, 9, dt)
    g.current.visible = g.current.position.y > -h - 0.1
  })

  return (
    <group position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
      {/* zócalo bajo: siempre visible, marca el contorno de la habitación */}
      <mesh position={[0, 0.14, -0.1]} receiveShadow>
        <boxGeometry args={[len + 0.4, 0.28, 0.2]} />
        <Toon color={theme.trim} />
      </mesh>
      <group ref={g}>
        <mesh position={[0, h / 2, -0.12]} receiveShadow>
          <boxGeometry args={[len + 0.4, h, 0.2]} />
          <Toon color={theme.wall} />
        </mesh>
        {/* friso superior y franja media */}
        <mesh position={[0, h - 0.06, -0.01]}>
          <boxGeometry args={[len, 0.12, 0.06]} />
          <Toon color={theme.trim} />
        </mesh>
        <mesh position={[0, 0.95, -0.015]}>
          <boxGeometry args={[len, 0.05, 0.04]} />
          <Toon color={theme.trim} />
        </mesh>
        <mesh position={[0, 0.47, -0.02]}>
          <boxGeometry args={[len, 0.92, 0.02]} />
          <Toon color={'#' + new THREE.Color(theme.wall).lerp(new THREE.Color(theme.trim), 0.4).getHexString()} />
        </mesh>
        <NoCast>{children}</NoCast>
      </group>
    </group>
  )
}

/**
 * Cáscara de una habitación: piso, 4 paredes con corte automático y "slots" de decoración por pared.
 * Las decoraciones de pared se dan en coordenadas locales: x a lo largo de la pared, y altura, z hacia adentro.
 */
export function RoomShell({ id, w, d, h = 3, theme, n, s, e, wSide, doors = [], children }) {
  const tex = usePlankTexture(w, d)
  world.bounds = { hw: w / 2, hd: d / 2 }
  const ctx = useMemo(() => ({ w, d, h, id }), [w, d, h, id])

  return (
    <RoomCtx.Provider value={ctx}>
      <color attach="background" args={[theme.bg]} />
      {/* piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshToonMaterial map={tex} />
      </mesh>
      {/* base del piso (grosor visible al cortar las paredes) */}
      <RBox size={[w + 0.6, 0.3, d + 0.6]} radius={0.12} position={[0, -0.16, 0]} color={C.woodDark} shadow={false} />

      {[['n', n], ['s', s], ['e', e], ['w', wSide]].map(([side, deco]) => (
        <Wall key={side} side={side} w={w} d={d} h={h} theme={theme}>
          {deco}
          {doors.filter((dr) => dr.side === side).map((dr) => <Door key={dr.to} {...dr} />)}
        </Wall>
      ))}
      {doors.map((dr) => <DoorMat key={dr.to} side={dr.side} at={dr.at} color={dr.color} />)}

      {children}
    </RoomCtx.Provider>
  )
}

/* Alfombra redondeada */
export function Rug({ w = 3, d = 2, color, color2, ...props }) {
  return (
    <group {...props}>
      <RBox size={[w, 0.03, d]} radius={0.012} position={[0, 0.015, 0]} color={color} shadow={false} />
      <RBox size={[w - 0.35, 0.034, d - 0.35]} radius={0.012} position={[0, 0.02, 0]} color={color2} shadow={false} />
      <RBox size={[w - 0.6, 0.038, d - 0.6]} radius={0.012} position={[0, 0.024, 0]} color={color} shadow={false} />
    </group>
  )
}
