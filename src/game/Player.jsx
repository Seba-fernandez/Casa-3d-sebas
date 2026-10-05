import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Avatar } from './Avatar'
import { Carried } from '../owner/Carried'
import { world } from './kit'
import { input, player, useGame } from '../store'
import { travel } from '../ui/transition'

const RADIUS = 0.32
const WALK = 2.7
const RUN = 4.8
const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const v = new THREE.Vector3()
const look = new THREE.Vector3(0, 1.1, 0)

function angleDamp(a, b, lambda, dt) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI
  if (d < -Math.PI) d += Math.PI * 2
  return a + d * (1 - Math.exp(-lambda * dt))
}

/* Empuja el círculo del jugador fuera de cada caja (deslizamiento suave en esquinas) */
function collide(x, z) {
  const { hw, hd } = world.bounds
  for (let pass = 0; pass < 2; pass++) {
    for (const b of world.solids.values()) {
      const cx = THREE.MathUtils.clamp(x, b.x - b.hw, b.x + b.hw)
      const cz = THREE.MathUtils.clamp(z, b.z - b.hd, b.z + b.hd)
      const dx = x - cx
      const dz = z - cz
      const d2 = dx * dx + dz * dz
      if (d2 < RADIUS * RADIUS) {
        if (d2 > 1e-6) {
          const d = Math.sqrt(d2)
          x = cx + (dx / d) * RADIUS
          z = cz + (dz / d) * RADIUS
        } else {
          // centro adentro de la caja: salir por el lado más cercano
          const ox = b.hw - Math.abs(x - b.x)
          const oz = b.hd - Math.abs(z - b.z)
          if (ox < oz) x = b.x + Math.sign(x - b.x || 1) * (b.hw + RADIUS)
          else z = b.z + Math.sign(z - b.z || 1) * (b.hd + RADIUS)
        }
      }
    }
    x = THREE.MathUtils.clamp(x, -hw + RADIUS + 0.05, hw - RADIUS - 0.05)
    z = THREE.MathUtils.clamp(z, -hd + RADIUS + 0.05, hd - RADIUS - 0.05)
  }
  return [x, z]
}

