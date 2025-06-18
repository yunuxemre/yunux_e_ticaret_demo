// --- START OF FILE server.js ---

require("dotenv").config()
const colors = require("colors")
const connectDB = require("./config/db")
const Product = require("./models/Product")
const User = require("./models/User")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const cors = require("cors")

const {
  generalLimiter,
  authLimiter,
  adminLimiter,
  uploadLimiter,
  securityHeaders,
  mongoSanitize,
  xss,
} = require("./middleware/security")

const { handleValidationErrors, validateProduct, validateObjectId } = require("./middleware/validation")

const userRoutes = require("./routes/userRoutes")
const { protect, admin } = require("./middleware/authMiddleware")

connectDB().then(() => {
  createAdminUser()
})

const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
    const adminPasswordFromEnv = process.env.ADMIN_PASSWORD
    if (!process.env.ADMIN_EMAIL || !adminPasswordFromEnv) {
      console.warn("UYARI: ADMIN_EMAIL veya ADMIN_PASSWORD .env'de eksik.".yellow.bold)
      return
    }
    const adminExists = await User.findOne({ email: adminEmail })
    if (!adminExists) {
      await User.create({ name: "Admin User", email: adminEmail, password: adminPasswordFromEnv, role: "admin" })
      console.log(`Admin (${adminEmail}) oluşturuldu.`.bgGreen.white)
    } else {
      console.log(`Admin (${adminEmail}) zaten mevcut.`.blue)
    }
  } catch (error) {
    console.error(`Admin oluşturma hatası: ${error.message}`.red.bold)
  }
}

const express = require("express")
const app = express()
const port = process.env.PORT || 10000 // Render için 10000

// CORS ayarları - Render için güncellenmiş
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? true // Aynı domain'den gelen isteklere izin ver
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
}

app.use(securityHeaders)
app.use(cors(corsOptions))
app.use(mongoSanitize())
app.use(xss())

app.use("/api/", generalLimiter)
app.use("/api/users/login", authLimiter)
app.use("/api/users/register", authLimiter)
app.use("/api/admin/", adminLimiter)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Video upload ayarları - Render için düzeltilmiş
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve(__dirname, "../frontend/videos")
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "video-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["video/mp4", "video/avi", "video/mov", "video/wmv", "video/webm"]
    const allowedExts = [".mp4", ".avi", ".mov", ".wmv", ".webm"]
    const fileExt = path.extname(file.originalname).toLowerCase()

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(fileExt)) {
      cb(null, true)
    } else {
      cb(new Error("Sadece video dosyaları yüklenebilir! (MP4, AVI, MOV, WMV, WEBM)"), false)
    }
  },
})

// Frontend static files - Render için düzeltilmiş
const frontendPath = path.resolve(__dirname, "../frontend")
console.log("Frontend path:", frontendPath)

if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath))
  console.log("✅ Frontend klasörü bulundu ve serve ediliyor".green)
} else {
  console.log("❌ Frontend klasörü bulunamadı:".red, frontendPath)
}

// API Routes
app.use("/api/users", userRoutes)

// Video upload endpoint
app.post("/api/admin/upload-video", uploadLimiter, protect, admin, videoUpload.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Video dosyası seçilmedi." })
    }

    const videoUrl = `/videos/${req.file.filename}`
    res.json({
      message: "Video başarıyla yüklendi!",
      videoUrl: videoUrl,
      filename: req.file.filename,
    })
  } catch (error) {
    console.error("Video yükleme hatası:", error)
    res.status(500).json({ message: "Video yüklenirken bir hata oluştu." })
  }
})

// Products API
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find({})
    res.json(products)
  } catch (error) {
    console.error(`GET /api/products HATA: ${error.message}`.red)
    res.status(500).json({ message: "Sunucu: Ürünler getirilemedi." })
  }
})

app.get("/api/products/:id", validateObjectId, handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: "Ürün bulunamadı." })
    }
  } catch (error) {
    console.error(`GET /api/products/:id HATA: ${error.message}`.red)
    res.status(500).json({ message: "Sunucu: Ürün getirilemedi." })
  }
})

app.post("/api/admin/products", protect, admin, validateProduct, handleValidationErrors, async (req, res) => {
  try {
    const { name, price, description, image, stock, videoUrl, purchaseLink, category } = req.body

    const product = new Product({
      name,
      price: Math.round(Number(price) * 100), // ✅ DOĞRU MANTIK: Fiyat burada TL olarak alınıp kuruşa çevriliyor.
      description,
      image: image || "/images/default-product.png",
      stock: Number(stock),
      videoUrl: videoUrl || "",
      purchaseLink: purchaseLink || "",
      category: category || "Genel",
    })
    const createdProduct = await product.save()
    res.status(201).json(createdProduct)
  } catch (error) {
    console.error("Ürün oluşturma hatası:", error)
    res.status(500).json({ message: "Sunucu hatası: Ürün oluşturulamadı.", error: error.message })
  }
})

