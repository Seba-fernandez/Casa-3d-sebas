import { lazy, Suspense, useEffect, useState } from 'react'
import { useGame } from './store'
import { useLoadData } from './data/usePortfolio'
import { HUD } from './ui/HUD'
import { PanelHost } from './ui/Panels'
import { StartScreen } from './ui/StartScreen'
import { Classic } from './ui/Classic'
import { Scanner } from './owner/Scanner'
import { checkOwner } from './owner/api'

// El 3D se carga aparte: la versión clásica aparece al instante aunque three.js todavía baje.
const Game = lazy(() => import('./game/Game'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  useLoadData()
  const classic = useGame((s) => s.classic)
  const [canPlay] = useState(hasWebGL)
  useEffect(() => {
    checkOwner() // si ya validaste tu huella hace poco, entrás directo como dueño
  }, [])

  if (!canPlay || classic) return <Classic canPlay={canPlay} />

  return (
    <>
      <a className="skip" href="#" onClick={(e) => { e.preventDefault(); useGame.getState().setClassic(true) }}>
        Saltar a la versión clásica (accesible, sin 3D)
      </a>
      <Suspense fallback={<div className="start"><div className="start-card"><p>Cargando la casa…</p></div></div>}>
        <Game />
      </Suspense>
      <HUD />
      <PanelHost />
      <Scanner />
      <StartScreen />
      <div id="fade" aria-hidden="true" />
    </>
  )
}
