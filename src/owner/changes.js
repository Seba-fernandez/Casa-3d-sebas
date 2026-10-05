// Qué hace cada objeto que llevás en las manos cuando lo soltás en su lugar.

export const CARRY_INFO = {
  skill: { thing: 'frasquito', where: 'Soltalo en un estante del Taller de Skills' },
  category: { thing: 'cajón', where: 'Llevalo al banco de trabajo del Taller de Skills' },
  project: { thing: 'caja', where: 'Llevala a la mesa de novedades de la Sala de Proyectos' },
  about: { thing: 'librito', where: 'Dejalo en tu escritorio, en Mi cuarto' },
}

export function slug(s) {
  return (
    String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'proyecto'
  )
}

export const list = (s) =>
  String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

/* Texto corto para el cartel de Guardar / Descartar */
export function describe(carry, target, data) {
  switch (carry.kind) {
    case 'skill':
      return `Agregar «${carry.payload.name}» a ${data.skills[target.index]?.category}`
    case 'category':
      return `Nuevo estante «${carry.payload.category}» con ${carry.payload.items.length} skills`
    case 'project':
      return `Nuevo proyecto «${carry.payload.title}» (${carry.payload.status === 'live' ? 'live' : carry.payload.status === 'wip' ? 'en curso' : 'pendiente'})`
    case 'about':
      return 'Actualizar tus textos de Sobre mí'
    default:
      return 'Cambio'
  }
}

/* Aplica el cambio sobre una copia del contenido (la usa saveContent) */
export function applyDrop(carry, target) {
  return (d) => {
    if (carry.kind === 'skill') {
      const cat = d.skills[target.index]
      if (!cat.items.some((x) => x.toLowerCase() === carry.payload.name.toLowerCase())) cat.items.push(carry.payload.name)
    }
    if (carry.kind === 'category') {
      d.skills.push({
        category: carry.payload.category,
        prop: carry.payload.prop || 'blocks',
        learning: !!carry.payload.learning,
        items: carry.payload.items,
      })
    }
    if (carry.kind === 'project') {
      let id = slug(carry.payload.title)
      while (d.projects.some((p) => p.id === id)) id += '-2'
      d.projects.push({ ...carry.payload, id })
    }
    if (carry.kind === 'about') {
      Object.assign(d.person, carry.payload)
    }
  }
}
