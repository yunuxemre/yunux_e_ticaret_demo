const { body, param, validationResult } = require("express-validator")

const validateProduct = [
  body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Ürün adı 2-100 karakter arasında olmalıdır"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Açıklama 10-1000 karakter arasında olmalıdır"),
  body("price").isFloat({ min: 0, max: 999999 }).withMessage("Fiyat 0-999999 arasında olmalıdır"),
  body("stock").isInt({ min: 0, max: 99999 }).withMessage("Stok 0-99999 arasında olmalıdır"),
  body("image").optional().isURL().withMessage("Geçerli bir resim URL'si giriniz"),

  // ✅ Boş string'leri de kabul eden custom validation
  body("videoUrl")
    .optional()
    .custom((value) => {
      if (value === "" || value === null || value === undefined) {
        return true // Boş değerleri kabul et
      }
      // Boş değilse URL validation yap
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(value)) {
        throw new Error("Geçerli bir video URL'si giriniz")
      }
      return true
    }),

  body("trendyolLink")
    .optional()
    .custom((value) => {
      if (value === "" || value === null || value === undefined) {
        return true // Boş değerleri kabul et
      }
      // Boş değilse URL validation yap
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(value)) {
        throw new Error("Geçerli bir Trendyol linki giriniz")
      }
      return true
    }),

  body("purchaseLink")
    .optional()
    .custom((value) => {
      if (value === "" || value === null || value === undefined) {
        return true // Boş değerleri kabul et
      }
      // Boş değilse URL validation yap
      const urlRegex = /^https?:\/\/.+/
      if (!urlRegex.test(value)) {
        throw new Error("Geçerli bir satın alma linki giriniz")
      }
      return true
    }),

  body("category").optional().trim().isLength({ max: 50 }).withMessage("Kategori maksimum 50 karakter olabilir"),
]

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Geçersiz veri girişi",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    })
  }
  next()
}

const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("İsim 2-50 karakter arasında olmalıdır")
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/)
    .withMessage("İsim sadece harf içerebilir"),

  body("email").isEmail().normalizeEmail().withMessage("Geçerli bir e-posta adresi giriniz"),

  body("password")
    .isLength({ min: 6, max: 128 })
    .withMessage("Şifre 6-128 karakter arasında olmalıdır")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Şifre en az 1 küçük harf, 1 büyük harf ve 1 rakam içermelidir"),
]

const validateUserLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Geçerli bir e-posta adresi giriniz"),
  body("password").notEmpty().withMessage("Şifre gereklidir"),
]

const validateObjectId = [param("id").isMongoId().withMessage("Geçersiz ID formatı")]

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateObjectId,
}
