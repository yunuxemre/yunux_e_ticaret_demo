document.addEventListener("DOMContentLoaded", () => {
  const productForm = document.getElementById("productForm")
  const productIdInput = document.getElementById("productId")
  const nameInput = document.getElementById("name")
  const descriptionInput = document.getElementById("description")
  const priceInput = document.getElementById("price")
  const stockInput = document.getElementById("stock")
  const imageInput = document.getElementById("image")
  const videoUrlInput = document.getElementById("videoUrl")
  const clearFormButton = document.getElementById("clearFormButton")
  const productListBody = document.getElementById("productListBody")
  const adminMessageArea = document.getElementById("adminMessageArea")

  const videoUploadArea = document.getElementById("videoUploadArea")
  const videoFile = document.getElementById("videoFile")
  const selectVideoBtn = document.getElementById("selectVideoBtn")
  const uploadProgress = document.getElementById("uploadProgress")
  const videoPreview = document.getElementById("videoPreview")
  const videoSource = document.getElementById("videoSource")
  const removeVideoBtn = document.getElementById("removeVideoBtn")

  let currentVideoUrl = ""

  const API_URL_ADMIN = "/api/admin/products"
  const API_URL_PRODUCTS = "/api/products"
  const API_URL_VIDEO_UPLOAD = "/api/admin/upload-video"

  const getUserInfo = () => {
    const userInfoString = localStorage.getItem("userInfo")
    try {
      const parsedInfo = userInfoString ? JSON.parse(userInfoString) : null
      return parsedInfo
    } catch (e) {
      localStorage.removeItem("userInfo")
      return null
    }
  }

  const checkAdminAuth = () => {
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token) {
      showAdminMessage("Bu işlem için giriş yapmanız gerekmektedir. Lütfen giriş yapın.", "error")
      return null
    }
    if (userInfo.role !== "admin") {
      showAdminMessage("Bu sayfaya veya işleme erişim yetkiniz yok.", "error")
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
    adminMessageArea.className = `message-area message-${type}`
    adminMessageArea.style.display = "block"
    setTimeout(() => {
      adminMessageArea.style.display = "none"
    }, 3500)
  }

  const clearForm = () => {
    if (productForm) productForm.reset()
    if (productIdInput) productIdInput.value = ""
    if (productForm) productForm.querySelector('button[type="submit"]').textContent = "Kaydet"

    currentVideoUrl = ""
    if (videoPreview) videoPreview.style.display = "none"
    if (videoSource) videoSource.src = ""
    if (uploadProgress) uploadProgress.style.display = "none"
  }

  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm)
  }

  if (selectVideoBtn && videoFile) {
    selectVideoBtn.addEventListener("click", () => {
      videoFile.click()
    })
  }

  if (videoUploadArea) {
    videoUploadArea.addEventListener("dragover", (e) => {
      e.preventDefault()
      videoUploadArea.classList.add("dragover")
    })

    videoUploadArea.addEventListener("dragleave", () => {
      videoUploadArea.classList.remove("dragover")
    })

    videoUploadArea.addEventListener("drop", (e) => {
      e.preventDefault()
      videoUploadArea.classList.remove("dragover")

      const files = e.dataTransfer.files
      if (files.length > 0 && files[0].type.startsWith("video/")) {
        handleVideoFile(files[0])
      } else {
        showAdminMessage("Lütfen geçerli bir video dosyası seçin.", "error")
      }
    })
  }

  if (videoFile) {
    videoFile.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        handleVideoFile(file)
      }
    })
  }

  const handleVideoFile = async (file) => {
    if (file.size > 100 * 1024 * 1024) {
      showAdminMessage("Video dosyası 100MB'dan büyük olamaz.", "error")
      return
    }

    const token = checkAdminAuth()
    if (!token) return

    if (uploadProgress) {
      uploadProgress.style.display = "block"
      const progressBar = uploadProgress.querySelector(".progress-bar")
      if (progressBar) progressBar.style.width = "0%"
    }

    try {
      const formData = new FormData()
      formData.append("video", file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          const progressBar = uploadProgress?.querySelector(".progress-bar")
          if (progressBar) {
            progressBar.style.width = percentComplete + "%"
            progressBar.textContent = Math.round(percentComplete) + "%"
          }
        }
      })

      xhr.onload = () => {
        if (uploadProgress) uploadProgress.style.display = "none"

        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          currentVideoUrl = response.videoUrl

          if (videoSource && videoPreview) {
            videoSource.src = response.videoUrl
            videoPreview.style.display = "block"
          }

          if (videoUrlInput) videoUrlInput.value = ""
          showAdminMessage("Video başarıyla yüklendi!", "success")
        } else {
          const errorResponse = JSON.parse(xhr.responseText)
          throw new Error(errorResponse.message || "Video yükleme başarısız")
        }
      }

      xhr.onerror = () => {
        if (uploadProgress) uploadProgress.style.display = "none"
        showAdminMessage("Video yüklenirken bir hata oluştu.", "error")
      }

      xhr.open("POST", API_URL_VIDEO_UPLOAD)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    } catch (error) {
      if (uploadProgress) uploadProgress.style.display = "none"
      showAdminMessage(`Video yükleme hatası: ${error.message}`, "error")
    }
  }

  if (removeVideoBtn) {
    removeVideoBtn.addEventListener("click", () => {
      currentVideoUrl = ""
      if (videoPreview) videoPreview.style.display = "none"
      if (videoSource) videoSource.src = ""
      if (videoFile) videoFile.value = ""
      showAdminMessage("Video kaldırıldı.", "success")
    })
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL_PRODUCTS)
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Sunucu hatası (${response.status})` }))
        throw new Error(errData.message || `Ürünler yüklenemedi (${response.status})`)
      }
      const products = await response.json()
      renderProducts(products)
    } catch (error) {
      if (productListBody)
        productListBody.innerHTML = `<tr><td colspan="6">Ürünler yüklenirken bir hata oluştu.</td></tr>`
      showAdminMessage(`Hata: ${error.message}`, "error")
    }
  }

  const renderProducts = (products) => {
    if (!productListBody) return
    productListBody.innerHTML = ""
    if (!products || products.length === 0) {
      productListBody.innerHTML = `<tr><td colspan="6">Gösterilecek ürün bulunmamaktadır.</td></tr>`
      return
    }
    products.forEach((product) => {
      const row = productListBody.insertRow()

      let videoStatus = '<span class="text-muted">Yok</span>'
      if (product.videoUrl) {
        if (product.videoUrl.includes("youtube.com") || product.videoUrl.includes("youtu.be")) {
          videoStatus = '<span class="text-primary"><i class="fab fa-youtube"></i> YouTube</span>'
        } else {
          videoStatus = '<span class="text-success"><i class="fas fa-video"></i> Yüklendi</span>'
        }
      }

      row.innerHTML = `
                <td><img src="${product.image || "/images/default-product.png"}" alt="${product.name}" style="width:50px; height:50px; object-fit:cover;"></td>
                <td>${product.name}</td>
                <td class="text-end">${(product.price / 100).toFixed(2)}</td>
                <td class="text-center">${product.stock}</td>
                <td class="text-center">${videoStatus}</td>
                <td class="actions text-center">
                    <button class="btn btn-warning btn-sm edit-product" data-id="${product._id}">Düzenle</button>
                    <button class="btn btn-danger btn-sm delete-product" data-id="${product._id}">Sil</button>
                </td>
            `
    })
  }

  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const token = checkAdminAuth()
      if (!token) return

      const id = productIdInput.value

      let finalVideoUrl = ""
      if (currentVideoUrl) {
        finalVideoUrl = currentVideoUrl
      } else if (videoUrlInput && videoUrlInput.value.trim()) {
        finalVideoUrl = videoUrlInput.value.trim()
      }

      const productData = {
        name: nameInput.value,
        description: descriptionInput.value,
        price: Number.parseFloat(priceInput.value),
        stock: Number.parseInt(stockInput.value),
        image: imageInput.value.trim() === "" ? undefined : imageInput.value.trim(),
        videoUrl: finalVideoUrl,
        trendyolLink: document.getElementById("trendyolLink")?.value?.trim() || "",
        category: document.getElementById("category")?.value?.trim() || "",
      }

      const method = id ? "PUT" : "POST"
      const url = id ? `${API_URL_ADMIN}/${id}` : API_URL_ADMIN
      const actionText = id ? "güncellenirken" : "eklenirken"

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        })

        if (!response.ok) {
          const responseData = await response.json().catch(() => ({ message: `Sunucu hatası (${response.status})` }))
          throw new Error(
            responseData.message || `Ürün ${actionText} bir sunucu hatası oluştu (Kod: ${response.status}).`,
          )
        }

        clearForm()
        fetchProducts()
        showAdminMessage(id ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla eklendi!", "success")
      } catch (error) {
        showAdminMessage(`Hata: ${error.message}`, "error")
      }
    })
  }

  if (productListBody) {
    productListBody.addEventListener("click", async (e) => {
      const target = e.target
      const currentProductId = target.dataset.id

      if (target.classList.contains("delete-product")) {
        const token = checkAdminAuth()
        if (!token) return

        if (currentProductId && confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
          try {
            const response = await fetch(`${API_URL_ADMIN}/${currentProductId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) {
              const errorData = await response
                .json()
                .catch(() => ({ message: "Silme işlemi başarısız, sunucu detayı sağlamadı." }))
              throw new Error(errorData.message || "Ürün silinemedi.")
            }
            fetchProducts()
            showAdminMessage("Ürün başarıyla silindi!", "success")
          } catch (error) {
            showAdminMessage(`Hata: ${error.message}`, "error")
          }
        }
      } else if (target.classList.contains("edit-product")) {
        if (currentProductId) {
          try {
            const response = await fetch(`${API_URL_PRODUCTS}/${currentProductId}`)
            if (!response.ok) throw new Error("Düzenlenecek ürün bilgileri alınamadı.")
            const product = await response.json()

            if (productIdInput) productIdInput.value = product._id
            if (nameInput) nameInput.value = product.name
            if (descriptionInput) descriptionInput.value = product.description
            if (priceInput) priceInput.value = (product.price / 100).toFixed(2)
            if (stockInput) stockInput.value = product.stock
            if (imageInput) imageInput.value = product.image || ""

            if (product.videoUrl) {
              if (product.videoUrl.includes("youtube.com") || product.videoUrl.includes("youtu.be")) {
                if (videoUrlInput) videoUrlInput.value = product.videoUrl
                currentVideoUrl = ""
                const youtubeTab = document.getElementById("youtube-tab")
                if (youtubeTab) {
                  const tab = new bootstrap.Tab(youtubeTab)
                  tab.show()
                }
              } else {
                currentVideoUrl = product.videoUrl
                if (videoUrlInput) videoUrlInput.value = ""
                if (videoSource && videoPreview) {
                  videoSource.src = product.videoUrl
                  videoPreview.style.display = "block"
                }
                const uploadTab = document.getElementById("upload-tab")
                if (uploadTab) {
                  const tab = new bootstrap.Tab(uploadTab)
                  tab.show()
                }
              }
            } else {
              if (videoUrlInput) videoUrlInput.value = ""
              currentVideoUrl = ""
              if (videoPreview) videoPreview.style.display = "none"
            }

            const trendyolInput = document.getElementById("trendyolLink")
            const categoryInput = document.getElementById("category")
            if (trendyolInput) trendyolInput.value = product.trendyolLink || ""
            if (categoryInput) categoryInput.value = product.category || ""

            if (productForm) productForm.querySelector('button[type="submit"]').textContent = "Güncelle"

            const addProductSection = document.getElementById("addProductSection")
            if (addProductSection) window.scrollTo({ top: addProductSection.offsetTop - 20, behavior: "smooth" })
            else window.scrollTo({ top: 0, behavior: "smooth" })
          } catch (error) {
            showAdminMessage(`Hata: ${error.message}`, "error")
          }
        }
      }
    })
  }

  const initialToken = checkAdminAuth()
  if (initialToken) {
    fetchProducts()
  }
})
