const { requireAdmin } = require("./_lib");

module.exports = async (req, res) => {
  const admin = await requireAdmin(req, res);
  if (admin) res.json(admin);
};
