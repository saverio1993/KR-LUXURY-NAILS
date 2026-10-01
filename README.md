# KR Luxury Nails 💅

Web tipo catálogo para un estudio de uñas, pensada para verse en el teléfono.
Es una web estática (HTML, CSS y JavaScript): no hace falta instalar nada y funciona en GitHub Pages.

## Páginas

- `index.html`: la web pública (portada, sobre mí, catálogo por categorías, servicios, ubicación con mapa y botón de WhatsApp).
- `admin.html`: el panel de la dueña (también se llega desde el enlace "✦ Administrar" al final de la web).

## Cómo se guardan los datos

- `data/catalog.json` guarda la información del negocio y el catálogo.
- `images/catalog/` guarda las fotos que se suben desde el panel. Se reducen a 1600 px en JPG para que carguen rápido.
- `images/muestras/` tiene las imágenes de ejemplo, que se pueden borrar desde el panel.

Al pulsar **Guardar**, el panel publica los cambios en este repositorio usando la API de GitHub,
y GitHub Pages actualiza la web en 1–2 minutos.

## Acceso al panel

Para entrar al panel hace falta una clave: un *fine-grained token* de GitHub.

1. Ve a https://github.com/settings/personal-access-tokens/new
2. En *Repository access*, elige "Only select repositories" y marca `KR-LUXURY-NAILS`.
3. En *Permissions → Repository permissions → Contents*, elige **Read and write**.
4. Genera el token y pégalo en `admin.html`. Queda guardado solo en ese navegador.

Solo una clave con permiso de escritura sobre este repositorio puede editar, así que solo la dueña puede hacerlo.

## Configuración

`js/config.js` indica el repositorio y la rama donde el panel guarda los cambios.
Debe ser la misma rama que publica GitHub Pages.

## Activar GitHub Pages

Ve a *Settings → Pages → Build and deployment*, elige *Deploy from a branch*, la rama configurada y la carpeta `/ (root)`.
La web quedará en `https://saverio1993.github.io/KR-LUXURY-NAILS/`.
