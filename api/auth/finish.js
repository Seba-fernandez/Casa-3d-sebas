// POST /api/auth/finish  { response, device? }
// Verifica la huella / PIN contra el desafío firmado y abre la sesión de dueño (12 h).
import { verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server'
import { db, rp, readChallenge, startSession, noStore } from '../_lib/server.js'

export default async function handler(req, res) {
  noStore(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' })
  const chal = await readChallenge(req)
  if (!chal?.challenge) return res.status(400).json({ error: 'expired' })
  const { rpID, origin } = rp(req)
  const response = req.body?.response
  const supa = db()

  try {
    if (chal.mode === 'register') {
      const v = await verifyRegistrationResponse({
        response,
        expectedChallenge: chal.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      })
      if (!v.verified) return res.status(401).json({ error: 'denied' })
      const c = v.registrationInfo.credential
      const { error } = await supa.from('casa_owner_credentials').insert({
        id: c.id,
        public_key: Buffer.from(c.publicKey).toString('base64url'),
        counter: c.counter,
        transports: c.transports || [],
        device: String(req.body?.device || '').slice(0, 80) || null,
      })
      if (error) throw error
      await startSession(res, req)
      return res.status(200).json({ ok: true, registered: true })
    }

    // login
    const { data: cred, error } = await supa
      .from('casa_owner_credentials')
      .select('*')
      .eq('id', response?.id)
      .maybeSingle()
    if (error) throw error
    if (!cred) return res.status(401).json({ error: 'denied' })

    const v = await verifyAuthenticationResponse({
      response,
      expectedChallenge: chal.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: cred.id,
        publicKey: new Uint8Array(Buffer.from(cred.public_key, 'base64url')),
        counter: Number(cred.counter),
        transports: cred.transports || undefined,
      },
    })
    if (!v.verified) return res.status(401).json({ error: 'denied' })
    await supa
      .from('casa_owner_credentials')
      .update({ counter: v.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
      .eq('id', cred.id)
    await startSession(res, req)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'denied', message: String(err.message || err) })
  }
}
