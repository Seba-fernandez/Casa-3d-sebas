import { RoomShell, Rug } from '../RoomShell'
import { RBox, Cyl, Ball, Label, Spark, useSolid } from '../kit'
import { Spot } from '../Spot'
import { Plant, FloorLamp, Bed, Desk, Laptop, Chair, WallWindow, Frame, Bookshelf, StringLights } from '../props/furniture'
import { ROOM_THEME, C } from '../../theme'
import { useData } from '../../data/usePortfolio'
import { DOOR_COLORS } from './Hall'

const W = 9
const D = 8

/* Corcho con notas de la experiencia (pared, coordenadas locales) */
function Corkboard({ x, y, exp }) {
  const notes = (exp?.bullets || []).slice(0, 4)
  const tones = [C.butter, C.mint, C.blush, C.sky]
  return (
    <group position={[x, y, 0.04]}>
      <RBox size={[1.7, 1.15, 0.05]} color={C.woodLight} radius={0.04} outline shadow={false} />
      <RBox size={[1.58, 1.03, 0.02]} position={[0, 0, 0.03]} color="#C9925B" radius={0.02} shadow={false} />
      <group position={[0, 0.36, 0.05]}>
        <RBox size={[1.2, 0.2, 0.01]} color={C.white} radius={0.02} shadow={false} />
        <Label position={[0, 0, 0.01]} size={0.06} color={C.green} maxWidth={1.15}>{exp?.title || 'Experiencia'}</Label>
      </group>
      {notes.map((n, i) => (
        <group key={i} position={[(i % 2 ? 0.38 : -0.38), i < 2 ? 0.02 : -0.32, 0.05]} rotation={[0, 0, (i % 2 ? -1 : 1) * 0.05]}>
          <RBox size={[0.68, 0.28, 0.01]} color={tones[i]} radius={0.01} shadow={false} />
          <Label position={[0, 0, 0.01]} size={0.028} color={C.ink} maxWidth={0.62}>{n}</Label>
          <Ball r={0.025} position={[0, 0.12, 0.02]} color={C.orange} shadow={false} />
        </group>
      ))}
    </group>
  )
}

/* Mueble bajo con "trofeos" (tus números) y la carpeta del CV */
function TrophyCabinet({ x, z, stats }) {
  useSolid(x, z, 1.9, 0.5)
  return (
    <group position={[x, 0, z]} rotation={[0, Math.PI, 0]}>
      <RBox size={[1.9, 0.75, 0.48]} position={[0, 0.375, 0]} color={C.white} radius={0.05} outline />
      {[-0.47, 0.47].map((dx) => (
        <RBox key={dx} size={[0.86, 0.6, 0.02]} position={[dx, 0.39, 0.245]} color={C.lilac} radius={0.03} shadow={false} />
      ))}
      {stats.slice(0, 3).map((s, i) => {
        const px = (i - 1) * 0.55 - 0.15
        return (
          <group key={i} position={[px, 0.76, 0]}>
            <Cyl r={0.1} h={0.06} position={[0, 0.03, 0]} color={C.woodDark} />
            <Cyl r={0.03} h={0.14} position={[0, 0.13, 0]} color={C.butter} />
            <Cyl r={0.06} rt={0.11} h={0.14} position={[0, 0.26, 0]} color={C.butter} outline />
            <group position={[0, 0.07, 0.11]}>
              <RBox size={[0.5, 0.16, 0.02]} color={C.green} radius={0.02} shadow={false} />
              <Label position={[0, 0, 0.015]} size={0.05} color={C.white} maxWidth={0.48}>{s.value}</Label>
            </group>
          </group>
        )
      })}
      {/* carpeta CV */}
      <group position={[0.72, 0.78, 0]} rotation={[0, -0.3, 0]}>
        <RBox size={[0.34, 0.05, 0.26]} color={C.orange} radius={0.015} outline />
        <RBox size={[0.3, 0.02, 0.22]} position={[0, 0.035, 0]} color={C.white} radius={0.008} />
        <Label position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} size={0.06} color={C.green}>CV</Label>
      </group>
    </group>
  )
}

