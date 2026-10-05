import { RoomShell, Rug } from '../RoomShell'
import { RBox, Label, Spark, useSolid } from '../kit'
import { useGame } from '../../store'
import { Spot } from '../Spot'
import {
  Sofa, CoffeeTable, Plant, FloorLamp, Bookshelf, WallWindow, Frame, Clock,
  StringLights, Mailbox, Cat, Monogram,
} from '../props/furniture'
import { ROOM_THEME, C } from '../../theme'
import { useData } from '../../data/usePortfolio'

export const DOOR_COLORS = { proyectos: '#5FA777', skills: '#F2A93B', sobremi: '#A98BD6', exit: C.orange }

/* Pizarrón de bienvenida con tu nombre */
function WelcomeBoard({ position, ry = 0 }) {
  const person = useData((s) => s.portfolio.person)
  useSolid(position[0], position[2] - 0.15, 1.0, 0.6)
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <RBox size={[0.06, 1.5, 0.06]} position={[-0.42, 0.75, -0.12]} rotation={[0.12, 0, 0.08]} color={C.woodDark} />
      <RBox size={[0.06, 1.5, 0.06]} position={[0.42, 0.75, -0.12]} rotation={[0.12, 0, -0.08]} color={C.woodDark} />
      <RBox size={[0.06, 1.3, 0.06]} position={[0, 0.65, -0.42]} rotation={[-0.35, 0, 0]} color={C.woodDark} />
      <group position={[0, 1.15, 0]} rotation={[-0.12, 0, 0]}>
        <RBox size={[1.15, 0.85, 0.06]} color={C.woodLight} radius={0.04} outline />
        <RBox size={[1.0, 0.7, 0.02]} position={[0, 0, 0.035]} color={C.green} radius={0.02} shadow={false} />
        <Label position={[0, 0.2, 0.05]} size={0.11} color={C.butter}>¡Hola! Soy {person.short}</Label>
        <Label position={[0, 0.03, 0.05]} size={0.065} color={C.white} maxWidth={0.9}>{person.role}</Label>
        <Label position={[0, -0.12, 0.05]} size={0.052} color={C.mint} maxWidth={0.9}>WASD para caminar · E para interactuar</Label>
        <Spark size={0.1} color={C.orange} position={[0.38, 0.24, 0.05]} />
      </group>
    </group>
  )
}

export function Hall() {
  const t = ROOM_THEME.hall
  const W = 10
  const D = 8
  const person = useData((s) => s.portfolio.person)

  return (
    <RoomShell
      id="hall"
      w={W}
      d={D}
      theme={t}
      doors={[
        { side: 'n', at: -2.4, to: 'proyectos', label: 'Proyectos', color: DOOR_COLORS.proyectos },
        { side: 'n', at: 2.4, to: 'skills', label: 'Skills', color: DOOR_COLORS.skills },
        { side: 'w', at: 0.4, to: 'sobremi', label: 'Sobre mí', color: DOOR_COLORS.sobremi },
        {
          side: 's',
          at: 0,
          to: 'exit',
          label: 'Salida',
          color: DOOR_COLORS.exit,
          onUse: () => useGame.getState().openPanel({ type: 'exit' }),
        },
      ]}
      n={
        <>
          <Monogram x={0} y={1.75} r={0.5} />
          <StringLights from={-4.6} to={4.6} y={2.72} count={22} />
          <Frame x={-4.1} y={1.6} w={0.5} h={0.65} art={C.peach}>
            <Spark size={0.22} color={C.orange} />
          </Frame>
        </>
      }
      e={
        <>
          <WallWindow x={1.4} y={1.65} w={1.7} h={1.2} />
          <Clock x={-1.6} y={2.25} />
        </>
      }
      s={
        <>
          <group position={[2.4, 1.7, 0.04]}>
            <RBox size={[1.5, 0.5, 0.05]} color={C.green} radius={0.06} outline shadow={false} />
            <Label position={[0, 0.07, 0.04]} size={0.12} color={C.butter}>{person.coords}</Label>
            <Label position={[0, -0.1, 0.04]} size={0.07} color={C.white}>Hecho en Córdoba</Label>
          </group>
          <Frame x={-2.4} y={1.7} w={0.7} h={0.5} art={C.sky}>
            <Label size={0.09} color={C.green}>{person.location}</Label>
          </Frame>
        </>
      }
      wSide={
        <>
          <Frame x={-2.2} y={1.65} w={0.55} h={0.7} art={C.butter}>
            <Label size={0.09} color={C.green} maxWidth={0.5}>UX · Perf · A11y</Label>
          </Frame>
          <Frame x={2.6} y={1.7} w={0.6} h={0.45} art={C.mint}>
            <Label size={0.08} color={C.green}>{'</>'}</Label>
          </Frame>
        </>
      }
    >
      <Rug w={4.4} d={3.2} color={t.rug} color2={t.rug2} position={[0, 0, -2.0]} />
      <Rug w={1.6} d={2.4} color={C.sage} color2={C.mint} position={[0, 0, 2.2]} />
      <Sofa position={[0, 0, -3.25]} />
      <CoffeeTable position={[0, 0, -1.75]} />
      <Cat position={[1.75, 0, -1.25]} ry={-0.6} />

      <FloorLamp position={[-1.6, 0, -3.5]} />
      <FloorLamp position={[4.3, 0, -3.45]} color={C.peach} />
      <Bookshelf position={[4.73, 0, -1.4]} ry={-Math.PI / 2} w={1.5} />
      <Plant position={[-4.4, 0, -3.45]} size={1.2} />
      <Plant position={[-4.4, 0, 3.4]} kind="round" />
      <Plant position={[4.4, 0, 3.4]} size={1.1} />
      <Mailbox position={[3.3, 0, 2.9]} ry={-0.5} />
      <WelcomeBoard position={[-1.9, 0, 2.3]} ry={0.45} />

      {/* interacciones */}
      <Spot x={-1.75} z={2.55} r={0.9} label="Pizarrón" verb="Leer" panel={{ type: 'welcome' }} marker markerY={2.05} />
      <Spot x={3.2} z={2.6} r={0.9} label="Buzón · Contacto" verb="Abrir" panel={{ type: 'contact' }} marker markerY={1.75} />
      <Spot x={1.75} z={-1.1} r={0.75} label="Michi" verb="Acariciar"
        say={['Prrr… ✳', 'El michi duerme. Dice que el mejor código es el que se entiende sin explicarlo.']} who="Michi" />
      <Spot x={-0.3} z={-1.2} r={0.7} label="Mate" verb="Tomar"
        say={['Un mate y seguimos.', 'Spoiler: este portafolio se programó a base de mate.']} />
      <Spot x={4.3} z={1.4} r={1.0} label="Ventana" verb="Mirar"
        say={['Las sierras de Córdoba al atardecer.', `${person.coords} · ${person.location}`]} />
      <Spot x={4.2} z={-1.4} r={0.9} label="Biblioteca" verb="Mirar"
        say={['Libros de diseño, UX y JavaScript.', 'Hay uno de accesibilidad con muchas páginas dobladas.']} />
    </RoomShell>
  )
}
