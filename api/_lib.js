// Utilidades compartidas por las funciones del panel (los archivos con "_" no son rutas).
// Inicio de sesión con Clerk y almacenamiento de fotos y catálogo en Vercel Blob.
const crypto = require("crypto");

const CATALOG_BLOB = "catalog.json";

function publishableKey() {
  return process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
}

// La clave pública de Clerk lleva codificado el dominio de su API (Frontend API).
function frontendApi() {
  const pk = publishableKey();
  const encoded = pk.split("_").slice(2).join("_");
  if (!encoded) return "";
  return Buffer.from(encoded, "base64").toString().replace(/\$$/, "");
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/* ---------- Verificación del token de sesión de Clerk (JWT RS256) ---------- */
let jwksCache = { at: 0, keys: [] };
async function jwks(force) {
  if (!force && Date.now() - jwksCache.at < 3600e3 && jwksCache.keys.length) return jwksCache.keys;
  const r = await fetch(`https://${frontendApi()}/.well-known/jwks.json`);
  if (!r.ok) throw new Error("No se pudo obtener JWKS de Clerk");
  jwksCache = { at: Date.now(), keys: (await r.json()).keys || [] };
  return jwksCache.keys;
}

async function verifySessionToken(token, origin) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const header = JSON.parse(Buffer.from(h, "base64url").toString());
  if (header.alg !== "RS256") return null;
  let jwk = (await jwks()).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await jwks(true)).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const ok = crypto.verify("RSA-SHA256", Buffer.from(h + "." + p), key, Buffer.from(s, "base64url"));
  if (!ok) return null;
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp < now - 5) return null;
  if (claims.nbf && claims.nbf > now + 5) return null;
  // Clerk indica desde qué web se pidió el token; debe ser esta misma.
  if (claims.azp && origin && claims.azp !== origin) return null;
  return claims;
}

/* ---------- Correo del usuario (API de Clerk con la clave secreta) ---------- */
const emailCache = new Map();
async function userEmail(userId) {
  if (emailCache.has(userId)) return emailCache.get(userId);
  const r = await fetch("https://api.clerk.com/v1/users/" + encodeURIComponent(userId), {
    headers: { Authorization: "Bearer " + process.env.CLERK_SECRET_KEY },
  });
  if (!r.ok) throw new Error("No se pudo leer el usuario de Clerk");
  const u = await r.json();
  const primary = (u.email_addresses || []).find((e) => e.id === u.primary_email_address_id);
  const email = primary && primary.verification && primary.verification.status === "verified"
    ? primary.email_address.toLowerCase()
    : "";
  emailCache.set(userId, email);
  return email;
}

// Devuelve { email } si quien llama es administradora; si no, responde el error y devuelve null.
async function requireAdmin(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!publishableKey() || !process.env.CLERK_SECRET_KEY) {
    res.status(500).json({ error: "Falta conectar Clerk al proyecto" });
    return null;
  }
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = req.headers.origin || `${proto}://${req.headers.host}`;
  let claims = null;
  try { claims = await verifySessionToken(token, origin); } catch (_) { claims = null; }
  if (!claims || !claims.sub) {
    res.status(401).json({ error: "Sin sesión" });
    return null;
  }
  const email = await userEmail(claims.sub);
  if (!email || !adminEmails().includes(email)) {
    res.status(403).json({ error: "Esta cuenta no tiene permiso", email });
    return null;
  }
  return { email };
}

/* ---------- Vercel Blob (se puede reemplazar en pruebas) ---------- */
const blob = {
  impl: null,
  get lib() { return this.impl || (this.impl = require("@vercel/blob")); },
};

module.exports = { CATALOG_BLOB, publishableKey, frontendApi, requireAdmin, blob };
