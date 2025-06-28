document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:5000/api"
  const favoritesItemsList = document.getElementById("favorites-items-list")
  const favoritesItemCountElement = document.getElementById("favorites-item-count")
  const emptyFavoritesMessage = document.querySelector(".empty-favorites-message")
  const favoritesSummary = document.querySelector(".favorites-summary")
  const clearFavoritesButton = document.querySelector(".clear-favorites-button")
  const favoritesTotalCountElement = document.getElementById("favorites-total-count")
  const favoritesTotalCountSummaryElement = document.getElementById("favorites-total-count-summary")

  // LocalStorage'dan favorileri al (mevcut format)
  const getFavorites = () => {
    const favoritesString = localStorage.getItem("userFavorites")
    try {
      const favorites = favoritesString ? JSON.parse(favoritesString) : []
      return Array.isArray(favorites) ? favorites : []
    } catch (e) {
      console.error("Favoriler okunurken hata:", e)
      return []
    }
  }

  // Database'den güncel ürün bilgilerini çek
  const fetchUpdatedProductInfo = async (favoriteProducts) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`)
      if (!response.ok) {
        console.warn("API'den ürünler çekilemedi, localStorage verileri kullanılıyor")
        return favoriteProducts // API çalışmıyorsa localStorage'daki verileri kullan
      }

      const allProducts = await response.json()

      // Favori ürünleri güncel bilgilerle güncelle
      return favoriteProducts.map((favoriteItem) => {
        const updatedProduct = allProducts.find((p) => p._id === favoriteItem._id)
        if (updatedProduct) {
          // Güncel bilgileri localStorage'daki bilgilerle birleştir
          return {
            ...favoriteItem, // localStorage'daki mevcut bilgiler
            ...updatedProduct, // Database'den güncel bilgiler
          }
        }
        return favoriteItem // Güncel bilgi bulunamazsa mevcut bilgiyi kullan
      })
    } catch (error) {
      console.error("Ürün bilgileri güncellenirken hata:", error)
      return favoriteProducts // Hata durumunda localStorage'daki verileri kullan
    }
  }

  const saveFavorites = (favorites) => {
    localStorage.setItem("userFavorites", JSON.stringify(favorites))
    updateFavoritesCount()
    displayFavoriteItems()
  }

  const updateFavoritesCount = () => {
    const favorites = getFavorites()
    const totalItems = favorites.length

    if (favoritesItemCountElement) favoritesItemCountElement.textContent = totalItems
    if (favoritesTotalCountElement) favoritesTotalCountElement.textContent = totalItems
    if (favoritesTotalCountSummaryElement) favoritesTotalCountSummaryElement.textContent = totalItems

    if (favoritesSummary && emptyFavoritesMessage) {
      if (totalItems > 0) {
        favoritesSummary.style.display = "block"
        emptyFavoritesMessage.style.display = "none"
      } else {
        favoritesSummary.style.display = "none"
        emptyFavoritesMessage.style.display = "block"
      }
    }
  }

  const removeFromFavorites = (productId) => {
    let favorites = getFavorites()
    favorites = favorites.filter((item) => item._id !== productId)
    saveFavorites(favorites)
  }

  const createFavoriteCard = (item) => {
    // Fiyatı 100'e böl çünkü server'da 100 ile çarpılmış olarak geliyor
    const price = Number(item.price) / 100
    if (isNaN(price)) return null

    // Shopier linki varsa onu kullan, yoksa Trendyol linkini kullan
    const purchaseLink =
      item.purchaseLink || item.trendyolLink || "https://www.trendyol.com/magaza/tansusahalsalamura-m-1013741?sst=0"
    const purchaseLinkText = item.purchaseLink ? "Shopier'dan Al" : "Trendyol'dan Al"
    const purchaseIcon = item.purchaseLink ? "fas fa-shopping-bag" : "fas fa-shopping-cart"

    const favoriteItemDiv = document.createElement("div")
    favoriteItemDiv.classList.add("col-md-6", "col-lg-4", "mb-4")
    favoriteItemDiv.innerHTML = `
      <div class="card h-100 favorite-card-modern shadow-sm border-0" style="border-radius: 1rem; overflow: hidden; transition: all 0.3s ease;">
        <div class="position-relative">
          <img src="${item.image || "/images/default-product.png"}" 
               class="card-img-top" 
               alt="${item.name || "Ürün"}"
               style="height: 200px; object-fit: cover; transition: transform 0.3s ease;"
               onerror="this.src='/images/default-product.png'">
          <button class="btn btn-danger position-absolute top-0 end-0 m-2 rounded-circle p-2 remove-favorite-button" 
                  data-id="${item._id}" 
                  title="Favorilerden Kaldır"
                  style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-heart"></i>
          </button>
          ${
            item.stock > 0
              ? '<span class="badge bg-success position-absolute bottom-0 start-0 m-2"><i class="fas fa-check-circle me-1"></i>Stokta</span>'
              : '<span class="badge bg-danger position-absolute bottom-0 start-0 m-2"><i class="fas fa-times-circle me-1"></i>Tükendi</span>'
          }
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title fw-bold text-dark mb-2" style="min-height: 2.5rem; line-height: 1.3;">
            ${item.name || "İsimsiz"}
          </h5>
          <p class="card-text text-muted small mb-2" style="min-height: 3rem; line-height: 1.4;">
            ${(item.description || "").substring(0, 100)}${(item.description || "").length > 100 ? "..." : ""}
          </p>
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="badge bg-light text-dark">
              <i class="fas fa-tag me-1"></i>${item.category || "Genel"}
            </span>
            <span class="fw-bold text-success fs-5">₺${price.toFixed(2)}</span>
          </div>
          <div class="mt-auto">
            <div class="d-grid gap-2">
              <a href="product-detail.html?id=${item._id}" 
                 class="btn btn-outline-primary btn-sm">
                <i class="fas fa-eye me-1"></i>Detayları Gör
              </a>
              <a href="${purchaseLink}" 
                 target="_blank" 
                 class="btn ${item.purchaseLink ? "btn-success" : "btn-warning"} btn-sm">
                <i class="${purchaseIcon} me-1"></i>${purchaseLinkText}
              </a>
            </div>
          </div>
        </div>
      </div>
    `
    return favoriteItemDiv
  }

  const displayFavoriteItems = async () => {
    const favorites = getFavorites()

    if (!favoritesItemsList) return

    console.log("Favoriler:", favorites) // Debug için

    if (favorites.length === 0) {
      favoritesItemsList.innerHTML = ""
      updateFavoritesCount()
      return
    }

    // Loading göster
    favoritesItemsList.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Yükleniyor...</span>
        </div>
        <p class="mt-3 text-muted">Favorileriniz yükleniyor...</p>
      </div>
    `

    try {
      // Database'den güncel bilgileri çekmeye çalış
      const updatedFavorites = await fetchUpdatedProductInfo(favorites)

      favoritesItemsList.innerHTML = ""

      // Bootstrap row container oluştur
      const rowContainer = document.createElement("div")
      rowContainer.classList.add("row")

      updatedFavorites.forEach((item) => {
        const favoriteCard = createFavoriteCard(item)
        if (favoriteCard) {
          rowContainer.appendChild(favoriteCard)

          // Event listener ekle
          favoriteCard.querySelector(".remove-favorite-button").addEventListener("click", () => {
            if (confirm(`${item.name || "Bu ürün"} favorilerden kaldırılsın mı?`)) {
              // Smooth remove animation
              favoriteCard.style.transform = "scale(0.8)"
              favoriteCard.style.opacity = "0"
              setTimeout(() => {
                removeFromFavorites(item._id)
              }, 300)
            }
          })

          // Hover effects
          const card = favoriteCard.querySelector(".favorite-card-modern")
          card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-5px)"
            card.style.boxShadow = "0 10px 25px rgba(0,0,0,0.15)"
            const img = card.querySelector(".card-img-top")
            img.style.transform = "scale(1.05)"
          })

          card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)"
            card.style.boxShadow = ""
            const img = card.querySelector(".card-img-top")
            img.style.transform = "scale(1)"
          })
        }
      })

      favoritesItemsList.appendChild(rowContainer)
      updateFavoritesCount()
    } catch (error) {
      console.error("Error displaying favorites:", error)
      favoritesItemsList.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
          <h4 class="text-muted mb-3">Favoriler yüklenirken hata oluştu</h4>
          <p class="text-muted mb-4">Lütfen sayfayı yenilemeyi deneyin.</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fas fa-refresh me-1"></i>Sayfayı Yenile
          </button>
        </div>
      `
    }
  }

  if (clearFavoritesButton) {
    clearFavoritesButton.addEventListener("click", () => {
      if (confirm("Tüm favorileri temizlemek istediğinize emin misiniz?")) {
        saveFavorites([])
      }
    })
  }

  // Debug için localStorage'ı kontrol et
  console.log("LocalStorage userFavorites:", localStorage.getItem("userFavorites"))

  // Sayfa yüklendiğinde favorileri göster
  displayFavoriteItems()
  updateFavoritesCount()
})
