import { useEffect } from 'react'
import { input, useGame } from '../store'
import { topOverlay, closeTop, actionButton, initBackButton } from '../ui/overlays'

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'])
const MODIFIERS = new Set(['Meta', 'Control', 'Alt', 'OS'])
const TAP_MOVE = 6 // px: menos que esto es un toque/clic, no un arrastre de cámara
const TAP_MS = 400

/*
 * Frena al personaje: suelta teclas y joystick. Si la tecla sigue apretada de verdad,
 * la auto-repetición del teclado la vuelve a cargar al instante, así que no molesta.
 */
export function stopWalking(all = false) {
  input.keys.clear()
  if (all || !input.joyActive) {
    input.joy.x = 0
    input.joy.y = 0
  }
}

/* Teclado global + arrastrar para girar la cámara + rueda para acercar */
export function useControls(canvasEl) {
  useEffect(() => {
    initBackButton()
    const onKeyDown = (e) => {
      const g = useGame.getState()
      if (g.classic) return
      const el = document.activeElement
      const typing = /INPUT|TEXTAREA|SELECT/.test(el?.tagName) || el?.isContentEditable
      const top = topOverlay(g)

      // Esc siempre cierra el cartel de arriba (aunque estés escribiendo en un formulario)
      if (e.code === 'Escape') {
        if (top) {
          e.preventDefault()
          closeTop()
        }
        return
      }
      // el escáner maneja sus números, Enter y Retroceso; acá solo la E para salir
      if (top === 'scanner') {
        if (e.code === 'KeyE') {
          e.preventDefault()
          closeTop()
        }
        return
      }
      if (typing) return

      if (top) {
        // Retroceso = "volver": cierra el cartel de arriba
        if (e.code === 'Backspace') {
          e.preventDefault()
          closeTop()
          return
        }
        // E: en un diálogo avanza el texto; en un cartel lo cierra
        if (e.code === 'KeyE') {
          e.preventDefault()
          actionButton()
          return
        }
        // Enter/Espacio: si el foco está en un botón o link del cartel, que haga lo suyo
        if (e.code === 'Enter' || e.code === 'Space') {
          if (top === 'dialog') {
            e.preventDefault()
            actionButton()
          }
          return
        }
        if (e.code === 'KeyM' && top === 'menu') {
          e.preventDefault()
          closeTop()
        }
        return
      }

      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
        if (el && (el.tagName === 'BUTTON' || el.tagName === 'A') && e.code !== 'KeyE') return
        e.preventDefault()
        actionButton()
        return
      }
      if (e.code === 'KeyM' && g.started) {
        e.preventDefault()
        g.setMenu(true)
        return
      }
      if (MOVE_KEYS.has(e.code)) {
        if (e.code.startsWith('Arrow')) e.preventDefault()
        input.keys.add(e.code)
      }
    }
    const onKeyUp = (e) => {
      // Con Cmd/Ctrl/Alt apretado el navegador a veces se "come" el keyup de la otra tecla
      // (Cmd+W, Alt+Tab, atajos del sistema): al soltar el modificador soltamos todo.
      if (MODIFIERS.has(e.key)) input.keys.clear()
      else input.keys.delete(e.code)
    }
    const release = () => stopWalking(true)
    const onVisibility = () => document.hidden && release()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', release)
    window.addEventListener('contextmenu', release) // el menú del clic derecho también se traga el keyup
    window.addEventListener('dragstart', release) // y el arrastre nativo del navegador
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', release)
      window.removeEventListener('contextmenu', release)
      window.removeEventListener('dragstart', release)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    const el = canvasEl?.current
    if (!el) return
    let drag = null
    const down = (e) => {
      if (topOverlay()) return
      if (e.button > 0) return // solo clic izquierdo / dedo
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now() }
      el.setPointerCapture?.(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const move = (e) => {
      if (!drag || drag.id !== e.pointerId) return
      const sens = e.pointerType === 'touch' ? 0.007 : 0.0045
      input.yaw -= (e.clientX - drag.x) * sens
      input.pitch = Math.min(1.15, Math.max(0.12, input.pitch + (e.clientY - drag.y) * sens * 0.8))
      drag.x = e.clientX
      drag.y = e.clientY
    }
    const up = (e) => {
      if (drag?.id !== e.pointerId) return
      // un toque/clic corto sobre la escena (sin arrastrar) = "pará": si algo quedó trabado, se frena
      const tap = e.type === 'pointerup' && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < TAP_MOVE && performance.now() - drag.t0 < TAP_MS
      drag = null
      el.style.cursor = 'grab'
      if (tap) stopWalking()
    }
    const lost = (e) => {
      if (drag?.id === e.pointerId) drag = null
      el.style.cursor = 'grab'
    }
    const wheel = (e) => {
      e.preventDefault()
      input.dist = Math.min(9.5, Math.max(3.2, input.dist + e.deltaY * 0.004))
    }
    el.style.cursor = 'grab'
    el.style.touchAction = 'none'
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('lostpointercapture', lost)
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('lostpointercapture', lost)
      el.removeEventListener('wheel', wheel)
    }
  }, [canvasEl])
}
