import { RoomShell, Rug } from '../RoomShell'
import { RBox, Cyl, Label, Spark, useSolid } from '../kit'
import { Spot } from '../Spot'
import { Plant, FloorLamp, StringLights, Frame } from '../props/furniture'
import { ProjectProp, Screenshot, StatusLamp } from '../props/objects'
import { ROOM_THEME, C } from '../../theme'
import { useData, abs } from '../../data/usePortfolio'
import { DOOR_COLORS } from './Hall'
import { DropSpot } from '../../owner/DropSpot'

const W = 12
const D = 9

/* Proyecto destacado: atril con captura + pedestal con su objeto + placa */
function Showcase({ project, x, z, data }) {
  useSolid(x, z - 0.55, 1.5, 0.5) // atril
  return (
    <group position={[x, 0, z]}>
      {/* atril con pantalla */}
      <group position={[0, 0, -0.55]}>
        <RBox size={[0.08, 1.5, 0.08]} position={[-0.6, 0.75, 0]} color={C.woodDark} />
        <RBox size={[0.08, 1.5, 0.08]} position={[0.6, 0.75, 0]} color={C.woodDark} />
        <group position={[0, 1.55, 0.02]} rotation={[-0.08, 0, 0]}>
          <RBox size={[1.62, 1.06, 0.07]} color={project.color || C.orange} radius={0.05} outline />
          <group position={[0, 0, 0.04]}>
            <Screenshot url={abs(data, project.images?.desktop)} w={1.48} h={0.92} color={C.mint} />
          </group>
        </group>
        <RBox size={[1.4, 0.06, 0.2]} position={[0, 0.98, 0.06]} color={C.woodLight} radius={0.02} />
      </group>
      {/* pedestal con el objeto */}
      <RBox size={[0.8, 0.8, 0.8]} position={[0, 0.4, 0.35]} color={C.white} radius={0.08} outline />
      <RBox size={[0.9, 0.07, 0.9]} position={[0, 0.81, 0.35]} color={C.creamDeep} radius={0.03} />
      <group position={[0, 0.85, 0.35]}>
        <ProjectProp prop={project.prop} color={project.color} />
      </group>
      {/* placa */}
      <group position={[0, 0.45, 0.76]}>
        <RBox size={[0.72, 0.3, 0.03]} color={C.green} radius={0.03} shadow={false} />
        <Label position={[0, 0.05, 0.02]} size={0.075} color={C.white} maxWidth={0.66}>{project.title}</Label>
        <Label position={[0, -0.08, 0.02]} size={0.05} color={C.butter}>{(project.kind || '').toUpperCase()}</Label>
      </group>
      <StatusLamp status={project.status} position={[0.32, 0.95, 0.66]} />
      <SolidAt x={x} z={z + 0.35} />
    </group>
  )
}
function SolidAt({ x, z }) {
  useSolid(x, z, 0.85, 0.85)
  return null
}

/* Proyecto chico: mesita con su objeto (el cuadro va en la pared) */
function SmallTable({ project, x, z, ry }) {
  useSolid(x, z, Math.abs(Math.sin(ry)) > 0.5 ? 0.6 : 0.9, Math.abs(Math.sin(ry)) > 0.5 ? 0.9 : 0.6)
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <RBox size={[0.9, 0.06, 0.55]} position={[0, 0.7, 0]} color={C.woodLight} radius={0.03} outline />
      <Cyl r={0.04} h={0.68} position={[0, 0.34, 0]} color={C.woodDark} />
      <Cyl r={0.22} h={0.03} position={[0, 0.015, 0]} color={C.woodDark} />
      <group position={[0, 0.73, 0]} scale={0.85}>
        <ProjectProp prop={project.prop} color={project.color} />
      </group>
      <StatusLamp status={project.status} position={[0.36, 0.78, 0.18]} />
    </group>
  )
}

