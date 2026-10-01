// Datos públicos que necesita el botón de Google en el panel.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || "" });
};
