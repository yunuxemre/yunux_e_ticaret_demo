// --- START OF FILE admin-scripts.js ---

// Bildirim Sistemi
class NotificationSystem {
  constructor() {
    this.container = document.getElementById("notificationContainer")
    this.badge = document.getElementById("notificationBadge")
    this.countElement = document.getElementById("notificationCount")
    this.notifications = []
    this.unreadCount = 0
    this.init()
  }

  init() {
    // Badge tıklama olayı
    if (this.badge) {
      this.badge.addEventListener("click", () => {
        this.clearAllNotifications()
      })
    }
  }

  show(message, type = "success", title = null, duration = 5000) {
    const notification = this.createNotification(message, type, title, duration)
    this.container.appendChild(notification)
    this.notifications.push(notification)

    // Animasyon için kısa gecikme
    setTimeout(() => {
      notification.classList.add("show")
    }, 100)

    // Otomatik kaldırma
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification)
      }, duration)
    }

    this.updateBadge()
    return notification
  }

  createNotification(message, type, title, duration) {
    const notification = document.createElement("div")
    notification.className = `notification-bubble ${type}`

    const icons = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      warning: "fas fa-exclamation-triangle",
      info: "fas fa-info-circle",
    }

    const titles = {
      success: title || "Başarılı",
      error: title || "Hata",
      warning: title || "Uyarı",
      info: title || "Bilgi",
    }

    const now = new Date()
    const timeString = now.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })

    notification.innerHTML = `
      <div class="notification-header">
        <div class="notification-title">
          <i class="${icons[type]}"></i>
          ${titles[type]}
        </div>
        <button class="notification-close" onclick="notificationSystem.removeNotification(this.closest('.notification-bubble'))">
          ×
        </button>
      </div>
      <div class="notification-message">${message}</div>
      <div class="notification-time">${timeString}</div>
      ${duration > 0 ? '<div class="notification-progress"></div>' : ""}
    `

    return notification
  }

  removeNotification(notification) {
    if (!notification || !notification.parentNode) return

    notification.style.transform = "translateX(400px)"
    notification.style.opacity = "0"

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
      const index = this.notifications.indexOf(notification)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
      this.updateBadge()
    }, 400)
  }

  clearAllNotifications() {
    this.notifications.forEach((notification) => {
      this.removeNotification(notification)
    })
    this.unreadCount = 0
    this.updateBadge()
  }

  updateBadge() {
    this.unreadCount = this.notifications.length
    if (this.unreadCount > 0) {
      this.countElement.textContent = this.unreadCount
      this.badge.classList.remove("hidden")
    } else {
      this.badge.classList.add("hidden")
    }
  }

  // Özel bildirim türleri
  success(message, title = null) {
    return this.show(message, "success", title)
  }

  error(message, title = null) {
    return this.show(message, "error", title)
  }

  warning(message, title = null) {
    return this.show(message, "warning", title)
  }

  info(message, title = null) {
    return this.show(message, "info", title)
  }
}

// Global bildirim sistemi
let notificationSystem

