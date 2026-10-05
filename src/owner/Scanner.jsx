import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGame, player } from '../store'
import { sendCode, verifyKey, canUsePasskeys } from './api'
import { Fingerprint } from './Fingerprint'
import { travel } from '../ui/transition'

const isPhone = () => /Android|iPhone|iPad/i.test(navigator.userAgent)
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Escáner del baño privado: teclado arcade → huella / PIN → acceso.
 * A cualquier otro le salta la ALERTA y la casa lo empuja lejos de la puerta.
 */
export function Scanner() {
  const open = useGame((s) => s.scanner)
  const setScanner = useGame((s) => s.setScanner)
  const [step, setStep] = useState('code')
  const [code, setCode] = useState('')
  const [auth, setAuth] = useState(null)
  const [msg, setMsg] = useState('')
  const box = useRef()
  const first = useRef()

  useEffect(() => {
    if (!open) return
    setStep('code')
    setCode('')
    setAuth(null)
    setMsg('')
    if (box.current && !reduced()) {
      // "zoom" de cámara hacia el escáner de la pared
      gsap.fromTo(box.current, { scale: 0.18, opacity: 0, rotate: -4 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.55, ease: 'expo.out' })
    }
    requestAnimationFrame(() => first.current?.focus())
  }, [open])

  const close = () => setScanner(false)

  const knockback = () => {
    // la casa te aleja de la puerta del baño
    const wx = -5 + 1.6
    gsap.to(player, { x: wx + 0.6, duration: 0.5, ease: 'back.out(2)' })
  }

  const submit = async () => {
    if (!code) return
    setStep('checking')
    const [r] = await Promise.all([sendCode(code), new Promise((ok) => setTimeout(ok, 900))])
    if (r.error === 'denied' || r.error === 'network') return setStep('alert')
    if (r.error === 'no-device') {
      setMsg('Todavía no registraste ningún dispositivo. Usá el código de alta.')
      return setStep('code')
    }
    if (r.error) {
      setMsg('El servidor no respondió. Probá de nuevo en un rato.')
      return setStep('code')
    }
    if (!canUsePasskeys()) {
      setMsg('Este navegador no soporta huella / PIN.')
      return setStep('code')
    }
    setAuth(r)
    setCode('')
    setStep('finger')
  }

  const scan = async () => {
    setStep('verifying')
    try {
      await Promise.all([verifyKey(auth), new Promise((ok) => setTimeout(ok, 800))])
      setStep('granted')
      setTimeout(() => {
        close()
        travel('bano', 'from:hall')
      }, 1400)
    } catch {
      setStep('failed')
    }
  }

  // teclado físico
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') return close()
      if (step !== 'code') return
      if (/^[0-9]$/.test(e.key)) setCode((c) => (c + e.key).slice(0, 12))
      if (e.key === 'Backspace') setCode((c) => c.slice(0, -1))
      if (e.key === 'Enter') {
        e.preventDefault()
        submit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!open) return null

  if (step === 'alert') {
    return (
      <div className="alert" role="alertdialog" aria-modal="true" aria-labelledby="alert-title">
        <div className="alert-stripes" aria-hidden="true" />
        <div className="alert-card">
          <p className="alert-siren" aria-hidden="true">▲ ▲ ▲</p>
          <h2 id="alert-title">¡ALERTA!</h2>
          <p className="alert-big">INGRESO EXCLUSIVO DEL DUEÑO</p>
          <p>Este baño es privado. Afuera hay proyectos, skills y un michi: eso sí es para vos.</p>
          <button
            ref={first}
            className="btn btn-primary"
            autoFocus
            onClick={() => {
              close()
              knockback()
            }}
          >
            Volver al hall
          </button>
        </div>
      </div>
    )
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'OK']

  return (
    <div className="scanner-scrim" onPointerDown={(e) => e.target === e.currentTarget && close()}>
      <section ref={box} className="crt" role="dialog" aria-modal="true" aria-labelledby="crt-title">
        <button className="crt-close" onClick={close} aria-label="Cerrar escáner">✕</button>
        <p className="crt-top">BAÑO PRIVADO · CERRADURA BIOMETRICA</p>

        {step === 'code' && (
          <>
            <h2 id="crt-title" className="crt-title">INGRESA EL CODIGO</h2>
            <div className="crt-display" aria-live="polite" aria-label={`${code.length} dígitos ingresados`}>
              {code ? '●'.repeat(code.length) : <span className="blink">_</span>}
            </div>
            {msg && <p className="crt-msg">{msg}</p>}
            <div className="keypad">
              {keys.map((k, i) => (
                <button
                  key={k}
                  ref={i === 0 ? first : null}
                  className={k === 'OK' ? 'ok' : k === '←' ? 'back' : ''}
                  aria-label={k === '←' ? 'Borrar' : k === 'OK' ? 'Confirmar' : k}
                  onClick={() => {
                    if (k === 'OK') submit()
                    else if (k === '←') setCode((c) => c.slice(0, -1))
                    else setCode((c) => (c + k).slice(0, 12))
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'checking' && (
          <div className="crt-loading">
            <h2 id="crt-title" className="crt-title">PROCESANDO</h2>
            <div className="bar"><span /></div>
            <p className="crt-msg">Consultando la cerradura…</p>
          </div>
        )}

        {(step === 'finger' || step === 'verifying' || step === 'failed') && (
          <>
            <h2 id="crt-title" className="crt-title">
              {auth?.mode === 'register'
                ? 'REGISTRA ESTE DISPOSITIVO'
                : isPhone()
                  ? 'APOYA TU HUELLA'
                  : 'HUELLA O PIN DE WINDOWS'}
            </h2>
            <button
              ref={first}
              className={'fp-button' + (step === 'verifying' ? ' busy' : '')}
              onClick={scan}
              disabled={step === 'verifying'}
              aria-label="Escanear huella"
            >
              <Fingerprint scanning={step === 'verifying'} state={step === 'failed' ? 'bad' : 'idle'} size={190} />
            </button>
            <p className="crt-msg">
              {step === 'finger' && 'Tocá la huella para escanear'}
              {step === 'verifying' && 'Escaneando… confirmá en la ventana de tu dispositivo'}
              {step === 'failed' && 'No se reconoció. Tocá la huella para reintentar.'}
            </p>
          </>
        )}

        {step === 'granted' && (
          <div className="crt-granted">
            <Fingerprint state="good" size={150} />
            <h2 id="crt-title" className="crt-title">ACCESO CONCEDIDO</h2>
            <p className="crt-msg">Bienvenido, Sebas</p>
          </div>
        )}
      </section>
    </div>
  )
}
