// Normaliza y valida MACs.
// - Acepta formatos variados: aa-bb-cc-dd-ee-ff, aa:bb:..., aabbccddeeff
// - Guarda siempre en formato: AA:BB:CC:DD:EE:FF

function normalizeMac(mac) {
  if (!mac) return "";
  const clean = String(mac).toUpperCase().replace(/[^0-9A-F]/g, "");
  if (clean.length !== 12) return "";
  return clean.match(/.{1,2}/g).join(":");
}

function isValidMac(mac) {
  const n = normalizeMac(mac);
  return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(n);
}

module.exports = { normalizeMac, isValidMac };
