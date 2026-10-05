import { RoomShell, Rug } from '../RoomShell'
import { RBox, Label, Spark, Cabinet, useSolid } from '../kit'
import { Spot } from '../Spot'
import { Plant, FloorLamp, Desk, Laptop, Chair, StringLights, WallWindow } from '../props/furniture'
import { SkillProp } from '../props/objects'
import { ROOM_THEME, C } from '../../theme'
import { useData } from '../../data/usePortfolio'
import { DOOR_COLORS } from './Hall'

const W = 11
const D = 8.5
const JAR = [C.orange, C.sage, C.sky, C.lilac, C.blush, C.butter]

/* Estante de una categoría: título arriba, un frasquito etiquetado por skill y su objeto */
function SkillShelf({ cat, x, z, ry, idx }) {
  const quarter = Math.abs(Math.sin(ry)) > 0.5
  useSolid(x, z, quarter ? 0.5 : 1.7, quarter ? 1.7 : 0.5)
  const items = cat.items.slice(0, 6)
  const color = cat.learning ? C.sage : C.woodLight
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Cabinet w={1.6} h={1.55} d={0.44} color={color} />
      {[0.55, 1.05].map((y) => (
        <RBox key={y} size={[1.5, 0.05, 0.38]} position={[0, y, 0.05]} color={color} radius={0.01} />
      ))}
      {/* frasquitos con etiqueta: 3 por estante */}
      {items.map((it, i) => {
        const row = i < 3 ? 1 : 0
        const col = i % 3
        const y = row === 1 ? 1.08 : 0.58
        const px = (col - 1) * 0.47
        return (
          <group key={it} position={[px, y, 0.1]}>
            <RBox size={[0.36, 0.26, 0.22]} position={[0, 0.13, 0]} color={JAR[(i + idx) % JAR.length]} radius={0.06} outline />
            <RBox size={[0.4, 0.06, 0.24]} position={[0, 0.28, 0]} color={C.white} radius={0.02} />
            <RBox size={[0.34, 0.14, 0.01]} position={[0, 0.12, 0.115]} color={C.white} radius={0.02} shadow={false} />
            <Label position={[0, 0.12, 0.125]} size={0.038} color={C.ink} maxWidth={0.31}>{it}</Label>
          </group>
        )
      })}
      {/* objeto de la categoría + cartel */}
      <group position={[-0.45, 1.58, 0]}>
        <SkillProp prop={cat.prop} />
      </group>
      <group position={[0.3, 1.82, 0.05]}>
        <RBox size={[0.95, 0.28, 0.05]} color={cat.learning ? C.green : C.orange} radius={0.06} outline shadow={false} />
        <Label position={[0, 0, 0.035]} size={0.085} color={C.white} maxWidth={0.9}>{cat.category}</Label>
      </group>
    </group>
  )
}

export function Skills() {
  const t = ROOM_THEME.skills
  const skills = useData((s) => s.portfolio.skills) || []

  // Slots: 3 en la pared norte, 2 al oeste, 2 al este (si hay más categorías, se ignoran en 3D y se ven en el panel)
  const slots = [
    { x: -3.4, z: -D / 2 + 0.45, ry: 0 },
    { x: 0, z: -D / 2 + 0.45, ry: 0 },
    { x: 3.4, z: -D / 2 + 0.45, ry: 0 },
    { x: -W / 2 + 0.45, z: -0.6, ry: Math.PI / 2 },
    { x: W / 2 - 0.45, z: -0.6, ry: -Math.PI / 2 },
    { x: -W / 2 + 0.45, z: 1.9, ry: Math.PI / 2 },
    { x: W / 2 - 0.45, z: 1.9, ry: -Math.PI / 2 },
  ]

  return (
    <RoomShell
      id="skills"
      w={W}
      d={D}
      theme={t}
      doors={[{ side: 's', at: 0, to: 'hall', label: 'Hall', color: DOOR_COLORS.exit }]}
      n={
        <>
          <group position={[0, 2.62, 0.05]}>
            <RBox size={[2.4, 0.42, 0.06]} color={C.green} radius={0.1} outline shadow={false} />
            <Label position={[0, 0.01, 0.04]} size={0.2} color={C.butter}>SKILLS</Label>
          </group>
          <StringLights from={-5} to={5} y={2.9} count={20} />
        </>
      }
      s={<WallWindow x={-3.2} y={1.65} w={1.4} h={1.0} />}
    >
      <Rug w={4.5} d={3.4} color={t.rug} color2={t.rug2} position={[0, 0, 0.6]} />

      {skills.slice(0, slots.length).map((cat, i) => {
        const s = slots[i]
        // punto de interacción delante del estante
        const fx = s.x + Math.sin(s.ry) * 0.8
        const fz = s.z + Math.cos(s.ry) * 0.8
        return (
          <group key={cat.category}>
            <SkillShelf cat={cat} x={s.x} z={s.z} ry={s.ry} idx={i} />
            <Spot x={fx} z={fz} r={0.85} label={cat.category} verb="Ver skills" panel={{ type: 'skills', index: i }} />
          </group>
        )
      })}

      {/* banco de trabajo central */}
      <Desk position={[0, 0, 0.9]} w={1.6}>
        <Laptop position={[-0.15, 0, 0]} />
        <group position={[0.5, 0.0, 0.05]}>
          <Spark size={0.16} color={C.orange} position={[0, 0.12, 0]} />
        </group>
      </Desk>
      <Chair position={[-0.15, 0, 1.7]} />
      <Spot x={0} z={1.75} r={0.8} label="Banco de trabajo" verb="Mirar"
        say={['En la pantalla hay un Lighthouse en verde.', 'Performance, accesibilidad y semántica no son extras: son el estándar.']} />

      <Plant position={[-W / 2 + 0.5, 0, D / 2 - 0.5]} size={1.1} />
      <Plant position={[W / 2 - 0.5, 0, D / 2 - 0.5]} kind="round" />
      <FloorLamp position={[-W / 2 + 0.5, 0, -D / 2 + 0.5]} color={C.peach} />
    </RoomShell>
  )
}
