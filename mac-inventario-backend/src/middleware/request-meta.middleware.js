function requestMeta(req, _res, next) {
  // IP real (si usas proxy/nginx luego, esto ayuda)
  const xff = req.headers["x-forwarded-for"];
  const ip = (Array.isArray(xff) ? xff[0] : (xff || "")).split(",")[0].trim();

  req.meta = {
    ip: ip || req.ip || req.connection?.remoteAddress || "",
    userAgent: req.headers["user-agent"] || ""
  };

  next();
}

module.exports = { requestMeta };
