const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("HATA: MONGODB_URI ortam değişkeni tanımlanmamış!".red.bold)
      process.exit(1)
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Bağlandı: ${conn.connection.host}`.cyan.underline.bold)
  } catch (error) {
    console.error(`MongoDB Bağlantı Hatası: ${error.message}`.red.bold)
    process.exit(1)
  }
}

module.exports = connectDB
