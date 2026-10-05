import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useProgress } from '@react-three/drei'
import { input, useGame } from '../store'
import { useData } from '../data/usePortfolio'

/* Pantalla de inicio: carga, título y botón para entrar */
export function StartScreen() {
  const started = useGame((s) => s.started)
  const start = useGame((s) => s.start)
  const setClassic = useGame((s) => s.setClassic)
  const person = useData((s) => s.portfolio.person)
  const { progress, active } = useProgress()
  const [ready, setReady] = useState(false)
  const el = useRef()
  const btn = useRef()

  useEffect(() => {
    // listo cuando terminó lo que se estaba cargando (o a los 4 s, por las dudas)
    if (!active && progress >= 100) setReady(true)
    const t = setTimeout(() => setReady(true), 4000)
    return () => clearTimeout(t)
  }, [active, progress])

  useEffect(() => {
    if (ready) btn.current?.focus()
  }, [ready])

  if (started) return null

  const enter = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    input.dist = reduced ? 6.2 : 11
    input.pitch = reduced ? 0.42 : 0.85
    gsap.to(el.current, {
      opacity: 0,
      duration: reduced ? 0.01 : 0.5,
      onComplete: () => {
        start()
        if (!reduced) gsap.to(input, { dist: 6.2, pitch: 0.42, duration: 1.8, ease: 'power3.inOut' })
      },
    })
  }

  return (
    <div ref={el} className="start">
      <div className="start-card">
        <div className="mono" aria-hidden="true">JSF<sup>®</sup></div>
        <p className="eyebrow">{person.coords}</p>
        <h1>La casa de {person.short}</h1>
        <p className="lead">{person.tagline} Pasá, que está abierto.</p>
        <button ref={btn} className="btn btn-primary btn-big" onClick={enter} disabled={!ready}>
          {ready ? 'Entrar ✳' : `Preparando la casa… ${Math.round(progress)}%`}
        </button>
        <button className="btn btn-ghost" onClick={() => setClassic(true)}>Prefiero la versión clásica</button>
        <p className="muted small">WASD o flechas · arrastrá para mirar · E para interactuar</p>
      </div>
    </div>
  )
}
