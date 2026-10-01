// Datos públicos que necesita el panel para mostrar el inicio de sesión de Clerk.
const { publishableKey, frontendApi } = require("./_lib");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ clerkPublishableKey: publishableKey(), clerkFrontendApi: frontendApi() });
};
