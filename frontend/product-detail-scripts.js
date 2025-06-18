document.addEventListener("DOMContentLoaded", async () => {
  const productDetailContent = document.getElementById("product-detail-content")
  const loadingIndicator = document.getElementById("loadingIndicator")
  const productTabsSection = document.getElementById("productTabsSection")
  const tabProductDescription = document.getElementById("tab-product-description")
  const productVideoSection = document.getElementById("productVideoSection")
  const videoPlayerContainer = document.getElementById("videoPlayerContainer")
  const videoWrapper = document.getElementById("videoWrapper")
  const videoLoading = document.getElementById("videoLoading")

  const fetchProductDetails = async () => {
    if (!productDetailContent || !loadingIndicator) return

    loadingIndicator.style.display = "flex"
    if (productTabsSection) productTabsSection.style.display = "none"
    if (productVideoSection) productVideoSection.style.display = "none"

    const params = new URLSearchParams(window.location.search)
    const productId = params.get("id")

    if (!productId) {
      if (loadingIndicator) loadingIndicator.style.display = "none"
      productDetailContent.innerHTML =
        '<div class="alert alert-danger text-center">Ürün ID\'si bulunamadı. Lütfen geçerli bir ürün seçin.</div>'
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Sunucu hatası (${response.status})` }))
        throw new Error(errorData.message || `Ürün bilgileri alınamadı.`)
      }

      const product = await response.json()

      if (product && product._id) {
        document.title = `${product.name || "Ürün"} Detayı - MARKA ADINIZ`
        renderProductDetails(product)
      } else {
        productDetailContent.innerHTML =
          '<div class="alert alert-warning text-center">Ürün bulunamadı veya geçersiz ürün verisi.</div>'
      }
    } catch (error) {
      if (loadingIndicator) loadingIndicator.style.display = "none"
      const errorDiv = document.createElement("div")
      errorDiv.className = "col-12 alert alert-danger text-center"
      errorDiv.textContent = "Ürün bilgileri yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin."
      if (productDetailContent) {
        productDetailContent.innerHTML = ""
        productDetailContent.appendChild(errorDiv)
      }
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = "none"
    }
  }

  const renderProductDetails = (product) => {
    if (!productDetailContent) return
    productDetailContent.innerHTML = ""

    const imageUrl = product.image || "/images/default-product.png"
    const stockStatusHTML =
      product.stock > 0
        ? `<p class="product-stock-status mb-4">
             <span class="badge bg-success-subtle text-success-emphasis p-2 fs-6 shadow-sm">
               <i class="fas fa-check-circle me-1"></i>Stokta Var
             </span>
           </p>`
        : `<p class="product-stock-status mb-4">
             <span class="badge bg-danger-subtle text-danger-emphasis p-2 fs-6 shadow-sm">
               <i class="fas fa-times-circle me-1"></i>Stok Tükendi
             </span>
           </p>`

    const purchaseLink = product.purchaseLink || "https://www.shopier.com/tansusahalsalamura?fbclid=PAZXh0bgNhZW0CMTEAAacBvI7-Wr0j9KJw2YfgFOzJRt3a4boCj5kG2sQEGjMuBBcGxDrqdz_lHng5ig_aem_-hd3SXrVz4kSBkCwAr40ag"

    const imageCol = document.createElement("div")
    imageCol.className = "col-lg-7 col-md-6 product-gallery-col text-center mb-4 mb-lg-0"
    imageCol.innerHTML = `
      <img src="${imageUrl}" alt="${product.name}" 
           class="img-fluid main-product-image" 
           id="mainProductImage">
    `
    productDetailContent.appendChild(imageCol)

    const infoCol = document.createElement("div")
    infoCol.className = "col-lg-5 col-md-6 product-info-col ps-lg-4"
    infoCol.innerHTML = `
      <span class="product-brand d-block mb-2">${product.category || "ÜRÜN KATEGORİSİ"}</span>
      <h1 class="product-title mb-3" id="productName">${product.name}</h1>
      <p class="product-price-display mb-3" id="productPrice">${(product.price / 100).toFixed(2)} TL</p>
      ${stockStatusHTML}
      
      <a href="${purchaseLink}" target="_blank" class="btn btn-trendyol btn-lg rounded-pill w-100 shadow-sm mb-3">
        <i class="fas fa-shopping-cart me-2"></i>Shopier'da Satın Al
      </a>
      
      <p class="text-muted small mt-3 text-center">Bu ürünü güvenle Shopier mağazamızdan satın alabilirsiniz.</p>

      <div class="scroll-to-description-area mt-4 pt-3">
        <p class="text-muted mb-2 small">Ürün hakkında daha fazla bilgi için:</p>
        <a href="#productTabsSection" class="btn btn-outline-secondary rounded-pill btn-view-description">
          <i class="fas fa-arrow-down me-2"></i>Detaylı Açıklamayı Gör
        </a>
      </div>
    `
    productDetailContent.appendChild(infoCol)

    if (tabProductDescription) {
      tabProductDescription.innerHTML = product.description
        ? product.description.replace(/\n/g, "<br><br>")
        : "Bu ürün için detaylı bir açıklama bulunmamaktadır."
    }

    if (productTabsSection) {
      productTabsSection.style.display = "block"
    }

    const viewDescriptionButton = infoCol.querySelector(".btn-view-description")
    if (viewDescriptionButton && productTabsSection) {
      viewDescriptionButton.addEventListener("click", (e) => {
        e.preventDefault()
        productTabsSection.scrollIntoView({ behavior: "smooth", block: "start" })
        const descriptionTabButton = document.getElementById("description-tab-button")
        if (descriptionTabButton) {
          try {
            const tab = new bootstrap.Tab(descriptionTabButton)
            tab.show()
          } catch (tabError) {
            console.warn("Bootstrap Tab API hatası:", tabError)
          }
        }
      })
    }

    if (product.videoUrl && productVideoSection && videoPlayerContainer) {
      renderModernVideo(product.videoUrl)
    }
  }

  const renderModernVideo = (videoUrl) => {
    let videoEmbedUrl = ""
    let isLocalVideo = false

    if (videoUrl.includes("youtube.com/watch?v=")) {
      const videoId = videoUrl.split("v=")[1].split("&")[0]
      videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
    } else if (videoUrl.includes("youtu.be/")) {
      const videoId = videoUrl.split("youtu.be/")[1].split("?")[0]
      videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
    } else if (videoUrl.includes("youtube.com/embed/") || videoUrl.includes("player.vimeo.com/video/")) {
      videoEmbedUrl = videoUrl
    } else if (videoUrl.startsWith("/videos/")) {
      isLocalVideo = true
      videoEmbedUrl = videoUrl
    }

    if (videoEmbedUrl) {
      if (videoLoading) {
        videoLoading.style.display = "block"
      }

      setTimeout(() => {
        if (isLocalVideo) {
          videoPlayerContainer.innerHTML = `
            <video controls class="custom-video" preload="metadata" 
                   onloadstart="hideVideoLoading()" 
                   oncanplay="hideVideoLoading()">
              <source src="${videoEmbedUrl}" type="video/mp4">
              <source src="${videoEmbedUrl}" type="video/webm">
              <source src="${videoEmbedUrl}" type="video/ogg">
              Tarayıcınız video oynatmayı desteklemiyor.
            </video>
          `
        } else {
          videoPlayerContainer.innerHTML = `
            <iframe src="${videoEmbedUrl}" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; picture-in-picture" 
                    allowfullscreen 
                    title="Ürün Videosu"
                    onload="hideVideoLoading()">
            </iframe>
          `
        }

        if (productVideoSection) {
          productVideoSection.style.display = "block"

          setTimeout(() => {
            productVideoSection.scrollIntoView({
              behavior: "smooth",
              block: "center",
            })
          }, 500)
        }

        setTimeout(() => {
          if (videoLoading) {
            videoLoading.style.display = "none"
          }
        }, 1000)
      }, 300)
    }
  }

  window.hideVideoLoading = () => {
    const videoLoading = document.getElementById("videoLoading")
    if (videoLoading) {
      videoLoading.style.display = "none"
    }
  }

  fetchProductDetails()
})