document.addEventListener("DOMContentLoaded", () => {
  // Bildirim sistemini başlat
  notificationSystem = new NotificationSystem()

  // --- ELEMENT SEÇİCİLER VE SABİTLER ---
  const productForm = document.getElementById("productForm")
  const productIdInput = document.getElementById("productId")
  const nameInput = document.getElementById("name")
  const descriptionInput = document.getElementById("description")
  const priceInput = document.getElementById("price")
  const stockInput = document.getElementById("stock")
  const imageInput = document.getElementById("image")
  const videoUrlInput = document.getElementById("videoUrl")
  const purchaseLinkInput = document.getElementById("purchaseLink")
  const clearFormButton = document.getElementById("clearFormButton")
  const productListBody = document.getElementById("productListBody")
  const adminMessageArea = document.getElementById("adminMessageArea")

  const API_URL_ADMIN = "/api/admin/products"
  const API_URL_PRODUCTS = "/api/products"

  // --- YARDIMCI FONKSİYONLAR ---

  const getUserInfo = () => {
    try {
      const userInfoString = localStorage.getItem("userInfo")
      return userInfoString ? JSON.parse(userInfoString) : null
    } catch (e) {
      localStorage.removeItem("userInfo")
      return null
    }
  }

  const checkAdminAuth = () => {
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token || userInfo.role !== "admin") {
      notificationSystem.error("Bu sayfaya erişim yetkiniz yok veya giriş yapmanız gerekiyor.", "Yetki Hatası")
      return null
    }
    return userInfo.token
  }

  const showAdminMessage = (message, type = "success") => {
    // Hem eski sistem hem de yeni bildirim sistemi
    if (adminMessageArea) {
      adminMessageArea.textContent = message
      adminMessageArea.className = `message-area alert ${type === "success" ? "alert-success" : "alert-danger"}`
      adminMessageArea.style.display = "block"
      setTimeout(() => {
        adminMessageArea.style.display = "none"
      }, 4000)
    }

    // Yeni bildirim sistemi
    if (type === "success") {
      notificationSystem.success(message)
    } else {
      notificationSystem.error(message)
    }
  }

  const clearForm = () => {
    if (productForm) productForm.reset()
    if (productIdInput) productIdInput.value = ""
    const submitButton = productForm?.querySelector('button[type="submit"]')
    if (submitButton) submitButton.textContent = "Kaydet / Güncelle"

    notificationSystem.info("Form temizlendi", "Form")
  }

  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm)
  }

  const convertYoutubeLink = (url) => {
    if (!url) return ""
    let videoId = null
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0]
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0]
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("/embed/")[1].split("?")[0]
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`
    }
    return url
  }

  if (videoUrlInput) {
    videoUrlInput.addEventListener("input", (e) => {
      setTimeout(() => {
        const currentUrl = e.target.value
        if (currentUrl.includes("youtube") || currentUrl.includes("youtu.be")) {
          const embedUrl = convertYoutubeLink(currentUrl)
          if (embedUrl !== currentUrl) {
            e.target.value = embedUrl
            notificationSystem.info("YouTube linki embed formatına çevrildi.", "Video")
          }
        }
      }, 500)
    })
  }

  // --- API İLE İLGİLİ FONKSİYONLAR ---

  const fetchProducts = async () => {
    try {
      notificationSystem.info("Ürünler yükleniyor...", "Yükleme")
      const response = await fetch(API_URL_PRODUCTS)
      if (!response.ok) throw new Error(`Ürünler yüklenemedi (${response.status})`)
      const products = await response.json()
      renderProducts(products)
      notificationSystem.success(`${products.length} ürün başarıyla yüklendi`, "Yükleme Tamamlandı")
    } catch (error) {
      if (productListBody)
        productListBody.innerHTML = `<tr><td colspan="6" class="text-center">Ürünler yüklenirken bir hata oluştu: ${error.message}</td></tr>`
      notificationSystem.error(`Ürünler yüklenirken hata: ${error.message}`, "Yükleme Hatası")
    }
  }

  const renderProducts = (products) => {
    if (!productListBody) return
    productListBody.innerHTML = ""
    if (!products || products.length === 0) {
      productListBody.innerHTML = `<tr><td colspan="6" class="text-center">Gösterilecek ürün bulunmamaktadır.</td></tr>`
      return
    }
    products.forEach((product) => {
      const displayPrice = (product.price / 100).toFixed(2)
      const row = `
        <tr>
          <td><img src="${product.image || "https://via.placeholder.com/60"}" alt="${product.name}" width="60" class="img-thumbnail"></td>
          <td>${product.name}</td>
          <td class="text-end">${displayPrice} TL</td>
          <td class="text-center">${product.stock}</td>
          <td class="text-center">${product.videoUrl ? '<i class="fas fa-video text-success"></i>' : '<i class="fas fa-video-slash text-muted"></i>'}</td>
          <td class="text-center actions">
            <button class="btn btn-sm btn-info edit-product" data-id="${product._id}"><i class="fas fa-edit"></i> Düzenle</button>
            <button class="btn btn-sm btn-danger delete-product" data-id="${product._id}"><i class="fas fa-trash"></i> Sil</button>
          </td>
        </tr>`
      productListBody.insertAdjacentHTML("beforeend", row)
    })
  }

  // --- ANA EVENT LISTENERS ---

  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const token = checkAdminAuth()
      if (!token) return

      const id = productIdInput.value

      const priceAsFloat = Number.parseFloat(priceInput.value.replace(",", "."))
      if (isNaN(priceAsFloat) || priceAsFloat < 0) {
        notificationSystem.error("Lütfen geçerli ve pozitif bir fiyat girin.", "Fiyat Hatası")
        return
      }

      const purchaseLinkValue = purchaseLinkInput ? purchaseLinkInput.value.trim() : ""
      const finalVideoUrl = convertYoutubeLink(videoUrlInput.value.trim())

      const productData = {
        name: nameInput.value,
        description: descriptionInput.value,
        price: priceAsFloat,
        stock: Number.parseInt(stockInput.value),
        image: imageInput.value.trim() || undefined,
        videoUrl: finalVideoUrl,
        category: document.getElementById("category").value.trim() || "",
        ...(purchaseLinkValue && { purchaseLink: purchaseLinkValue }),
      }

      const method = id ? "PUT" : "POST"
      const url = id ? `${API_URL_ADMIN}/${id}` : API_URL_ADMIN

      // İşlem başlangıcı bildirimi
      const processingNotification = notificationSystem.info(
        id ? "Ürün güncelleniyor..." : "Ürün ekleniyor...",
        "İşlem Devam Ediyor",
      )

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(productData),
        })
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: "Bilinmeyen bir sunucu hatası" }))
          throw new Error(errData.message)
        }

        // İşlem başarılı bildirimi
        notificationSystem.removeNotification(processingNotification)
        notificationSystem.success(
          id ? `"${productData.name}" ürünü başarıyla güncellendi!` : `"${productData.name}" ürünü başarıyla eklendi!`,
          "İşlem Başarılı",
        )

        clearForm()
        fetchProducts()
      } catch (error) {
        notificationSystem.removeNotification(processingNotification)
        notificationSystem.error(`İşlem hatası: ${error.message}`, "Kayıt Hatası")
      }
    })
  }

  if (productListBody) {
    productListBody.addEventListener("click", async (e) => {
      const button = e.target.closest("button")
      if (!button) return

      const token = checkAdminAuth()
      if (!token) return

      const currentProductId = button.dataset.id
      if (!currentProductId) return

      if (button.classList.contains("delete-product")) {
        const productName = button.closest("tr").querySelector("td:nth-child(2)").textContent

        if (confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
          const deletingNotification = notificationSystem.warning(`"${productName}" siliniyor...`, "Silme İşlemi")

          try {
            const response = await fetch(`${API_URL_ADMIN}/${currentProductId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: "Silme işlemi başarısız." }))
              throw new Error(errorData.message)
            }

            notificationSystem.removeNotification(deletingNotification)
            notificationSystem.success(`"${productName}" ürünü başarıyla silindi!`, "Silme Başarılı")
            fetchProducts()
          } catch (error) {
            notificationSystem.removeNotification(deletingNotification)
            notificationSystem.error(`Silme hatası: ${error.message}`, "Silme Hatası")
          }
        }
      } else if (button.classList.contains("edit-product")) {
        const loadingNotification = notificationSystem.info("Ürün bilgileri yükleniyor...", "Düzenleme")

        try {
          const response = await fetch(`${API_URL_PRODUCTS}/${currentProductId}`)
          if (!response.ok) throw new Error("Ürün bilgileri alınamadı.")
          const product = await response.json()

          clearForm()
          productIdInput.value = product._id
          nameInput.value = product.name
          descriptionInput.value = product.description
          priceInput.value = (product.price / 100).toFixed(2)
          stockInput.value = product.stock
          imageInput.value = product.image || ""
          if (purchaseLinkInput) purchaseLinkInput.value = product.purchaseLink || ""
          document.getElementById("category").value = product.category || ""
          videoUrlInput.value = product.videoUrl || ""

          productForm.querySelector('button[type="submit"]').textContent = "Güncelle"

          notificationSystem.removeNotification(loadingNotification)
          notificationSystem.success(`"${product.name}" düzenleme için hazırlandı`, "Düzenleme Hazır")

          // ✅ OTOMATİK KAYDIRMA: Düzenleme formuna git
          document.getElementById("addProductSection").scrollIntoView({ behavior: "smooth" })
        } catch (error) {
          notificationSystem.removeNotification(loadingNotification)
          notificationSystem.error(`Düzenleme hatası: ${error.message}`, "Düzenleme Hatası")
        }
      }
    })
  }

  const initialToken = checkAdminAuth()
  if (initialToken) {
    fetchProducts()
    notificationSystem.success("Admin paneline hoş geldiniz!", "Hoş Geldiniz")
  } else {
    if (productForm) productForm.style.display = "none"
    if (productListBody)
      productListBody.innerHTML = `<tr><td colspan="6" class="text-center">İçeriği görmek için admin olarak giriş yapmalısınız.</td></tr>`
  }

  // Sayfa yüklendiğinde hoş geldin mesajı
  setTimeout(() => {
    if (initialToken) {
      notificationSystem.info("Tüm işlemleriniz gerçek zamanlı olarak bildirilecektir.", "Bildirim Sistemi Aktif")
    }
  }, 2000)
})

