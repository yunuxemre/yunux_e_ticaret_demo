document.addEventListener("DOMContentLoaded", async () => {
  const productsContainer = document.querySelector(".products-container")

  const getUserInfo = () => {
    const userInfoString = localStorage.getItem("userInfo")
    try {
      return userInfoString ? JSON.parse(userInfoString) : null
    } catch (e) {
      localStorage.removeItem("userInfo")
      return null
    }
  }

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
  }

  const updateFavoritesCount = () => {
    const favorites = getFavorites()
    const totalItems = favorites.length
    const favoritesCountElement = document.getElementById("favorites-item-count")
    if (favoritesCountElement) favoritesCountElement.textContent = totalItems
  }

  const isInFavorites = (productId) => {
    const favorites = getFavorites()
    return favorites.some((item) => item._id === productId)
  }

  const addToFavorites = (product) => {
    const userInfo = getUserInfo()
    if (!userInfo || !userInfo.token) {
      alert("Favorilere eklemek için giriş yapmanız gerekmektedir.")
      window.location.href = "login.html"
      return
    }

    const favorites = getFavorites()
    if (!isInFavorites(product._id)) {
      favorites.push(product)
      saveFavorites(favorites)
      return true
    }
    return false
  }

  const removeFromFavorites = (productId) => {
    let favorites = getFavorites()
    favorites = favorites.filter((item) => item._id !== productId)
    saveFavorites(favorites)
  }

  const toggleFavorite = (product, heartButton) => {
    if (isInFavorites(product._id)) {
      removeFromFavorites(product._id)
      heartButton.innerHTML = '<i class="far fa-heart"></i>'
      heartButton.classList.remove("btn-danger")
      heartButton.classList.add("btn-outline-danger")
      heartButton.title = "Favorilere Ekle"
    } else {
      if (addToFavorites(product)) {
        heartButton.innerHTML = '<i class="fas fa-heart"></i>'
        heartButton.classList.remove("btn-outline-danger")
        heartButton.classList.add("btn-danger")
        heartButton.title = "Favorilerden Kaldır"
      }
    }
  }

  const loadAndDisplayProducts = async () => {
    if (!productsContainer) {
      return
    }
    try {
      const productsResponse = await fetch("/api/products")
      if (!productsResponse.ok) throw new Error("Ürünler yüklenemedi.")
      const products = await productsResponse.json()
      displayProducts(products)
    } catch (error) {
      if (productsContainer) productsContainer.innerHTML = `<p>Ürünler yüklenemedi.</p>`
    }
  }

  function displayProducts(products) {
    if (!productsContainer) return
    productsContainer.innerHTML = ""
    if (!products || products.length === 0) {
      productsContainer.innerHTML =
        '<div class="col-12"><div class="alert alert-info text-center">Ürün yok.</div></div>'
      return
    }

    products.forEach((product) => {
      const productCol = document.createElement("div")
      productCol.classList.add("col")
      const imageUrl = product.image || `/images/default-product.png`
      const stockInfo =
        product.stock > 0
          ? `<p class="card-text text-muted mb-2"><small>Stok: ${product.stock}</small></p>`
          : '<p class="card-text text-danger fw-bold mb-2"><small>Stok Tükendi</small></p>'
      const productDetailUrl = `product-detail.html?id=${product._id}`

      const isFavorited = isInFavorites(product._id)
      const heartIcon = isFavorited ? "fas fa-heart" : "far fa-heart"
      const heartButtonClass = isFavorited ? "btn-danger" : "btn-outline-danger"
      const heartTitle = isFavorited ? "Favorilerden Kaldır" : "Favorilere Ekle"

      productCol.innerHTML = `
                <div class="card h-100 shadow-sm product-card">
                    <div class="position-relative">
                        <a href="${productDetailUrl}" class="text-decoration-none product-card-link d-block">
                            <img src="${imageUrl}" class="card-img-top p-3" alt="${product.name}" style="height: 220px; object-fit: contain; background-color: #fff;">
                        </a>
                        <button class="btn ${heartButtonClass} btn-sm position-absolute favorite-btn" 
                                style="top: 10px; right: 10px; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;"
                                title="${heartTitle}"
                                data-product-id="${product._id}">
                            <i class="${heartIcon}"></i>
                        </button>
                    </div>
                    <div class="card-body d-flex flex-column text-center">
                        <h5 class="card-title fs-6 mb-2">
                            <a href="${productDetailUrl}" class="text-dark text-decoration-none product-card-title-link">${product.name}</a>
                        </h5>
                        <p class="card-text_description small text-muted mb-2">${(product.description || "").substring(0, 70)}${(product.description || "").length > 70 ? "..." : ""}</p>
                        ${stockInfo}
                        <div class="mt-auto">
                            <p class="card-text fs-5 fw-bold text-primary mb-3">${(product.price / 100).toFixed(2)} TL</p>
                            <div class="d-grid gap-2">
                                <a href="${productDetailUrl}" class="btn btn-outline-primary rounded-pill view-details-button">
                                    Detayları Gör <i class="fas fa-arrow-right ms-1"></i>
                                </a>
                                <a href="${product.purchaseLink || "https://www.shopier.com/tansusahalsalamura?fbclid=PAZXh0bgNhZW0CMTEAAacBvI7-Wr0j9KJw2YfgFOzJRt3a4boCj5kG2sQEGjMuBBcGxDrqdz_lHng5ig_aem_-hd3SXrVz4kSBkCwAr40ag"}" 
   target="_blank" 
   class="btn rounded-pill"
   style="background-color: #6B46C1; border-color: #6B46C1; color: white;">
    <i class="fas fa-shopping-cart me-1"></i>Shopier'da Satın Al
</a>
                            </div>
                        </div>
                    </div>
                </div>`

      const favoriteBtn = productCol.querySelector(".favorite-btn")
      favoriteBtn.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(product, favoriteBtn)
      })

      productsContainer.appendChild(productCol)
    })
  }

  const contactForm = document.getElementById("contactForm")
  const contactFormMessage = document.getElementById("contactFormMessage")
  if (contactForm && contactFormMessage) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("contactName").value
      const email = document.getElementById("contactEmail").value
      const subject = document.getElementById("contactSubject").value
      const message = document.getElementById("contactMessage").value

      if (!name || !email || !subject || !message) {
        contactFormMessage.textContent = "Lütfen tüm alanları doldurun."
        contactFormMessage.className = "alert alert-danger"
        return
      }

      contactFormMessage.textContent = "Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız."
      contactFormMessage.className = "alert alert-success"
      contactForm.reset()
    })
  }

  updateFavoritesCount()
  loadAndDisplayProducts()
})
