import { useMemo } from 'react'

/* Huella dactilar generada (crestas elípticas con cortes), estilo pantalla arcade */
export function Fingerprint({ size = 220, scanning = false, state = 'idle' }) {
  const paths = useMemo(() => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const out = []
    const cx = 100
    const cy = 112
    for (let i = 0; i < 13; i++) {
      const rx = 6 + i * 6.2
      const ry = rx * 1.3
      // cada cresta se corta en 1-2 lugares para que parezca huella y no diana
      const gapAt = rnd() * Math.PI * 2
      const gapLen = 0.25 + rnd() * 0.5
      const start = -Math.PI * 1.05 + (i > 9 ? 0.35 : 0)
      const end = Math.PI * 0.05 - (i > 9 ? 0.35 : 0)
      const segs = []
      let cur = []
      for (let a = start; a <= end; a += 0.06) {
        const inGap = Math.abs(((a - gapAt + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < gapLen / 2
        if (inGap) {
          if (cur.length > 1) segs.push(cur)
          cur = []
          continue
        }
        const wob = Math.sin(a * 3 + i) * 1.2
        cur.push([cx + Math.cos(a) * (rx + wob), cy + Math.sin(a) * (ry + wob)])
      }
      if (cur.length > 1) segs.push(cur)
      // parte de abajo de la huella: líneas casi horizontales
      segs.forEach((pts) => out.push('M' + pts.map((p) => p.map((n) => n.toFixed(1)).join(' ')).join(' L')))
    }
    for (let j = 0; j < 6; j++) {
      const y = 120 + j * 9
      const w = 70 - j * 6
      out.push(`M${100 - w} ${y} Q100 ${y + 6 + j} ${100 + w} ${y}`)
    }
    return out
  }, [])

  return (
    <svg className={'fp fp-' + state + (scanning ? ' fp-scan' : '')} viewBox="0 0 200 220" width={size} height={size * 1.1} aria-hidden="true">
      <defs>
        <clipPath id="fp-clip">
          <ellipse cx="100" cy="110" rx="86" ry="104" />
        </clipPath>
        <linearGradient id="fp-beam" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath="url(#fp-clip)" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        {paths.map((d, i) => (
          <path key={i} d={d} className="ridge" style={{ animationDelay: `${i * 40}ms` }} />
        ))}
        {scanning && <rect className="beam" x="0" y="-40" width="200" height="40" fill="url(#fp-beam)" stroke="none" />}
      </g>
    </svg>
  )
}
