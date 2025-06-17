const rateLimit = require("express-rate-limit")
const helmet = require("helmet")
const mongoSanitize = require("express-mongo-sanitize")
const xss = require("xss-clean")

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  })
}

const generalLimiter = createRateLimit(
  15 * 60 * 1000,
  100,
  "Çok fazla istek gönderdiniz, lütfen 15 dakika sonra tekrar deneyin.",
)

const authLimiter = createRateLimit(
  15 * 60 * 1000,
  5,
  "Çok fazla giriş denemesi, lütfen 15 dakika sonra tekrar deneyin.",
)

const adminLimiter = createRateLimit(15 * 60 * 1000, 50, "Admin işlemleri için çok fazla istek, lütfen bekleyin.")

const uploadLimiter = createRateLimit(
  60 * 60 * 1000,
  10,
  "Çok fazla dosya yükleme denemesi, lütfen 1 saat sonra tekrar deneyin.",
)

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
      ],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'", "blob:"],
      frameSrc: ["'self'", "https://www.youtube.com", "https://player.vimeo.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
})

module.exports = {
  generalLimiter,
  authLimiter,
  adminLimiter,
  uploadLimiter,
  securityHeaders,
  mongoSanitize,
  xss,
}
