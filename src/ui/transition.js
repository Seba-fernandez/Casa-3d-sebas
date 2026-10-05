import gsap from 'gsap'
import { input, useGame } from '../store'

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* Fundido tipo consola al cruzar una puerta: sale a crema, cambia la habitación, vuelve. */
export function travel(to, spawn) {
  const g = useGame.getState()
  if (g.transitioning || to === g.room) return
  const el = document.getElementById('fade')
  g.setTransitioning(true)
  input.keys.clear()
  const dur = reduced() ? 0.12 : 0.34

  gsap.to(el, {
    opacity: 1,
    duration: dur,
    ease: 'power2.in',
    onComplete: () => {
      useGame.getState().goTo(to, spawn)
      // dos frames para que la nueva habitación registre sus puertas y spawns
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          gsap.to(el, {
            opacity: 0,
            duration: dur * 1.3,
            delay: 0.08,
            ease: 'power2.out',
            onComplete: () => {
              useGame.getState().setTransitioning(false)
            },
          })
        })
      )
    },
  })
}
