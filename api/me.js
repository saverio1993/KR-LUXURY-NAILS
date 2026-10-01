const { currentUser } = require("./_lib");

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Sin sesión" });
  res.json({ email: user.email });
};
