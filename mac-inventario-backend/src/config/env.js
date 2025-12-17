// Centraliza variables de entorno y valores por defecto.

require("dotenv").config();

const ENV = {
  PORT: process.env.PORT || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mac_inventario_bonanza",
  JWT_SECRET: process.env.JWT_SECRET || "AP_SECRET_KEY",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
};

module.exports = { ENV };
