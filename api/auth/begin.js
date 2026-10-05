// POST /api/auth/begin  { code }
// Código de dueño  → pide la passkey (huella / PIN de Windows)
// Código de alta   → registra este dispositivo como llave del dueño
// Cualquier otro   → 401 (la casa muestra la ALERTA)
import { generateAuthenticationOptions, generateRegistrationOptions } from '@simplewebauthn/server'
import { db, rp, setChallenge, sameCode, noStore, sleep } from '../_lib/server.js'

export default async function handler(req, res) {
  noStore(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const code = String(req.body?.code || '').trim()
  const { rpID, rpName } = rp(req)

  const isSetup = sameCode(code, process.env.OWNER_SETUP_CODE)
  const isOwnerCode = sameCode(code, process.env.OWNER_CODE)
  if (!isSetup && !isOwnerCode) {
    await sleep(700) // frena a quien prueba códigos al azar
    return res.status(401).json({ error: 'denied' })
  }

  try {
    const { data: creds, error } = await db().from('casa_owner_credentials').select('id, transports')
    if (error) throw error

    if (isSetup) {
      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userName: 'sebas',
        userDisplayName: 'Sebas (dueño)',
        userID: new TextEncoder().encode('casa-owner'),
        attestationType: 'none',
        excludeCredentials: creds.map((c) => ({ id: c.id, transports: c.transports || undefined })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'required',
          authenticatorAttachment: 'platform', // huella del celu, Windows Hello en la PC
        },
      })
      await setChallenge(res, req, { challenge: options.challenge, mode: 'register' })
      return res.status(200).json({ mode: 'register', options })
    }

    {
      if (!creds.length) return res.status(409).json({ error: 'no-device' })
      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: 'required',
        allowCredentials: creds.map((c) => ({ id: c.id, transports: c.transports || undefined })),
      })
      await setChallenge(res, req, { challenge: options.challenge, mode: 'login' })
      return res.status(200).json({ mode: 'login', options })
    }
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'server', message: String(err.message || err) })
  }
}
