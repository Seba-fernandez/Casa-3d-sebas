# La casa de Sebas · portafolio jugable 3D

Portafolio que se recorre como un videojuego cozy en tercera persona. Arrancás adentro de la puerta de entrada de una casa; cada puerta es una sección (Proyectos, Skills, Sobre mí) y los objetos se tocan para ver contenido. Hay un **baño privado** con cerradura biométrica: solo vos entrás, y desde ahí editás la casa jugando.

**Stack:** React 19 + Vite · React Three Fiber + drei · GSAP · Zustand · funciones serverless de Vercel · Supabase · passkeys (WebAuthn). Sin modelos 3D externos: todo está hecho con primitivas y material toon.

## Correrlo

```bash
npm install
cp .env.example .env.local   # completalo (para probar sin Supabase: CASA_MEMORY_DB=1)
npm run dev:api   # API local en :3001 (login, contenido, GitHub)
npm run dev       # http://localhost:5173 (en otra terminal)
npm run build     # genera dist/
```

En local la huella funciona en `http://localhost` (los navegadores lo permiten sin HTTPS).

Agregá `?debug` a la URL para tener `window.__casa` en la consola (posición del jugador, estado del juego).

## Publicarlo en Vercel

1. En Vercel: **Add New → Project**, elegí el repo `Casa-3d-sebas`. Detecta Vite solo.
2. En **Settings → Environment Variables** cargá las variables de `.env.example` (las explico abajo).
3. Deploy.
4. Registrá tus llaves (ver "El baño privado").

| Variable | Qué poner |
| --- | --- |
| `SUPABASE_URL` | Ya viene en `.env.example` (proyecto `casa-3d`, São Paulo) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → proyecto casa-3d → Project Settings → API → `service_role`. Secreta |
| `OWNER_CODE` | Tu código del teclado, el de todos los días |
| `OWNER_SETUP_CODE` | Otro código, solo para registrar un dispositivo nuevo |
| `SESSION_SECRET` | Texto al azar de 32+ caracteres |
| `RP_ID` | El dominio final, ej. `casa-3d-sebas.vercel.app` |
| `GITHUB_TOKEN` | Opcional |

El sitio sale con `noindex` (prototipo). Cuando lo apruebes: en `index.html` cambiá el meta `robots` a `index, follow` y borrá el header `X-Robots-Tag` de `vercel.json`.

## El baño privado

La puerta celeste del hall tiene un escáner. Al tocarlo se abre un teclado arcade:

- **Código incorrecto** → pantalla roja de ALERTA, "INGRESO EXCLUSIVO DEL DUEÑO", y la casa te aleja de la puerta.
- **`OWNER_CODE`** → pide tu huella (celular) o tu PIN de Windows Hello (PC). Si coincide, entrás en modo dueño por 12 horas.
- **`OWNER_SETUP_CODE`** → registra el dispositivo donde estás como llave nueva.

**Primera vez:** entrá desde tu celu, poné el código de alta y apoyá la huella. Después hacé lo mismo desde tu PC con el PIN de Windows. Desde ahí, usás `OWNER_CODE` en cualquiera de los dos. Si alguien se entera del código, no le sirve sin tu huella o tu PIN; si se entera del código de alta, cambialo en Vercel.

La ventana del sistema que pide la huella o el PIN no se puede ocultar ni reemplazar (es una protección del navegador): la casa la acompaña con la animación del escáner.

### Editar la casa jugando

1. En el baño, usá el **espejo-consola** y elegí qué cambiar: agregar una skill, un estante nuevo, un proyecto o tus textos de Sobre mí.
2. Escribís lo que querés y tu personaje agarra el objeto: un frasquito, un cajón, una caja o un librito.
3. Caminás hasta su lugar (cualquier estante, el banco de trabajo, la mesa de novedades o tu escritorio). Un aro naranja marca dónde soltarlo.
4. Al soltarlo aparece el cartel **Guardar / Seguir llevándolo / Descartar**. Guardar lo escribe en Supabase y la casa se actualiza al instante.

Para **corregir** algo que ya existe, tocá el objeto en su sala: en modo dueño los paneles muestran **Editar** (proyectos, estantes de skills, Sobre mí), con opción de eliminar.

Cada guardado deja la versión anterior en la tabla `casa_content_history`, por si necesitás volver atrás.

## Cómo se conectan los datos

```
Baño (modo dueño) ──► /api/content ──► Supabase (casa_content) ──┐
tu porta ──► /data/portfolio.json (respaldo) ─────────────────────┼──► la casa 3D
GitHub API ──► /api/github (caché 1 h) ───────────────────────────┘
```

- **Supabase** es la fuente principal: ya está cargado con tus datos actuales. `/api/content` es público para leer (tu porta también puede usarlo) y solo acepta cambios con sesión de dueño.
- **`portfolio.json`**: textos, proyectos, skills, contacto. Instrucciones en `para-tu-porta/LEEME.md`. Se lee sin caché del navegador, así que un push a tu porta se ve al recargar la casa.
- **GitHub**: `api/github.js` trae tus repos públicos y los cachea una hora en el CDN. Se ven en la máquina arcade de la sala de Proyectos y en el panel de cada proyecto que tenga `"repo"`.
- **Respaldo**: si algo falla, usa `src/data/portfolio.fallback.json` (copia de tus datos actuales). Nunca queda vacía.

La URL del JSON se puede cambiar con la variable `VITE_PORTFOLIO_URL`.

## Personalizar

| Qué | Dónde |
| --- | --- |
| Tu personaje (piel, pelo, barba, remera, jean) | `src/avatar.config.js` |
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