app.put(
  "/api/admin/products/:id",
  protect,
  admin,
  validateObjectId,
  validateProduct,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, price, description, image, stock, videoUrl, purchaseLink, category } = req.body
      const product = await Product.findById(req.params.id)
      if (product) {
        product.name = name || product.name
        if (price !== undefined) product.price = Math.round(Number(price) * 100) // ✅ DOĞRU MANTIK: Fiyat burada TL olarak alınıp kuruşa çevriliyor.
        product.description = description || product.description
        product.image = image !== undefined ? (image.trim() === "" ? product.image : image.trim()) : product.image
        if (stock !== undefined) product.stock = Number(stock)
        product.videoUrl = videoUrl !== undefined ? (videoUrl.trim() === "" ? "" : videoUrl.trim()) : product.videoUrl
        product.purchaseLink =
          purchaseLink !== undefined ? (purchaseLink.trim() === "" ? "" : purchaseLink.trim()) : product.purchaseLink
        product.purchaseLink =
          req.body.purchaseLink !== undefined
            ? req.body.purchaseLink.trim() === ""
              ? ""
              : req.body.purchaseLink.trim()
            : product.purchaseLink

        const updatedProduct = await product.save()
        res.json(updatedProduct)
      } else {
        res.status(404).json({ message: "Güncellenecek ürün bulunamadı." })
      }
    } catch (error) {
      console.error("Ürün güncelleme hatası:", error)
      res.status(500).json({ message: "Sunucu hatası: Ürün güncellenemedi.", error: error.message })
    }
  },
)

app.delete("/api/admin/products/:id", protect, admin, validateObjectId, handleValidationErrors, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      await product.deleteOne()
      res.json({ message: "Ürün başarıyla silindi." })
    } else {
      res.status(404).json({ message: "Silinecek ürün bulunamadı." })
    }
  } catch (error) {
    console.error("Ürün silme hatası:", error)
    res.status(500).json({ message: "Sunucu hatası: Ürün silinemedi.", error: error.message })
  }
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// Ana sayfa route - Frontend index.html serve et
app.get("/", (req, res) => {
  const indexPath = path.join(frontendPath, "index.html")

  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.json({
      message: "Tansu Şahal Salamura Backend API çalışıyor! 🥒",
      version: "1.0.0",
      status: "OK",
      endpoints: {
        products: "/api/products",
        users: "/api/users/login",
        admin: "/api/admin/products",
        health: "/health",
      },
      frontendPath: frontendPath,
      indexExists: fs.existsSync(indexPath),
    })
  }
})

// Catch-all route for SPA
app.get("*", (req, res) => {
  // API route'ları için 404
  if (req.path.startsWith("/api")) {
    return res.status(404).json({
      message: "API endpoint bulunamadı",
      path: req.path,
    })
  }

  // Frontend için index.html serve et
  const indexPath = path.join(frontendPath, "index.html")
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tansu Şahal Salamura</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .container { max-width: 600px; margin: 0 auto; }
          .error { color: #dc3545; }
          .success { color: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🥒 Tansu Şahal Salamura</h1>
          <p class="error">Frontend dosyaları bulunamadı</p>
          <p>Backend API çalışıyor</p>
          <div>
            <a href="/api/products">Ürünleri Görüntüle</a> | 
            <a href="/health">Health Check</a>
          </div>
        </div>
      </body>
      </html>
    `)
  }
})

// Error handler
app.use((error, req, res, next) => {
  console.error("Global Error Handler:", error)

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Dosya boyutu çok büyük (Max: 100MB)" })
    }
  }

  res.status(500).json({
    message: process.env.NODE_ENV === "production" ? "Sunucu hatası oluştu" : error.message,
  })
})

// Server başlat
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Sunucu http://localhost:${port} adresinde çalışıyor`.yellow)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`.blue)
  console.log("🔒 Güvenlik Önlemleri Aktif".green.bold)

  // Environment variables kontrol
  if (!process.env.JWT_SECRET) {
    console.warn("⚠️  UYARI: JWT_SECRET .env'de eksik!".red.bold)
  }
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn("⚠️  UYARI: ADMIN_EMAIL/PASSWORD .env'de eksik.".yellow.bold)
  }
  if (!process.env.MONGODB_URI) {
    console.warn("⚠️  UYARI: MONGODB_URI .env'de eksik!".red.bold)
  }
})

// --- END OF FILE server.js ---
