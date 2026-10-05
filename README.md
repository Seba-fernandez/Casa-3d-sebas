# La casa de Sebas · portafolio jugable 3D

Portafolio que se recorre como un videojuego cozy en tercera persona. Arrancás adentro de la puerta de entrada de una casa; cada puerta es una sección (Proyectos, Skills, Sobre mí) y los objetos se tocan para ver contenido. Los datos salen de tu porta y de GitHub, así que la casa se actualiza sola.

**Stack:** React 19 + Vite · React Three Fiber + drei · GSAP · Zustand · función serverless de Vercel. Sin modelos 3D externos: todo está hecho con primitivas y material toon, así que no hay licencias de assets de por medio.

## Correrlo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
```

Agregá `?debug` a la URL para tener `window.__casa` en la consola (posición del jugador, estado del juego).

## Publicarlo en Vercel

1. Subí la carpeta a un repo nuevo de GitHub.
2. En Vercel: **Add New → Project**, elegí el repo. Detecta Vite solo.
3. Opcional: en **Settings → Environment Variables** agregá `GITHUB_TOKEN` (un token sin permisos especiales) para que la API de GitHub no se quede corta de pedidos.
4. Deploy.

El sitio sale con `noindex` (prototipo). Cuando lo apruebes: en `index.html` cambiá el meta `robots` a `index, follow` y borrá el header `X-Robots-Tag` de `vercel.json`.

## Cómo se conectan los datos

```
tu porta (Vercel) ──► /data/portfolio.json ──┐
                                             ├──► la casa 3D
GitHub API ──► /api/github (caché 1 h) ──────┘
```

- **`portfolio.json`**: textos, proyectos, skills, contacto. Instrucciones en `para-tu-porta/LEEME.md`. Se lee sin caché del navegador, así que un push a tu porta se ve al recargar la casa.
- **GitHub**: `api/github.js` trae tus repos públicos y los cachea una hora en el CDN. Se ven en la máquina arcade de la sala de Proyectos y en el panel de cada proyecto que tenga `"repo"`.
- **Respaldo**: si algo falla, usa `src/data/portfolio.fallback.json` (copia de tus datos actuales). Nunca queda vacía.

La URL del JSON se puede cambiar con la variable `VITE_PORTFOLIO_URL`.

## Personalizar

| Qué | Dónde |
| --- | --- |
| Tu personaje (piel, pelo, ropa, anteojos, mochila) | `src/avatar.config.js` |
| Colores del mundo y de cada habitación | `src/theme.js` |
| Muebles y decoración de cada sala | `src/game/rooms/*.jsx` |
| Objetos de proyectos y skills | `src/game/props/objects.jsx` |
| Velocidad, cámara, colisiones | `src/game/Player.jsx` |
| Textos de la interfaz y paneles | `src/ui/*.jsx` |

### Agregar una habitación

1. Creá `src/game/rooms/MiSala.jsx` copiando una existente (`RoomShell` + `doors`).
2. Registrala en `ROOMS` de `src/game/Game.jsx` y en `ROOM_NAMES` de `src/ui/HUD.jsx`.
3. Agregá la puerta en `Hall.jsx` con `to: 'misala'`. La sala nueva necesita una puerta con `to: 'hall'`.

### Cambiar el avatar por un modelo 3D

Si más adelante querés un personaje modelado (por ejemplo, de un pack CC0 como KayKit o Quaternius, o uno hecho en Blender): exportalo como `.glb` con animaciones `Idle` y `Walk`, ponelo en `public/models/`, y reemplazá `<Avatar />` en `Player.jsx` por un componente con `useGLTF` + `useAnimations`. El controlador ya le pasa la velocidad.

## Controles

| Acción | Teclado y mouse | Celular |
| --- | --- | --- |
| Caminar | WASD o flechas | Joystick izquierdo |
| Correr | Shift | Empujar el joystick al borde |
| Mirar | Arrastrar con el mouse · rueda para acercar | Arrastrar en la pantalla |
| Interactuar | E · Enter · Espacio | Botón A |
| Mapa (viaje rápido) | M | Botón Mapa |
| Cerrar | Esc | ✕ |

Las puertas se cruzan caminando hacia ellas.

## Accesibilidad y rendimiento

- **Versión clásica** (botón arriba a la derecha o link de "saltar"): todo el contenido en HTML semántico, sin WebGL. Se activa sola si el navegador no soporta WebGL.
- Los paneles son diálogos accesibles: foco atrapado, Esc para cerrar, foco devuelto al cerrar.
- Respeta `prefers-reduced-motion`: cámara sin suavizado, transiciones cortas, sin texto animado.
- three.js va en un chunk aparte y la resolución baja sola si el dispositivo no llega a los fps.
- Las paredes del lado de la cámara se hunden solas, así nunca tapan al personaje.

## Usarlo con v0

v0 rinde mejor para pantallas de interfaz que para mundos 3D. Lo que tiene sentido llevarle es `src/ui/` (pantalla de inicio, paneles, HUD, versión clásica) para iterar el diseño. Dejá `src/game/` como está.

## Pendientes

- [ ] Publicar `portfolio.json` en tu porta (ver `para-tu-porta/LEEME.md`).
- [ ] Ajustar `src/avatar.config.js` a tu pelo, piel y estilo.
- [ ] Probar en tu celu y en una compu lenta; si va justo, bajar `shadow-mapSize` en `Game.jsx`.
- [ ] Música y sonidos suaves (pasos, puertas) con un botón de silencio.
- [ ] Imagen OG propia de la casa.
- [ ] Sacar el `noindex` cuando lo apruebes.
