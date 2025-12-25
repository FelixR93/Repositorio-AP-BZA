// Configura Express, middlewares globales y rutas.

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { ENV } = require("./config/env");
const { errorHandler } = require("./middleware/error.middleware");
const { requestMeta } = require("./middleware/request-meta.middleware");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const apsRoutes = require("./routes/aps.routes");
const devicesRoutes = require("./routes/devices.routes");
const statsRoutes = require("./routes/stats.routes");

const app = express();

// Para obtener IP real si usas proxy (nginx, etc.)
app.set("trust proxy", true);

/* ======================================================
   CORS para:
   - Navegador: http://localhost:4200
   - Navegador: http://127.0.0.1:4200
   - Electron: file://  → origin viene undefined / null
   ====================================================== */

const allowedOrigins = new Set([
  ENV.CORS_ORIGIN, // tu web normal (ej: http://localhost:4200)
  "http://localhost:4200", // por si acaso
]);

app.use(
  cors({
    origin: (origin, cb) => {
      // ✅ Electron file:// → origin es null/undefined
      if (!origin) return cb(null, true);

      if (allowedOrigins.has(origin)) return cb(null, true);

      return cb(new Error(`CORS bloqueado para origin: ${origin}`), false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// Adjunta req.meta = { ip, userAgent }
app.use(requestMeta);

// Healthcheck
app.get("/api/health", (_, res) =>
  res.json({ ok: true, name: "Bonanza MAC Inventario API" })
);

// Rutas API
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/aps", apsRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/stats", statsRoutes);

// Error handler al final
app.use(errorHandler);

module.exports = app;
