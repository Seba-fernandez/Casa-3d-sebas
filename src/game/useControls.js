import { useEffect } from 'react'
import { input, useGame } from '../store'

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'])

/* Teclado global + arrastrar para girar la cámara + rueda para acercar */
export function useControls(canvasEl) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const g = useGame.getState()
      if (g.classic) return
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)
      if (typing) return

      if (e.code === 'Escape') {
        if (g.panel) g.closePanel()
        else if (g.dialog) g.closeDialog()
        return
      }
      if (g.panel) return // el panel maneja su propio teclado

      if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') {
        // si el foco está en un botón de la UI, que el botón haga lo suyo
        if (document.activeElement && document.activeElement.tagName === 'BUTTON' && e.code !== 'KeyE') return
        e.preventDefault()
        if (g.dialog) window.dispatchEvent(new CustomEvent('dialog:next'))
        else if (g.started) input.interact = true
        return
      }
      if (e.code === 'KeyM' && g.started) {
        window.dispatchEvent(new CustomEvent('map:toggle'))
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
      if (useGame.getState().panel) return
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
