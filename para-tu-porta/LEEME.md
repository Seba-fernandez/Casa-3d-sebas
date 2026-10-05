# Conectar tu porta con la casa 3D

La casa 3D no "escanea" tu porta: lee **un solo archivo** que vos publicás en ella.
Así, cuando cambiás algo, se actualiza en los dos lados sin romperse si rediseñás la porta.

## 1. Publicar el archivo

Copiá `data/portfolio.json` dentro de la carpeta pública de tu porta, para que quede en:

```
https://juansebastianfernandez-dev.vercel.app/data/portfolio.json
```

- Si tu porta es HTML/CSS/JS puro: carpeta `data/` en la raíz del proyecto.
- Si es Vite o React: `public/data/portfolio.json`.

Hacé commit y push: Vercel lo publica solo.

## 2. Verificar que se pueda leer desde otro dominio

Abrí en el navegador la URL de arriba: tiene que mostrarse el JSON.
Vercel suele servir los archivos estáticos con `Access-Control-Allow-Origin: *` (tus imágenes ya lo tienen).
Si la casa 3D no lo lee, agregá esto al `vercel.json` de **tu porta**:

```json
{
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

Mientras el archivo no exista, la casa usa una copia local con los mismos datos, así que nunca se ve vacía.

## 3. Mantenerlo al día

| Querés… | Tocás en `portfolio.json` |
| --- | --- |
| Sumar un proyecto | Un objeto nuevo en `projects` (copiá uno y cambiá los datos) |
| Que aparezca en un pedestal grande | `"featured": true` |
| Marcar uno en curso o pendiente | `"status": "wip"` (luz ámbar) o `"pending"` (luz gris) |
| Elegir su objeto 3D | `"prop"`: `racket`, `perfume`, `mic`, `court`, `coffee`, `vinyl` (cualquier otro valor → caja con ✳) |
| Ver su último commit en el panel | `"repo"` con el nombre exacto del repo en GitHub |
| Cambiar skills | `skills[].items` · `"learning": true` para lo que estás aprendiendo |

Las capturas (`images.desktop` / `images.mobile`) usan las mismas rutas que ya tenés en `/img/p/`.

## Bonus: que tu porta también lea el JSON

Si querés una sola fuente de verdad de verdad, tu porta puede armar sus tarjetas desde el mismo archivo:

```js
const data = await fetch('/data/portfolio.json').then((r) => r.json())
data.projects.forEach((p) => {
  // crear la tarjeta del proyecto con p.title, p.summary, p.images.desktop…
})
```
