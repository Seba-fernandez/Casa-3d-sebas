import { Suspense, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload, PerformanceMonitor } from '@react-three/drei'
import { Player } from './Player'
import { Hall } from './rooms/Hall'
import { Proyectos } from './rooms/Proyectos'
import { Skills } from './rooms/Skills'
import { SobreMi } from './rooms/SobreMi'
import { Bano } from './rooms/Bano'
import { useControls } from './useControls'
import { useGame } from '../store'

const ROOMS = { hall: Hall, proyectos: Proyectos, skills: Skills, sobremi: SobreMi, bano: Bano }

function CurrentRoom() {
  const room = useGame((s) => s.room)
  const Room = ROOMS[room] || Hall
  return <Room key={room} />
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#FFF4E2', '#C98E6A', 1.55]} />
      <ambientLight intensity={0.25} />
      {/* luz casi cenital: las sombras quedan pegadas a cada cosa en vez de estirarse lejos */}
      <directionalLight
        position={[1.6, 10, 2.4]}
        intensity={1.9}
        color="#FFE6C7"
        castShadow
        shadow-mapSize={[1536, 1536]}
        shadow-bias={-0.0004}
        shadow-radius={2.5}
        shadow-normalBias={0.03}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={1}
        shadow-camera-far={25}
      />
    </>
  )
}

export default function Game({ paused }) {
  const wrap = useRef()
  // con un cartel tapando la pantalla la escena no se mueve: dejamos de dibujar para ahorrar batería y CPU
  const covered = useGame((s) => s.scanner || !!s.panel || s.menu)
  const [dpr, setDpr] = useState(() => Math.min(1.75, window.devicePixelRatio || 1))
  useControls(wrap)
  return (
    <div ref={wrap} className="canvas-wrap" aria-hidden="true">
      <Canvas
        shadows="percentage"
        flat
        dpr={dpr}
        frameloop={paused ? 'never' : covered ? 'demand' : 'always'}
        camera={{ fov: 48, near: 0.1, far: 80, position: [0, 6, 10] }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {/* baja la resolución si el dispositivo no llega a ~50 fps, la sube si sobra */}
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(Math.min(1.75, window.devicePixelRatio))} />
        <Lights />
        <Suspense fallback={null}>
          <CurrentRoom />
          <Player />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}
