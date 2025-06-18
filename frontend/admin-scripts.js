// --- START OF FILE admin-scripts.js ---

document.addEventListener("DOMContentLoaded", () => {
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

  // Video upload elementleri
  const videoFileInput = document.getElementById("videoFile")
  const selectVideoBtn = document.getElementById("selectVideoBtn")
  const removeVideoBtn = document.getElementById("removeVideoBtn")
  const videoPreview = document.getElementById("videoPreview")
  const videoSource = document.getElementById("videoSource")
  const uploadProgress = document.getElementById("uploadProgress")

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
      showAdminMessage("Bu sayfaya erişim yetkiniz yok veya giriş yapmanız gerekiyor.", "error")
      return null
    }
    return userInfo.token
  }

  const showAdminMessage = (message, type = "success") => {
    if (!adminMessageArea) {
      alert(`${type === "error" ? "HATA: " : ""}${message}`)
      return
    }
    adminMessageArea.textContent = message
    adminMessageArea.className = `message-area alert ${type === "success" ? "alert-success" : "alert-danger"}`
    adminMessageArea.style.display = "block"
    setTimeout(() => {
      adminMessageArea.style.display = "none"
    }, 4000)
  }

  const clearForm = () => {
    if (productForm) productForm.reset()
    if (productIdInput) productIdInput.value = ""
    if (videoPreview) videoPreview.style.display = "none"
    if (videoFileInput) videoFileInput.value = ""
    const submitButton = productForm?.querySelector('button[type="submit"]')
    if (submitButton) submitButton.textContent = "Kaydet / Güncelle"
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
            showAdminMessage("YouTube linki embed formatına çevrildi.", "success")
          }
        }
      }, 500)
    })
  }

  // --- VIDEO UPLOAD FONKSİYONLARI ---

  // Video dosyası seçme butonu
  if (selectVideoBtn && videoFileInput) {
    selectVideoBtn.addEventListener("click", () => {
      videoFileInput.click()
    })
  }

  // Video dosyası seçildiğinde
  if (videoFileInput) {
    videoFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0]
      if (!file) return

      const token = checkAdminAuth()
      if (!token) return

      // Upload sekmesine geç
      const uploadTab = document.getElementById("upload-tab")
      if (uploadTab && !uploadTab.classList.contains("active")) {
        const tab = new bootstrap.Tab(uploadTab)
        tab.show()
      }

      // YouTube URL'sini temizle
      const currentVideoUrl = videoUrlInput?.value?.trim() || ""
      if (currentVideoUrl.includes("youtube")) {
        videoUrlInput.value = ""
      }

      // Upload progress göster
      if (uploadProgress) {
        uploadProgress.style.display = "block"
      }

      try {
        const formData = new FormData()
        formData.append("video", file)

        const response = await fetch("/api/admin/upload-video", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Video yükleme başarısız" }))
          throw new Error(errorData.message)
        }

        const result = await response.json()

        // Video URL'sini set et
        if (videoUrlInput) {
          videoUrlInput.value = result.videoUrl
        }

        // Video preview göster
        if (videoPreview && videoSource) {
          videoSource.src = result.videoUrl
          videoPreview.style.display = "block"
          const video = videoPreview.querySelector("video")
          if (video) video.load()
        }

        showAdminMessage("Video başarıyla yüklendi!", "success")
      } catch (error) {
        showAdminMessage(`Video yükleme hatası: ${error.message}`, "error")
        videoFileInput.value = ""
      } finally {
        if (uploadProgress) {
          uploadProgress.style.display = "none"
        }
      }
    })
  }

  // Video kaldırma butonu
  if (removeVideoBtn) {
    removeVideoBtn.addEventListener("click", () => {
      if (videoUrlInput) videoUrlInput.value = ""
      if (videoFileInput) videoFileInput.value = ""

      if (videoPreview) {
        videoPreview.style.display = "none"
      }

      showAdminMessage("Video kaldırıldı", "success")
    })
  }

  // Video tab değişikliği - DÜZELTİLMİŞ VERSİYON
  const videoTabs = document.querySelectorAll('#videoTabs button[data-bs-toggle="tab"]')
  videoTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      const targetTab = e.target.id
      const videoUrlValue = videoUrlInput?.value?.trim() || ""

      // Sadece gerçekten çakışma varsa uyar
      if (targetTab === "upload-tab" && videoUrlValue.includes("youtube")) {
        if (confirm("Video dosyası yüklemek için YouTube linkini temizlemek gerekiyor. Devam etmek istiyor musunuz?")) {
          videoUrlInput.value = ""
          showAdminMessage("YouTube linki temizlendi", "success")
        } else {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      } else if (targetTab === "youtube-tab" && videoUrlValue.startsWith("/videos/")) {
        if (confirm("YouTube linki eklemek için video dosyasını temizlemek gerekiyor. Devam etmek istiyor musunuz?")) {
          videoUrlInput.value = ""
          if (videoFileInput) videoFileInput.value = ""
          if (videoPreview) videoPreview.style.display = "none"
          showAdminMessage("Video dosyası temizlendi", "success")
        } else {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    })
  })

  // --- API İLE İLGİLİ FONKSİYONLAR ---

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL_PRODUCTS)
      if (!response.ok) throw new Error(`Ürünler yüklenemedi (${response.status})`)
      const products = await response.json()
      renderProducts(products)
    } catch (error) {
      if (productListBody)
        productListBody.innerHTML = `<tr><td colspan="6" class="text-center">Ürünler yüklenirken bir hata oluştu: ${error.message}</td></tr>`
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

  // --- FORM VALİDASYON FONKSİYONU ---
  const validateForm = () => {
    // Temel alanları kontrol et
    if (!nameInput.value.trim()) {
      showAdminMessage("Ürün adı gereklidir.", "error")
      nameInput.focus()
      return false
    }

    if (!descriptionInput.value.trim()) {
      showAdminMessage("Ürün açıklaması gereklidir.", "error")
      descriptionInput.focus()
      return false
    }

    const price = Number.parseFloat(priceInput.value.replace(",", "."))
    if (isNaN(price) || price < 0) {
      showAdminMessage("Lütfen geçerli ve pozitif bir fiyat girin.", "error")
      priceInput.focus()
      return false
    }

    const stock = Number.parseInt(stockInput.value)
    if (isNaN(stock) || stock < 0) {
      showAdminMessage("Lütfen geçerli bir stok adedi girin.", "error")
      stockInput.focus()
      return false
    }

    // Video URL kontrolü (opsiyonel ama dolu ise geçerli olmalı)
    if (videoUrlInput.value.trim()) {
      const videoUrl = videoUrlInput.value.trim()
      if (!videoUrl.startsWith("http")) {
        showAdminMessage("Video URL'si http:// veya https:// ile başlamalıdır.", "error")
        // YouTube sekmesini aktif et
        const youtubeTab = document.getElementById("youtube-tab")
        if (youtubeTab) {
          const tab = new bootstrap.Tab(youtubeTab)
          tab.show()
        }
        setTimeout(() => videoUrlInput.focus(), 100)
        return false
      }
    }

    return true
  }

  // --- ANA EVENT LISTENERS ---

  // Form submit - Video URL validation eklentisi
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      // Mevcut validation'a ek olarak video URL kontrolü
      const videoUrl = videoUrlInput?.value?.trim() || ""
      if (videoUrl) {
        // Video URL'sinin geçerli olduğunu kontrol et
        const isYouTube = videoUrl.includes("youtube") || videoUrl.includes("youtu.be")
        const isUploadedVideo = videoUrl.startsWith("/videos/")
        const isValidUrl = /^https?:\/\/.+/.test(videoUrl)

        if (!isYouTube && !isUploadedVideo && !isValidUrl) {
          showAdminMessage("Geçerli bir video URL'si giriniz (YouTube linki veya yüklenen video)", "error")
          return
        }
      }

      const token = checkAdminAuth()
      if (!token) return

      const id = productIdInput.value
      const priceAsFloat = Number.parseFloat(priceInput.value.replace(",", "."))
      const purchaseLinkValue = purchaseLinkInput ? purchaseLinkInput.value.trim() : ""
      const finalVideoUrl = videoUrlInput.value.trim()

      const productData = {
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        price: priceAsFloat,
        stock: Number.parseInt(stockInput.value),
        image: imageInput.value.trim() || undefined,
        videoUrl: finalVideoUrl,
        category: document.getElementById("category").value.trim() || "",
        ...(purchaseLinkValue && { purchaseLink: purchaseLinkValue }),
      }

      const method = id ? "PUT" : "POST"
      const url = id ? `${API_URL_ADMIN}/${id}` : API_URL_ADMIN
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
        showAdminMessage(id ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla eklendi!", "success")
        clearForm()
        fetchProducts()
      } catch (error) {
        showAdminMessage(`Hata: ${error.message}`, "error")
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
        if (confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
          try {
            const response = await fetch(`${API_URL_ADMIN}/${currentProductId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: "Silme işlemi başarısız." }))
              throw new Error(errorData.message)
            }
            showAdminMessage("Ürün başarıyla silindi!", "success")
            fetchProducts()
          } catch (error) {
            showAdminMessage(`Hata: ${error.message}`, "error")
          }
        }
      } else if (button.classList.contains("edit-product")) {
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

          // Video preview ayarla
          if (product.videoUrl) {
            // Event listener'ları geçici olarak devre dışı bırak
            const isEditMode = true

            if (product.videoUrl.includes("youtube")) {
              // YouTube sekmesini aktif et
              const youtubeTab = document.getElementById("youtube-tab")
              const youtubeContent = document.getElementById("youtube-content")
              const uploadContent = document.getElementById("upload-content")

              if (youtubeTab && youtubeContent && uploadContent) {
                // Manuel olarak sekmeleri değiştir
                document.querySelectorAll("#videoTabs .nav-link").forEach((tab) => tab.classList.remove("active"))
                document.querySelectorAll("#videoTabContent .tab-pane").forEach((pane) => {
                  pane.classList.remove("show", "active")
                })

                youtubeTab.classList.add("active")
                youtubeContent.classList.add("show", "active")
              }
            } else if (product.videoUrl.includes("/videos/")) {
              // Upload sekmesini aktif et
              const uploadTab = document.getElementById("upload-tab")
              const youtubeContent = document.getElementById("youtube-content")
              const uploadContent = document.getElementById("upload-content")

              if (uploadTab && youtubeContent && uploadContent) {
                // Manuel olarak sekmeleri değiştir
                document.querySelectorAll("#videoTabs .nav-link").forEach((tab) => tab.classList.remove("active"))
                document.querySelectorAll("#videoTabContent .tab-pane").forEach((pane) => {
                  pane.classList.remove("show", "active")
                })

                uploadTab.classList.add("active")
                uploadContent.classList.add("show", "active")

                // Video preview göster
                if (videoPreview && videoSource) {
                  videoSource.src = product.videoUrl
                  videoPreview.style.display = "block"
                  const video = videoPreview.querySelector("video")
                  if (video) video.load()
                }
              }
            }
          }

          productForm.querySelector('button[type="submit"]').textContent = "Güncelle"

          // ✅ OTOMATİK KAYDIRMA: Düzenleme formuna git
          document.getElementById("addProductSection").scrollIntoView({ behavior: "smooth" })
        } catch (error) {
          showAdminMessage(`Hata: ${error.message}`, "error")
        }
      }
    })
  }

  const initialToken = checkAdminAuth()
  if (initialToken) {
    fetchProducts()
  } else {
    if (productForm) productForm.style.display = "none"
    if (productListBody)
      productListBody.innerHTML = `<tr><td colspan="6" class="text-center">İçeriği görmek için admin olarak giriş yapmalısınız.</td></tr>`
  }
})

// --- END OF FILE admin-scripts.js ---