export function SobreMi() {
  const t = ROOM_THEME.sobremi
  const person = useData((s) => s.portfolio.person)
  const exp = person.experience?.[0]

  return (
    <RoomShell
      id="sobremi"
      w={W}
      d={D}
      theme={t}
      doors={[{ side: 'e', at: 0.4, to: 'hall', label: 'Hall', color: DOOR_COLORS.exit }]}
      n={
        <>
          <WallWindow x={-3.0} y={1.95} w={1.3} h={0.9} />
          <Frame x={1.15} y={1.85} w={1.25} h={0.7} art={C.green}>
            <Label position={[0, 0.12, 0]} size={0.1} color={C.butter}>{person.short}</Label>
            <Label position={[0, -0.08, 0]} size={0.055} color={C.white} maxWidth={1.1}>{person.role}</Label>
          </Frame>
          <StringLights from={-4.2} to={4.2} y={2.75} count={18} />
        </>
      }
      wSide={<Corkboard x={-0.4} y={1.65} exp={exp} />}
      s={
        <group position={[1.6, 1.75, 0.04]}>
          <RBox size={[1.5, 0.9, 0.04]} color={C.orange} radius={0.04} outline shadow={false} />
          <Label position={[0, 0.2, 0.03]} size={0.1} color={C.white} maxWidth={1.35}>Performance, accesibilidad y semántica</Label>
          <Label position={[0, -0.12, 0.03]} size={0.07} color={C.butter} maxWidth={1.3}>no son extras: son el estándar.</Label>
          <Spark size={0.14} color={C.white} position={[0.6, -0.32, 0.03]} />
        </group>
      }
    >
      <Rug w={3.4} d={2.6} color={t.rug} color2={t.rug2} position={[0.2, 0, 0.3]} />
      <Bed position={[-3.2, 0, -2.75]} />
      <Desk position={[1.15, 0, -3.55]} w={1.6}>
        <Laptop position={[-0.2, 0, -0.02]} />
        <group position={[0.35, 0, 0.05]}>
          <Cyl r={0.06} rt={0.05} h={0.12} position={[0, 0.06, 0]} color={C.white} outline />
          <Cyl r={0.05} h={0.01} position={[0, 0.12, 0]} color="#6B3F25" shadow={false} />
        </group>
      </Desk>
      <Chair position={[0.95, 0, -2.8]} color={C.lilac} />
      <Bookshelf position={[3.5, 0, -3.75]} w={1.2} h={1.7} color={C.white} />
      <TrophyCabinet x={1.7} z={D / 2 - 0.35} stats={person.stats || []} />
      <FloorLamp position={[-1.9, 0, -3.5]} color={C.lilac} />
      <Plant position={[-W / 2 + 0.5, 0, D / 2 - 0.5]} size={1.15} />
      <Plant position={[W / 2 - 0.5, 0, D / 2 - 0.5]} kind="cactus" size={1.2} />

      <Spot x={1.15} z={-2.35} r={0.8} label="Escritorio" verb="Conocerme" panel={{ type: 'about' }} marker markerY={2.0} />
      <Spot x={-3.6} z={0.4} r={0.95} label="Corcho · Experiencia" verb="Leer" panel={{ type: 'experience' }} marker markerY={2.45} />
      <Spot x={1.7} z={D / 2 - 1.15} r={0.9} label="CV y números" verb="Abrir" panel={{ type: 'cv' }} marker markerY={1.6} />
      <Spot x={-1.6} z={D / 2 - 0.9} r={0.9} label="Póster" verb="Leer" say={[person.manifesto || person.bio]} />
      <Spot x={-3.2} z={-1.3} r={0.8} label="Cama" verb="Descansar"
        say={['Todavía no es hora de dormir.', 'Hay proyectos para mirar en la puerta de al lado.']} />
    </RoomShell>
  )
}
