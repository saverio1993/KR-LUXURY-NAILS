// Recibe la credencial del botón "Iniciar sesión con Google", la verifica con Google
// y, si el correo es de una administradora, abre una sesión de 30 días.
const { adminEmails, setSession } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  const credential = req.body && req.body.credential;
  if (!credential) return res.status(400).json({ error: "Falta la credencial" });

  const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!r.ok) return res.status(401).json({ error: "Credencial de Google no válida" });
  const info = await r.json();

  const email = String(info.email || "").toLowerCase();
  const okAudience = info.aud === process.env.GOOGLE_CLIENT_ID;
  const okIssuer = info.iss === "accounts.google.com" || info.iss === "https://accounts.google.com";
  const okVerified = info.email_verified === true || info.email_verified === "true";
  if (!okAudience || !okIssuer || !okVerified) return res.status(401).json({ error: "Credencial de Google no válida" });
  if (!adminEmails().includes(email)) return res.status(403).json({ error: "Esta cuenta no tiene permiso", email });

  setSession(res, email);
  res.json({ email, name: info.name || "", picture: info.picture || "" });
};