// --- END OF FILE admin-scripts.js ---

// Video file selection triggers file input
const selectVideoBtn = document.getElementById("selectVideoBtn")
const videoFileInput = document.getElementById("videoFile")

if (selectVideoBtn && videoFileInput) {
  selectVideoBtn.addEventListener("click", () => {
    videoFileInput.click()
  })
}

// Clear YouTube link if video file is selected
if (videoFileInput) {
  videoFileInput.addEventListener("change", () => {
    const file = videoFileInput.files[0]
    if (file) {
      const youtubeLinkInput = document.getElementById("youtubeLink")
      if (youtubeLinkInput && youtubeLinkInput.value) {
        youtubeLinkInput.value = ""
        if (window.notificationSystem) {
          notificationSystem.warning("YouTube link temizlendi çünkü video dosyası seçildi.", "Video Seçimi")
        }
      }
      const videoPreview = document.getElementById("videoPreview")
      const videoSource = document.getElementById("videoSource")
      if (videoSource && videoPreview) {
        videoSource.src = URL.createObjectURL(file)
        videoPreview.style.display = "block"
        videoPreview.querySelector("video").load()

        if (window.notificationSystem) {
          notificationSystem.success(`"${file.name}" video dosyası seçildi`, "Video Yüklendi")
        }
      }
    }
  })
}

// Show admin message (eski sistem için uyumluluk)
function showAdminMessage(message, type) {
  const adminMessageArea = document.getElementById("adminMessageArea")
  if (!adminMessageArea) {
    alert(`${type === "error" ? "ERROR: " : ""}${message}`)
    return
  }
  adminMessageArea.textContent = message
  adminMessageArea.style.display = "block"
  adminMessageArea.style.backgroundColor = type === "error" ? "red" : "green"
  adminMessageArea.style.color = "white"
  adminMessageArea.style.padding = "10px"
  adminMessageArea.style.position = "fixed"
  adminMessageArea.style.top = "10px"
  adminMessageArea.style.right = "10px"
  adminMessageArea.style.zIndex = "1000"
  setTimeout(() => {
    adminMessageArea.style.display = "none"
  }, 4000)

  // Yeni bildirim sistemi de çalışsın
  if (window.notificationSystem) {
    if (type === "error") {
      notificationSystem.error(message)
    } else {
      notificationSystem.success(message)
    }
  }
}