/* Máquina tipo arcade que muestra tus repos de GitHub en vivo */
function GithubArcade({ x, z, ry, count }) {
  useSolid(x, z, 0.8, 0.9)
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <RBox size={[0.85, 1.75, 0.75]} position={[0, 0.875, 0]} color={C.green} radius={0.08} outline />
      <RBox size={[0.9, 0.3, 0.8]} position={[0, 1.85, -0.02]} color={C.orange} radius={0.08} outline />
      <Label position={[0, 1.86, 0.41]} size={0.11} color={C.white}>GITHUB</Label>
      <group position={[0, 1.35, 0.36]} rotation={[-0.15, 0, 0]}>
        <RBox size={[0.66, 0.5, 0.04]} color={C.ink} radius={0.03} />
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[0.58, 0.42]} />
          <meshBasicMaterial color="#1C4D3F" />
        </mesh>
        <Label position={[0, 0.08, 0.03]} size={0.16} color="#7CF2B8">{count ?? '…'}</Label>
        <Label position={[0, -0.1, 0.03]} size={0.055} color="#7CF2B8">repos públicos</Label>
      </group>
      <RBox size={[0.7, 0.08, 0.3]} position={[0, 0.98, 0.42]} rotation={[0.3, 0, 0]} color={C.creamDeep} radius={0.03} />
      <Cyl r={0.025} h={0.12} position={[-0.15, 1.08, 0.45]} color={C.ink} />
      <mesh position={[-0.15, 1.15, 0.45]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshToonMaterial color={C.orange} />
      </mesh>
      {[0.08, 0.2].map((bx) => (
        <Cyl key={bx} r={0.04} h={0.04} position={[bx, 1.05, 0.46]} rotation={[0.3, 0, 0]} color={bx > 0.1 ? C.butter : C.blush} />
      ))}
    </group>
  )
}

