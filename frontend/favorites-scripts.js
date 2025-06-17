document.addEventListener("DOMContentLoaded", () => {
  const favoritesItemsList = document.getElementById("favorites-items-list")
  const favoritesItemCountElement = document.getElementById("favorites-item-count")
  const emptyFavoritesMessage = document.querySelector(".empty-favorites-message")
  const favoritesSummary = document.querySelector(".favorites-summary")
  const clearFavoritesButton = document.querySelector(".clear-favorites-button")
  const favoritesTotalCountElement = document.getElementById("favorites-total-count")

  const getFavorites = () => {
    const favoritesString = localStorage.getItem("userFavorites")
    try {
      const favorites = favoritesString ? JSON.parse(favoritesString) : []
      return Array.isArray(favorites) ? favorites : []
    } catch (e) {
      return []
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

    if (favoritesSummary && emptyFavoritesMessage) {
      if (totalItems > 0) {
        favoritesSummary.style.display = "block"
        if (emptyFavoritesMessage) emptyFavoritesMessage.style.display = "none"
      } else {
        favoritesSummary.style.display = "none"
        if (emptyFavoritesMessage) emptyFavoritesMessage.style.display = "block"
      }
    }
  }

  const removeFromFavorites = (productId) => {
    let favorites = getFavorites()
    favorites = favorites.filter((item) => item._id !== productId)
    saveFavorites(favorites)
  }

  const displayFavoriteItems = () => {
    const favorites = getFavorites()

    if (!favoritesItemsList) return

    favoritesItemsList.innerHTML = ""

    if (favorites.length === 0) {
      updateFavoritesCount()
      return
    }

    favorites.forEach((item) => {
      const price = Number(item.price)
      if (isNaN(price)) return

      const favoriteItemDiv = document.createElement("div")
      favoriteItemDiv.classList.add("favorite-item")
      favoriteItemDiv.innerHTML = `
                <img src="${item.image || "/images/default-product.png"}" alt="${item.name || "Ürün"}">
                <div class="favorite-item-details">
                    <h4>${item.name || "İsimsiz"}</h4>
                    <p class="text-muted">${(item.description || "").substring(0, 100)}${(item.description || "").length > 100 ? "..." : ""}</p>
                    <p class="text-muted small">Kategori: ${item.category || "Genel"}</p>
                    ${item.stock > 0 ? '<p class="text-success small"><i class="fas fa-check-circle me-1"></i>Stokta Var</p>' : '<p class="text-danger small"><i class="fas fa-times-circle me-1"></i>Stok Tükendi</p>'}
                </div>
                <div class="favorite-item-price">${(price / 100).toFixed(2)} TL</div>
                <div class="favorite-item-actions">
                    <a href="product-detail.html?id=${item._id}" class="btn btn-outline-primary btn-sm">
                        <i class="fas fa-eye me-1"></i>Detay
                    </a>
                    <a href="${item.trendyolLink || "https://www.trendyol.com/magaza/tansusahalsalamura-m-1013741?sst=0"}" 
                       target="_blank" class="btn btn-trendyol btn-sm">
                        <i class="fas fa-shopping-cart me-1"></i>Satın Al
                    </a>
                </div>
                <div class="favorite-item-remove">
                    <button class="remove-favorite-button" data-id="${item._id}" title="Favorilerden Kaldır">
                        <i class="fas fa-heart-broken"></i>
                    </button>
                </div>
            `
      favoritesItemsList.appendChild(favoriteItemDiv)

      favoriteItemDiv.querySelector(".remove-favorite-button").addEventListener("click", () => {
        if (confirm(`${item.name || "Bu ürün"} favorilerden kaldırılsın mı?`)) {
          removeFromFavorites(item._id)
        }
      })
    })

    updateFavoritesCount()
  }

  if (clearFavoritesButton) {
    clearFavoritesButton.addEventListener("click", () => {
      if (confirm("Tüm favorileri temizlemek istediğinize emin misiniz?")) {
        saveFavorites([])
      }
    })
  }

  displayFavoriteItems()
  updateFavoritesCount()
})
