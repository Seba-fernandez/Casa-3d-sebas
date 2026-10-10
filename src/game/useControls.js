import { useEffect } from 'react'
import { input, useGame } from '../store'
import { topOverlay, closeTop, actionButton, initBackButton } from '../ui/overlays'

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'])

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
    const onKeyUp = (e) => input.keys.delete(e.code)
    const onBlur = () => input.keys.clear()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useEffect(() => {
    const el = canvasEl?.current
    if (!el) return
    let drag = null
    const down = (e) => {
      if (topOverlay()) return
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY }
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
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
    }
  }, [canvasEl])
}
