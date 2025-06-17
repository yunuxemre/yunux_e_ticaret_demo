const express = require("express")
const router = express.Router()
const User = require("../models/User")
const generateToken = require("../utils/generateToken")
const { protect } = require("../middleware/authMiddleware")

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body

  try {
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "Bu e-posta adresi zaten kayıtlı." })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    })

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      })
    } else {
      res.status(400).json({ message: "Geçersiz kullanıcı verisi." })
    }
  } catch (error) {
    console.error("Kullanıcı kayıt hatası:".red, error)
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      })
    }
    res.status(500).json({ message: "Sunucu hatası." })
  }
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Lütfen e-posta ve şifrenizi girin." })
    }

    const user = await User.findOne({ email }).select("+password")

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      })
    } else {
      res.status(401).json({ message: "Geçersiz e-posta veya şifre." })
    }
  } catch (error) {
    console.error("Kullanıcı giriş hatası:".red, error)
    res.status(500).json({ message: "Sunucu hatası." })
  }
})

router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user._id)
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
  } else {
    res.status(404).json({ message: "Kullanıcı bulunamadı." })
  }
})

module.exports = router
