// Puente entre el panel y GitHub: solo la administradora con sesión puede usarlo,
// y solo puede tocar el catálogo y las fotos del catálogo. El token de GitHub
// vive en Vercel y nunca llega al navegador.
const { REPO, currentUser } = require("./_lib");

const ALLOWED = /^(data\/catalog\.json|images\/catalog\/[A-Za-z0-9_-]+\.jpg)$/;

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!currentUser(req)) return res.status(401).json({ error: "Sin sesión" });
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: "Falta configurar GITHUB_TOKEN" });

  const path = String(req.query.p || "");
  if (!ALLOWED.test(path)) return res.status(400).json({ error: "Ruta no permitida" });
  if (!["GET", "PUT", "DELETE"].includes(req.method)) return res.status(405).end();

  let url = `https://api.github.com/repos/${REPO.owner}/${REPO.repo}/contents/${path}`;
  const init = {
    method: req.method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + process.env.GITHUB_TOKEN,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "kr-luxury-nails-admin",
    },
  };
  if (req.method === "GET") {
    url += "?ref=" + encodeURIComponent(REPO.branch);
  } else {
    const { message, content, sha } = req.body || {};
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify({ message: message || "Actualizar catálogo", content, sha, branch: REPO.branch });
  }

  const r = await fetch(url, init);
  const text = await r.text();
  res.status(r.status).setHeader("Content-Type", "application/json");
  res.send(text || "{}");
};
