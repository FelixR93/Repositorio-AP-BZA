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

// ✅ Para obtener IP real si luego usas proxy (nginx, etc.)
app.set("trust proxy", true);

// CORS (ajusta CORS_ORIGIN si lo necesitas)
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

// ✅ Adjunta req.meta = { ip, userAgent }
app.use(requestMeta);

// Healthcheck
app.get("/api/health", (_, res) => res.json({ ok: true, name: "Bonanza MAC Inventario API" }));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/aps", apsRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/stats", statsRoutes);

// Error handler al final (captura errores)
app.use(errorHandler);

module.exports = app;
