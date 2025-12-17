// Devuelve la lista oficial de APs para combos del frontend.

const { APS } = require("../constants/aps");

function listAps(req, res) {
  res.json({ aps: APS });
}

module.exports = { listAps };
