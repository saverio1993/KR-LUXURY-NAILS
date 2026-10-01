// Sube una foto (ya reducida en el teléfono) a Vercel Blob. Solo administradoras.
const { requireAdmin, blob } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (!(await requireAdmin(req, res))) return;

  const { name, base64 } = req.body || {};
  if (!/^[A-Za-z0-9_-]{1,60}$/.test(String(name || "")) || typeof base64 !== "string") {
    return res.status(400).json({ error: "Foto no válida" });
  }
  const data = Buffer.from(base64, "base64");
  // JPEG empieza con FF D8 FF
  if (data.length < 3 || data[0] !== 0xff || data[1] !== 0xd8 || data[2] !== 0xff) {
    return res.status(400).json({ error: "La foto debe ser JPG" });
  }
  const result = await blob.lib.put(`fotos/${name}.jpg`, data, blob.opts({
    access: "public",
    contentType: "image/jpeg",
    addRandomSuffix: true,
  }));
  res.json({ url: result.url });
};
