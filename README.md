# KR Luxury Nails 💅

Web tipo catálogo para un estudio de uñas, pensada para verse en el teléfono.
Es una web estática (HTML, CSS y JavaScript): no hace falta instalar nada y funciona en GitHub Pages.

## Páginas

- `index.html`: la web pública (portada, sobre mí, catálogo por categorías, servicios, ubicación con mapa y botón de WhatsApp).
- `admin.html`: el panel de la dueña (también se llega desde el enlace "✦ Administrar" al final de la web).

## Cómo se guardan los datos

- **Vercel Blob** (almacén `kr-luxury-nails-fotos`) guarda `catalog.json` y las fotos que se suben desde el panel.
  Los cambios se ven en la web al momento.
- `data/catalog.json` e `images/catalog/` del repositorio son el catálogo inicial: se usan mientras no
  se haya guardado nada desde el panel.
- Las fotos se reducen a 1600 px en JPG en el propio teléfono antes de subirlas.

## Acceso al panel (Clerk)

La dueña entra con Clerk ("Continuar con Google" o correo). Solo los correos de `ADMIN_EMAILS` pueden administrar.

Variables de entorno en Vercel (Project → Settings → Environment Variables):

| Variable | Cómo se obtiene |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Se crean solas al conectar Clerk desde el Marketplace de Vercel |
| `BLOB_READ_WRITE_TOKEN` | Se crea sola al conectar el almacén de Blob al proyecto |
| `ADMIN_EMAILS` | Correos autorizados, separados por comas |

Funciones (`api/`):

- `GET /api/config`: clave pública de Clerk para el panel.
- `GET /api/me`: comprueba la sesión y el permiso.
- `GET /api/catalog`: catálogo publicado (público). `POST /api/catalog`: guarda el catálogo (solo administradoras).
- `POST /api/upload`: sube una foto a Blob (solo administradoras).

Después de cambiar variables hay que volver a publicar (Redeploy) en Vercel.

## GitHub Pages (opcional)

La web pública también funciona en GitHub Pages, pero el panel de administración necesita Vercel.


Ve a *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, la rama configurada y la carpeta `/ (root)`.
La web quedará en `https://saverio1993.github.io/KR-LUXURY-NAILS/`.