export function Player() {
  const group = useRef()
  const avatar = useRef()
  const vel = useRef({ x: 0, z: 0 })
  const pendingSpawn = useRef(true)
  const room = useGame((s) => s.room)
  const spawn = useGame((s) => s.spawn)
  const carrying = useGame((s) => !!s.carry)
  const camTarget = useRef(new THREE.Vector3())
  const promptTimer = useRef(0)
  const { camera } = useThree()

  useEffect(() => {
    pendingSpawn.current = true
  }, [room, spawn])

  useEffect(() => {
    avatar.current?.setCarry(carrying)
  }, [carrying])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const g = group.current
    const gs = useGame.getState()
    input.locked = gs.transitioning || !!gs.panel || !!gs.dialog || gs.menu || gs.scanner || !gs.started

    // ── aparición al entrar a una habitación ──
    if (pendingSpawn.current) {
      const sp = world.spawns.get(spawn) || world.spawns.get('start') || { x: 0, z: 0, yaw: 0 }
      player.x = sp.x
      player.z = sp.z
      player.yaw = sp.yaw
      vel.current.x = vel.current.z = 0
      // cámara detrás del jugador, mirando hacia adentro
      input.yaw = Math.atan2(-Math.sin(sp.yaw), -Math.cos(sp.yaw))
      camTarget.current.set(player.x, 0, player.z)
      pendingSpawn.current = !world.spawns.size // reintenta si la habitación aún no registró nada
    }

    // ── dirección deseada relativa a la cámara ──
    let ix = 0
    let iz = 0
    if (!input.locked) {
      const k = input.keys
      if (k.has('KeyW') || k.has('ArrowUp')) iz += 1
      if (k.has('KeyS') || k.has('ArrowDown')) iz -= 1
      if (k.has('KeyA') || k.has('ArrowLeft')) ix -= 1
      if (k.has('KeyD') || k.has('ArrowRight')) ix += 1
      ix += input.joy.x
      iz += input.joy.y
    }
    const mag = Math.min(1, Math.hypot(ix, iz))
    const fwdX = -Math.sin(input.yaw)
    const fwdZ = -Math.cos(input.yaw)
    // derecha de la cámara = (-fwdZ, fwdX)
    let dx = fwdX * iz - fwdZ * ix
    let dz = fwdZ * iz + fwdX * ix
    const dl = Math.hypot(dx, dz) || 1
    dx /= dl
    dz /= dl

    const running = input.run || input.keys.has('ShiftLeft') || input.keys.has('ShiftRight') || Math.hypot(input.joy.x, input.joy.y) > 0.92
    const top = (running ? RUN : WALK) * mag
    const accel = mag > 0.01 ? 10 : 12
    vel.current.x = THREE.MathUtils.damp(vel.current.x, dx * top, accel, dt)
    vel.current.z = THREE.MathUtils.damp(vel.current.z, dz * top, accel, dt)

    const [nx, nz] = collide(player.x + vel.current.x * dt, player.z + vel.current.z * dt)
    const realSpeed = Math.hypot(nx - player.x, nz - player.z) / dt
    player.x = nx
    player.z = nz
    player.speed = realSpeed
    if (mag > 0.05) player.yaw = angleDamp(player.yaw, Math.atan2(dx, dz), 14, dt)

    g.position.set(player.x, 0, player.z)
    g.rotation.y = player.yaw
    avatar.current?.setSpeed(realSpeed)

    // ── puertas: si caminás hacia una, pasás (como en los juegos de Pokémon) ──
    if (!input.locked) {
      for (const it of world.items.values()) {
        if (!it.door) continue
        const d = Math.hypot(player.x - it.x, player.z - it.z)
        const pushing = vel.current.x * -it.door.nx + vel.current.z * -it.door.nz > 0.6
        if (d < it.r * 0.8 && pushing) {
          travel(it.door.to, `from:${useGame.getState().room}`)
          break
        }
      }
    }

    // ── objeto interactivo más cercano (cada ~0,1 s) ──
    promptTimer.current -= dt
    if (promptTimer.current <= 0) {
      promptTimer.current = 0.1
      let best = null
      let bestD = Infinity
      const fx = Math.sin(player.yaw)
      const fz = Math.cos(player.yaw)
      for (const it of world.items.values()) {
        const ox = it.x - player.x
        const oz = it.z - player.z
        const d = Math.hypot(ox, oz)
        if (d > it.r + 0.6) continue
        const facing = (ox * fx + oz * fz) / (d || 1)
        const score = d - facing * 0.4
        if (facing > -0.35 && score < bestD) {
          best = it
          bestD = score
        }
      }
      useGame.getState().setPrompt(
        best && !input.locked ? { id: best.id, label: best.label, verb: best.verb } : null
      )
    }

    if (input.interact) {
      input.interact = false
      const p = useGame.getState().prompt
      const it = p && world.items.get(p.id)
      if (it && !input.locked) {
        if (it.door) travel(it.door.to, `from:${useGame.getState().room}`)
        else {
          avatar.current?.wave()
          it.onUse?.()
        }
      }
    }

    // ── cámara en tercera persona ──
    const follow = reduced ? 30 : 7
    camTarget.current.x = THREE.MathUtils.damp(camTarget.current.x, player.x, follow, dt)
    camTarget.current.z = THREE.MathUtils.damp(camTarget.current.z, player.z, follow, dt)
    // en pantallas verticales (celu) la cámara se aleja y abre el ángulo para ver la habitación
    const portrait = camera.aspect < 0.85
    const fov = portrait ? 60 : 48
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    const dist = input.dist * (portrait ? 1.3 : 1)
    const cp = Math.cos(input.pitch)
    v.set(
      camTarget.current.x + Math.sin(input.yaw) * dist * cp,
      1.15 + Math.sin(input.pitch) * dist,
      camTarget.current.z + Math.cos(input.yaw) * dist * cp
    )
    if (pendingSpawn.current === false && camera.userData.snapped !== room + spawn) {
      camera.position.copy(v) // corte limpio al entrar a una habitación
      camera.userData.snapped = room + spawn
    } else {
      const lam = reduced ? 40 : 10
      camera.position.x = THREE.MathUtils.damp(camera.position.x, v.x, lam, dt)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, v.y, lam, dt)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, v.z, lam, dt)
    }
    // mira un poco por delante del personaje: se ve más habitación y menos piso
    const ahead = portrait ? 1.3 : 0.5
    look.set(camTarget.current.x - Math.sin(input.yaw) * ahead, 1.05, camTarget.current.z - Math.cos(input.yaw) * ahead)
    camera.lookAt(look)
  })

  return (
    <group ref={group}>
      <Avatar ref={avatar} />
      <Carried />
    </group>
  )
}
