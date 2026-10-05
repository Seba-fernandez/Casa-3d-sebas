import { useItem } from './kit'
import { Bubble } from './props/objects'
import { useGame } from '../store'

/**
 * Punto interactivo invisible. `panel` abre un panel DOM, `say` abre un diálogo.
 * `marker` muestra el indicador flotante encima.
 */
export function Spot({ x, z, r = 0.9, label, verb = 'Mirar', panel, say, who, onUse, marker = false, markerY = 2 }) {
  useItem({
    x,
    z,
    r,
    label,
    verb,
    onUse: () => {
      if (onUse) onUse()
      else if (panel) useGame.getState().openPanel(panel)
      else if (say) useGame.getState().say(say, who)
    },
  })
  return marker ? <Bubble position={[x, markerY, z]} /> : null
}
