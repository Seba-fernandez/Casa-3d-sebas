import { input, useGame } from '../store'

/*
 * Pila de carteles. Cualquier forma de "volver" (Esc, Retroceso, el botón atrás del
 * navegador o del celu, la E o el botón A) cierra SOLO el cartel de arriba.
 * Orden de arriba hacia abajo: escáner → panel → mapa → diálogo.
 */
export function topOverlay(s = useGame.getState()) {
  if (s.scanner) return 'scanner'
  if (s.panel) return 'panel'
  if (s.menu) return 'menu'
  if (s.dialog) return 'dialog'
  return null
}

export function closeTop() {
  const g = useGame.getState()
  switch (topOverlay(g)) {
    case 'scanner':
      g.setScanner(false)
      return true
    case 'panel':
      g.closePanel()
      return true
    case 'menu':
      g.setMenu(false)
      return true
    case 'dialog':
      g.closeDialog()
      return true
    default:
      return false
  }
}

/* Botón de acción (E / A): si hay un diálogo lo avanza, si hay un cartel lo cierra, si no interactúa */
export function actionButton() {
  const top = topOverlay()
  if (top === 'dialog') window.dispatchEvent(new CustomEvent('dialog:next'))
  else if (top) closeTop()
  else if (useGame.getState().started) input.interact = true
}

const depth = (s) => (s.scanner ? 1 : 0) + (s.panel ? 1 : 0) + (s.menu ? 1 : 0) + (s.dialog ? 1 : 0)

let ready = false
let armed = false // hay una entrada nuestra en el historial mientras haya algún cartel abierto
let skip = 0 // popstate que provocamos nosotros al cerrar sin "atrás"
let fromPop = false

function arm() {
  history.pushState({ casaOverlay: true }, '')
  armed = true
}

/* Conecta el botón "atrás" del navegador/celu: atrás cierra el cartel de arriba en vez de salir del sitio */
export function initBackButton() {
  if (ready || typeof window === 'undefined') return
  ready = true

  useGame.subscribe((s, prev) => {
    const d = depth(s)
    if (d > depth(prev)) input.keys.clear()
    if (fromPop) return // el manejador de "atrás" decide si vuelve a poner el marcador
    if (d > 0 && !armed) arm()
    else if (d === 0 && armed) {
      // se cerró todo con X, Esc, E o A: sacamos nuestra entrada para que "atrás" siga funcionando normal
      armed = false
      skip++
      history.back()
    }
  })

  window.addEventListener('popstate', () => {
    if (skip > 0) {
      skip--
      if (depth(useGame.getState()) > 0 && !armed) arm() // se abrió otro cartel mientras volvíamos
      return
    }
    if (!armed) return
    armed = false
    fromPop = true
    closeTop()
    fromPop = false
    if (depth(useGame.getState()) > 0) arm() // quedan carteles abajo: el próximo "atrás" cierra el siguiente
  })
}
