import { create } from 'zustand'

// Estado global del juego (React). Lo que cambia cada frame NO va acá: va en `input`/`player` (mutables).
export const useGame = create((set, get) => ({
  room: 'hall',
  spawn: 'start',
  started: false, // el visitante pasó la pantalla de inicio
  transitioning: false,
  panel: null, // { type, id } → abre un panel DOM
  prompt: null, // { id, label, verb } → objeto cercano con el que se puede interactuar
  classic: false, // modo clásico 2D
  visited: { hall: true },
  dialog: null, // { who, lines[] } → caja de diálogo estilo juego
  menu: false, // mapa abierto
  setMenu: (menu) => set({ menu }),

  // ── modo dueño ──
  owner: false, // sesión validada con huella / PIN
  scanner: false, // overlay del escáner abierto
  carry: null, // { kind: 'skill'|'category'|'project'|'about', label, payload } → objeto en las manos
  pending: null, // { carry, target } → soltado, esperando Guardar / Descartar
  toast: null, // { text, tone }
  setOwner: (owner) => set({ owner }),
  setScanner: (scanner) => set({ scanner, prompt: null }),
  setCarry: (carry) => set({ carry, panel: null }),
  setPending: (pending) => set({ pending }),
  showToast: (text, tone = 'ok') => {
    set({ toast: { text, tone, at: Date.now() } })
    setTimeout(() => {
      if (Date.now() - (get().toast?.at || 0) >= 2400) set({ toast: null })
    }, 2500)
  },

  say: (lines, who = null) => set({ dialog: { who, lines: [].concat(lines) }, prompt: null }),
  closeDialog: () => set({ dialog: null }),

  setPrompt: (prompt) => {
    const cur = get().prompt
    if (cur?.id === prompt?.id && cur?.label === prompt?.label) return
    set({ prompt })
  },
  openPanel: (panel) => set({ panel, prompt: null }),
  closePanel: () => set({ panel: null }),
  setClassic: (classic) => set({ classic, panel: null }),
  start: () => set({ started: true }),
  goTo: (room, spawn) =>
    set((s) => ({ room, spawn, visited: { ...s.visited, [room]: true }, prompt: null })),
  setTransitioning: (transitioning) => set({ transitioning }),
}))

// Entrada (teclado, joystick táctil, mouse). Mutable a propósito: se lee en useFrame sin re-render.
export const input = {
  keys: new Set(),
  joy: { x: 0, y: 0 }, // -1..1 del joystick táctil
  run: false,
  yaw: Math.PI, // cámara: giro horizontal
  pitch: 0.42, // cámara: inclinación
  dist: 6.2, // cámara: distancia
  interact: false, // pulso de "E"/botón de acción
  locked: false, // true mientras hay panel o transición
}

// Posición del jugador (mutable), la leen la cámara y el sistema de interacción.
export const player = {
  x: 0,
  z: 0,
  yaw: 0,
  speed: 0,
}

// Depuración: abrí la web con ?debug y vas a tener window.__casa en la consola
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')) {
  window.__casa = { input, player, useGame }
}
