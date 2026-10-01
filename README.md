# KR Luxury Nails 💅

Web tipo catálogo para un estudio de uñas, pensada para verse en el teléfono.
Es una web estática (HTML, CSS y JavaScript): no hace falta instalar nada y funciona en GitHub Pages.

## Páginas

- `index.html`: la web pública (portada, sobre mí, catálogo por categorías, servicios, ubicación con mapa y botón de WhatsApp).
- `admin.html`: el panel de la dueña (también se llega desde el enlace "✦ Administrar" al final de la web).

## Cómo se guardan los datos

- `data/catalog.json` guarda la información del negocio y el catálogo.
- `images/catalog/` guarda las fotos que se suben desde el panel. Se reducen a 1600 px en JPG para que carguen rápido.

Al pulsar **Guardar**, el panel envía los cambios a las funciones de `api/` en Vercel,
que los guardan en este repositorio. Vercel vuelve a publicar la web en un minuto.

## Acceso al panel (cuenta de Google)

La dueña entra con **"Iniciar sesión con Google"**. Solo los correos de `ADMIN_EMAILS` pueden administrar.
La sesión dura 30 días en ese teléfono.

Variables de entorno en Vercel (Project → Settings → Environment Variables):

| Variable | Valor |
| --- | --- |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google (tipo "Aplicación web") |
| `ADMIN_EMAILS` | Correos autorizados, separados por comas |
| `GITHUB_TOKEN` | Fine-grained token con permiso *Contents: Read and write* solo sobre este repositorio |

Cómo crear el `GOOGLE_CLIENT_ID`:

1. Ve a https://console.cloud.google.com/apis/credentials y crea un proyecto si no tienes uno.
2. Configura la *pantalla de consentimiento de OAuth* (tipo Externo, con el nombre de la web).
3. *Crear credenciales → ID de cliente de OAuth → Aplicación web*.
4. En *Orígenes de JavaScript autorizados* agrega `https://kr-luxury-nails.vercel.app`.
5. Copia el ID de cliente (termina en `.apps.googleusercontent.com`).

Después de cambiar las variables hay que volver a publicar (Redeploy) en Vercel.

## Configuración

`js/config.js` indica la ruta del catálogo y de las fotos. Las funciones de `api/_lib.js`
usan el repositorio `saverio1993/KR-LUXURY-NAILS` y la rama publicada; se pueden cambiar con
`GITHUB_OWNER`, `GITHUB_REPO` y `GITHUB_BRANCH`.

## GitHub Pages (opcional)

La web pública también funciona en GitHub Pages, pero el panel de administración necesita Vercel.


Ve a *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, la rama configurada y la carpeta `/ (root)`.
La web quedará en `https://saverio1993.github.io/KR-LUXURY-NAILS/`.
