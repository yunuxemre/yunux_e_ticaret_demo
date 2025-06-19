// 🥒 Tansu Şahal Salamura - Product Detail Script (Standalone Version)
// Bu dosya sunucunuzda doğru MIME type ile servis edilmelidir (application/javascript)

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Product detail script başlatıldı")

  const productDetailContent = document.getElementById("product-detail-content")
  const loadingIndicator = document.getElementById("loadingIndicator")
  const productTabsSection = document.getElementById("productTabsSection")
  const tabProductDescription = document.getElementById("tab-product-description")
  const productVideoSection = document.getElementById("productVideoSection")
  const videoPlayerContainer = document.getElementById("videoPlayerContainer")
  const videoWrapper = document.getElementById("videoWrapper")
  const videoLoading = document.getElementById("videoLoading")

  // Debug: Element kontrolü
  console.log("📋 Element kontrolü:", {
    productDetailContent: !!productDetailContent,
    loadingIndicator: !!loadingIndicator,
    productTabsSection: !!productTabsSection,
    tabProductDescription: !!tabProductDescription,
    productVideoSection: !!productVideoSection,
    videoPlayerContainer: !!videoPlayerContainer,
  })

  const fetchProductDetails = async () => {
    if (!productDetailContent || !loadingIndicator) {
      console.error("❌ Gerekli elementler bulunamadı!")
      return
    }

    loadingIndicator.style.display = "flex"
    if (productTabsSection) productTabsSection.style.display = "none"
    if (productVideoSection) productVideoSection.style.display = "none"

    const params = new URLSearchParams(window.location.search)
    const productId = params.get("id")

    console.log("🔍 URL parametreleri:", {
      fullURL: window.location.href,
      search: window.location.search,
      productId: productId,
    })

    if (!productId) {
      console.warn("⚠️ Ürün ID'si bulunamadı")
      if (loadingIndicator) loadingIndicator.style.display = "none"
      productDetailContent.innerHTML = `
        <div class="alert alert-danger text-center">
          <h4><i class="fas fa-exclamation-triangle me-2"></i>Ürün ID Bulunamadı</h4>
          <p>Lütfen geçerli bir ürün seçin.</p>
          <p class="small text-muted">Mevcut URL: ${window.location.href}</p>
          <a href="/" class="btn btn-primary">Ana Sayfaya Dön</a>
        </div>
      `
      return
    }

    try {
      console.log(`📡 API çağrısı yapılıyor: /api/products/${productId}`)

      const response = await fetch(`/api/products/${productId}`)

      console.log("📨 API yanıtı:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: `Sunucu hatası (${response.status})`,
        }))
        console.error("❌ API hatası:", errorData)
        throw new Error(errorData.message || `Ürün bilgileri alınamadı.`)
      }

      const product = await response.json()
      console.log("✅ Ürün verisi alındı:", product)

      if (product && product._id) {
        document.title = `${product.name || "Ürün"} Detayı - Tansu Şahal Salamura`
        renderProductDetails(product)
      } else {
        console.warn("⚠️ Geçersiz ürün verisi:", product)
        productDetailContent.innerHTML = `
          <div class="alert alert-warning text-center">
            <h4><i class="fas fa-search me-2"></i>Ürün Bulunamadı</h4>
            <p>Aradığınız ürün bulunamadı veya geçersiz ürün verisi.</p>
            <p class="small text-muted">Ürün ID: ${productId}</p>
            <a href="/" class="btn btn-primary">Ana Sayfaya Dön</a>
          </div>
        `
      }
    } catch (error) {
      console.error("💥 Fetch hatası:", error)
      if (loadingIndicator) loadingIndicator.style.display = "none"

      const errorDiv = document.createElement("div")
      errorDiv.className = "col-12 alert alert-danger text-center"
      errorDiv.innerHTML = `
        <h4><i class="fas fa-exclamation-triangle me-2"></i>Ürün Yüklenemedi</h4>
        <p>Ürün bilgileri yüklenirken bir sorun oluştu.</p>
        <p class="small text-muted">Hata: ${error.message}</p>
        <div class="mt-3">
          <button class="btn btn-primary me-2" onclick="location.reload()">
            <i class="fas fa-refresh me-2"></i>Sayfayı Yenile
          </button>
          <a href="/" class="btn btn-secondary">
            <i class="fas fa-home me-2"></i>Ana Sayfa
          </a>
        </div>
      `

      if (productDetailContent) {
        productDetailContent.innerHTML = ""
        productDetailContent.appendChild(errorDiv)
      }
    } finally {
      if (loadingIndicator) loadingIndicator.style.display = "none"
    }
  }

  const renderProductDetails = (product) => {
    console.log("🎨 Ürün detayları render ediliyor:", product.name)

    if (!productDetailContent) return
    productDetailContent.innerHTML = ""

    const imageUrl = product.image || "/images/default-product.png"
    const stockStatusHTML =
      product.stock > 0
        ? `<p class="product-stock-status mb-4">
             <span class="badge bg-success-subtle text-success-emphasis p-2 fs-6 shadow-sm">
               <i class="fas fa-check-circle me-1"></i>Stokta Var (${product.stock} adet)
             </span>
           </p>`
        : `<p class="product-stock-status mb-4">
             <span class="badge bg-danger-subtle text-danger-emphasis p-2 fs-6 shadow-sm">
               <i class="fas fa-times-circle me-1"></i>Stok Tükendi
             </span>
           </p>`

    const purchaseLink = product.purchaseLink || product.trendyolLink || "https://www.shopier.com/tansusahalsalamura"

    // Image column oluştur
    const imageCol = document.createElement("div")
    imageCol.className = "col-lg-7 col-md-6 product-gallery-col text-center mb-4 mb-lg-0"
    imageCol.innerHTML = `
      <img src="${imageUrl}" alt="${product.name}" 
           class="img-fluid main-product-image" 
           id="mainProductImage"
           onerror="this.src='/images/default-product.png'; console.warn('Ürün resmi yüklenemedi:', '${imageUrl}')">
    `
    productDetailContent.appendChild(imageCol)

    // Info column oluştur
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

    // Açıklama güncelle
    if (tabProductDescription) {
      tabProductDescription.innerHTML = product.description
        ? product.description.replace(/\n/g, "<br><br>")
        : "Bu ürün için detaylı bir açıklama bulunmamaktadır."
    }

    // Tabs bölümünü göster
    if (productTabsSection) {
      productTabsSection.style.display = "block"
    }

    // Scroll fonksiyonalitesi ekle
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

    // Video varsa işle
    if (product.videoUrl && productVideoSection && videoPlayerContainer) {
      console.log("🎥 Video bulundu, render ediliyor:", product.videoUrl)
      renderModernVideo(product.videoUrl)
    } else {
      console.log("📹 Video bulunamadı veya video elementleri eksik")
    }

    console.log("✅ Ürün detayları başarıyla render edildi")
  }

  const renderModernVideo = (videoUrl) => {
    console.log("🎬 Video render ediliyor:", videoUrl)

    let videoEmbedUrl = ""
    let isLocalVideo = false

    if (videoUrl.includes("youtube.com/watch?v=")) {
      const videoId = videoUrl.split("v=")[1].split("&")[0]
      videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
      console.log("📺 YouTube video ID:", videoId)
    } else if (videoUrl.includes("youtu.be/")) {
      const videoId = videoUrl.split("youtu.be/")[1].split("?")[0]
      videoEmbedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`
      console.log("📺 YouTube short URL video ID:", videoId)
    } else if (videoUrl.includes("youtube.com/embed/") || videoUrl.includes("player.vimeo.com/video/")) {
      videoEmbedUrl = videoUrl
      console.log("📺 Embed URL kullanılıyor:", videoUrl)
    } else if (videoUrl.startsWith("/videos/")) {
      isLocalVideo = true
      videoEmbedUrl = videoUrl
      console.log("📹 Yerel video:", videoUrl)
    } else {
      console.warn("⚠️ Desteklenmeyen video formatı:", videoUrl)
      return
    }

    if (videoEmbedUrl) {
      if (videoLoading) {
        videoLoading.style.display = "block"
      }

      setTimeout(() => {
        if (isLocalVideo) {
          videoPlayerContainer.innerHTML = `
            <video controls class="custom-video" preload="metadata"
                   onloadstart="console.log('Video yüklenmeye başladı')"
                   oncanplay="console.log('Video oynatılabilir'); hideVideoLoading()"
                   onerror="console.error('Video yüklenemedi:', '${videoEmbedUrl}')">
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
                    onload="console.log('Video iframe yüklendi'); hideVideoLoading()"
                    onerror="console.error('Video iframe yüklenemedi:', '${videoEmbedUrl}')">
            </iframe>
          `
        }

        if (productVideoSection) {
          productVideoSection.style.display = "block"
          console.log("✅ Video bölümü gösterildi")

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

  // Debug: Sayfa yüklenme durumu
  console.log("📄 Sayfa durumu:", {
    readyState: document.readyState,
    URL: window.location.href,
    userAgent: navigator.userAgent,
  })

  // Ürün detaylarını getir
  console.log("🎯 fetchProductDetails çağrılıyor...")
  fetchProductDetails()
})
