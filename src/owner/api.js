import { startAuthentication, startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { useGame } from '../store'
import { PREVIEW } from '../data/usePortfolio'

async function post(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body || {}),
  })
  const j = await r.json().catch(() => ({}))
  return { status: r.status, ...j }
}

export const canUsePasskeys = () => !PREVIEW && browserSupportsWebAuthn()

/* Paso 1: el código del teclado. Devuelve { mode: 'login'|'register', options } o { error } */
export async function sendCode(code) {
  if (PREVIEW) return { error: 'denied' }
  try {
    return await post('/api/auth/begin', { code })
  } catch {
    return { error: 'network' }
  }
}

/* Paso 2: huella / PIN. Lo dispara el toque del visitante sobre la huella (gesto requerido por Safari). */
export async function verifyKey(step) {
  const device = /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Celular' : 'Computadora'
  const response =
    step.mode === 'register'
      ? await startRegistration({ optionsJSON: step.options })
      : await startAuthentication({ optionsJSON: step.options })
  const r = await post('/api/auth/finish', { response, device })
  if (!r.ok) throw new Error(r.message || 'denied')
  useGame.getState().setOwner(true)
  return r
}

export async function checkOwner() {
  if (PREVIEW) return false
  try {
    const r = await fetch('/api/auth/me', { credentials: 'same-origin' })
    const j = await r.json()
    useGame.getState().setOwner(!!j.owner)
    return !!j.owner
  } catch {
    return false
  }
}

export async function logout() {
  await post('/api/auth/me?logout')
  useGame.getState().setOwner(false)
  useGame.getState().setCarry(null)
}
