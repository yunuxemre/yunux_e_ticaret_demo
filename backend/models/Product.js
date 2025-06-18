const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Ürün adı zorunludur."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Ürün açıklaması zorunludur."],
    },
    price: {
      type: Number,
      required: [true, "Ürün fiyatı zorunludur."],
      min: [0, "Fiyat negatif olamaz."],
    },
    image: {
      type: String,
      default: "/images/default-product.png",
    },
    stock: {
      type: Number,
      required: [true, "Stok miktarı zorunludur."],
      default: 0,
      min: [0, "Stok negatif olamaz."],
    },
    videoUrl: {
      type: String,
      default: "",
    },
    purchaseLink: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      trim: true,
      default: "Genel",
    },
  },
  {
    timestamps: true,
  },
)

const Product = mongoose.model("Product", productSchema)

module.exports = Product