export function Proyectos() {
  const t = ROOM_THEME.proyectos
  const data = useData((s) => s.portfolio)
  const repos = useData((s) => s.github)
  const ghStatus = useData((s) => s.githubStatus)
  const projects = data.projects || []
  const featured = projects.filter((p) => p.featured)
  const others = projects.filter((p) => !p.featured)

  // destacados repartidos a lo ancho de la sala
  const gap = Math.min(3.6, (W - 2) / Math.max(1, featured.length))
  const fz = -2.6

  // slots para los proyectos chicos: pared oeste y este
  const slots = [
    { side: 'w', at: 1.4, x: -W / 2 + 0.7, z: -1.4, ry: Math.PI / 2 },
    { side: 'w', at: -0.6, x: -W / 2 + 0.7, z: 0.6, ry: Math.PI / 2 },
    { side: 'w', at: -2.6, x: -W / 2 + 0.7, z: 2.6, ry: Math.PI / 2 },
    { side: 'e', at: -1.4, x: W / 2 - 0.7, z: -1.4, ry: -Math.PI / 2 },
    { side: 'e', at: 0.6, x: W / 2 - 0.7, z: 0.6, ry: -Math.PI / 2 },
  ]
  const placed = others.slice(0, slots.length).map((p, i) => ({ p, s: slots[i] }))

  const frameFor = (side) =>
    placed
      .filter(({ s }) => s.side === side)
      .map(({ p, s }) => (
        <group key={p.id} position={[s.at, 1.75, 0.04]}>
          <RBox size={[1.12, 0.74, 0.05]} color={p.color || C.woodLight} radius={0.04} outline shadow={false} />
          <group position={[0, 0, 0.03]}>
            <Screenshot url={abs(data, p.images?.desktop)} w={1.0} h={0.62} color={C.mint} />
          </group>
          <group position={[0, -0.52, 0]}>
            <RBox size={[0.9, 0.22, 0.03]} color={C.white} radius={0.03} shadow={false} />
            <Label position={[0, 0, 0.02]} size={0.07} color={C.green} maxWidth={0.85}>{p.title}</Label>
          </group>
        </group>
      ))

  const liveCount = projects.filter((p) => p.status === 'live').length

  return (
    <RoomShell
      id="proyectos"
      w={W}
      d={D}
      theme={t}
      doors={[{ side: 's', at: 0, to: 'hall', label: 'Hall', color: DOOR_COLORS.exit }]}
      n={
        <>
          <group position={[0, 2.55, 0.05]}>
            <RBox size={[3.2, 0.5, 0.06]} color={C.green} radius={0.1} outline shadow={false} />
            <Label position={[-0.25, 0.01, 0.04]} size={0.24} color={C.white}>PROYECTOS</Label>
            <Spark size={0.22} color={C.orange} position={[1.15, 0, 0.05]} />
            <Spark size={0.22} color={C.orange} position={[-1.4, 0, 0.05]} />
          </group>
          <StringLights from={-5.5} to={5.5} y={2.85} count={24} />
        </>
      }
      wSide={frameFor('w')}
      e={
        <>
          {frameFor('e')}
          <group position={[-3.0, 2.2, 0.05]}>
            <RBox size={[1.3, 0.55, 0.05]} color={C.white} radius={0.06} outline shadow={false} />
            <Label position={[0, 0.08, 0.04]} size={0.17} color={C.orange}>{liveCount} live</Label>
            <Label position={[0, -0.13, 0.04]} size={0.06} color={C.green}>{projects.length} proyectos en total</Label>
          </group>
        </>
      }
      s={
        <Frame x={-3.4} y={1.7} w={1.1} h={0.6} art={C.butter}>
          <Label size={0.075} color={C.green} maxWidth={1}>Caminá hasta un pedestal y apretá E</Label>
        </Frame>
      }
    >
      <Rug w={W - 3} d={2.6} color={t.rug} color2={t.rug2} position={[0, 0, fz + 0.5]} />
      <Rug w={2} d={3.6} color={C.sage} color2={C.mint} position={[0, 0, 2.4]} />

      {featured.map((p, i) => {
        const x = (i - (featured.length - 1) / 2) * gap
        return (
          <group key={p.id}>
            <Showcase project={p} x={x} z={fz} data={data} />
            <Spot x={x} z={fz + 0.95} r={0.9} label={p.title} verb="Ver proyecto" panel={{ type: 'project', id: p.id }} marker markerY={2.35} />
          </group>
        )
      })}

      {placed.map(({ p, s }) => (
        <group key={p.id}>
          <SmallTable project={p} x={s.x} z={s.z} ry={s.ry} />
          <Spot x={s.x + (s.side === 'w' ? 0.6 : -0.6)} z={s.z} r={0.8} label={p.title} verb="Ver proyecto" panel={{ type: 'project', id: p.id }} />
        </group>
      ))}

      <DropSpot kind="project" x={0} z={0.6} r={1.0} label="en la mesa de novedades" target={{}} />

      <GithubArcade x={W / 2 - 0.7} z={2.9} ry={-Math.PI / 2} count={ghStatus === 'ok' ? repos.length : null} />
      <Spot x={W / 2 - 1.5} z={2.9} r={0.9} label="Arcade GitHub" verb="Jugar" panel={{ type: 'github' }} marker markerY={2.4} />

      <Plant position={[-W / 2 + 0.5, 0, -D / 2 + 0.5]} size={1.2} />
      <Plant position={[W / 2 - 0.5, 0, -D / 2 + 0.5]} size={1.2} kind="round" />
      <Plant position={[-W / 2 + 0.5, 0, D / 2 - 0.5]} kind="cactus" />
      <FloorLamp position={[-W / 2 + 0.55, 0, -D / 2 + 1.5]} color={C.mint} />
      <FloorLamp position={[W / 2 - 0.55, 0, -D / 2 + 1.5]} color={C.mint} light={false} />
    </RoomShell>
  )
}
