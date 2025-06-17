const jwt = require("jsonwebtoken")
const User = require("../models/User")

const protect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select("-password")

      if (!req.user) {
        return res.status(401).json({ message: "Yetkilendirme başarısız, kullanıcı bulunamadı." })
      }
      next()
    } catch (error) {
      console.error("Token doğrulama hatası:".red, error.message)
      return res.status(401).json({ message: "Yetkilendirme başarısız, token geçersiz." })
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Yetkilendirme başarısız, token bulunamadı." })
  }
}

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403).json({ message: "Yetkilendirme başarısız, admin yetkisi gerekli." })
  }
}

module.exports = { protect, admin }
