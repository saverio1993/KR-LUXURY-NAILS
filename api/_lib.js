// Utilidades compartidas por las funciones del panel (los archivos con "_" no son rutas).
const crypto = require("crypto");

const REPO = {
  owner: process.env.GITHUB_OWNER || "saverio1993",
  repo: process.env.GITHUB_REPO || "KR-LUXURY-NAILS",
  branch: process.env.GITHUB_BRANCH || "claude/happy-davinci-nakljr",
};

const COOKIE = "kr_session";
const SESSION_DAYS = 30;

function secret() {
  const base = process.env.SESSION_SECRET || process.env.GITHUB_TOKEN || "";
  if (!base) throw new Error("Falta configurar GITHUB_TOKEN");
  return crypto.createHash("sha256").update("kr-session:" + base).digest();
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return body + "." + mac;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, mac] = token.split(".");
  const expected = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  if (!data.exp || data.exp < Date.now()) return null;
  // Si se quita un correo de ADMIN_EMAILS, su sesión deja de valer al momento.
  if (!adminEmails().includes(data.email)) return null;
  return data;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || "";
  const m = raw.split(/;\s*/).find((c) => c.startsWith(name + "="));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}

function setSession(res, email) {
  const token = sign({ email, exp: Date.now() + SESSION_DAYS * 864e5 });
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`);
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

function currentUser(req) {
  try { return verify(readCookie(req, COOKIE)); } catch (_) { return null; }
}

module.exports = { REPO, adminEmails, setSession, clearSession, currentUser };
