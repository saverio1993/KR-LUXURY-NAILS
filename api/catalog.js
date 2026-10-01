// GET  → catálogo publicado (público). Si aún no se ha guardado nada desde el panel,
//        se usa data/catalog.json del repositorio.
// POST → guarda el catálogo (solo administradoras) y borra las fotos que se quitaron.
const fs = require("fs");
const path = require("path");
const { CATALOG_BLOB, requireAdmin, blob } = require("./_lib");

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

async function readCatalog() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const found = await blob.lib.get(CATALOG_BLOB, blob.opts({ access: "public", useCache: false }));
    if (found) return JSON.parse(await new Response(found.stream).text());
  }
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog.json"), "utf8"));
}

function valid(c) {
  return c && typeof c === "object" && c.profile && typeof c.profile === "object" &&
    Array.isArray(c.categories) &&
    c.categories.every((cat) => cat && typeof cat.name === "string" && Array.isArray(cat.items) &&
      cat.items.every((it) => it && typeof it.src === "string"));
}

module.exports = async (req, res) => {
  if (req.method === "GET") {
    // La administradora pide ?fresh=… para saltarse la caché.
    res.setHeader("Cache-Control", req.query.fresh ? "no-store" : "public, s-maxage=15, stale-while-revalidate=300");
    try {
      return res.json(await readCatalog());
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "No se pudo leer el catálogo" });
    }
  }

  if (req.method !== "POST") return res.status(405).end();
  if (!(await requireAdmin(req, res))) return;

  const { catalog, deleted } = req.body || {};
  if (!valid(catalog)) return res.status(400).json({ error: "Catálogo no válido" });

  await blob.lib.put(CATALOG_BLOB, JSON.stringify(catalog, null, 2), blob.opts({
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  }));

  // Solo se borran fotos subidas a Blob que ya no aparecen en el catálogo.
  const inUse = new Set(catalog.categories.flatMap((c) => c.items.map((it) => it.src)));
  if (catalog.profile.photo) inUse.add(catalog.profile.photo);
  const toDelete = (Array.isArray(deleted) ? deleted : []).filter((u) => {
    try { return BLOB_HOST.test(new URL(u).hostname) && !inUse.has(u); } catch (_) { return false; }
  });
  if (toDelete.length) await blob.lib.del(toDelete, blob.opts()).catch((e) => console.error(e));

  res.json({ ok: true });
};
