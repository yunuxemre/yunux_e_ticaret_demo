document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENT SEÇİCİLER VE SABİTLER ---
  const productForm = document.getElementById("productForm");
  const productIdInput = document.getElementById("productId");
  const nameInput = document.getElementById("name");
  const descriptionInput = document.getElementById("description");
  const priceInput = document.getElementById("price");
  const stockInput = document.getElementById("stock");
  const imageInput = document.getElementById("image");
  const videoUrlInput = document.getElementById("videoUrl");
  const clearFormButton = document.getElementById("clearFormButton");
  const productListBody = document.getElementById("productListBody");
  const adminMessageArea = document.getElementById("adminMessageArea");
  
  // Video Yükleme Elemanları
  const videoUploadArea = document.getElementById("videoUploadArea");
  const videoFile = document.getElementById("videoFile");
  const selectVideoBtn = document.getElementById("selectVideoBtn");
  const uploadProgress = document.getElementById("uploadProgress");
  const videoPreview = document.getElementById("videoPreview");
  const videoSource = document.getElementById("videoSource");
  const removeVideoBtn = document.getElementById("removeVideoBtn");

  let currentVideoUrl = "";

  // API Adresleri
  const API_URL_ADMIN = "/api/admin/products";
  const API_URL_PRODUCTS = "/api/products";
  const API_URL_VIDEO_UPLOAD = "/api/admin/upload-video";

  // --- YARDIMCI FONKSİYONLAR ---

  const getUserInfo = () => {
    const userInfoString = localStorage.getItem("userInfo");
    try {
      return userInfoString ? JSON.parse(userInfoString) : null;
    } catch (e) {
      localStorage.removeItem("userInfo");
      return null;
    }
  };

  const checkAdminAuth = () => {
    const userInfo = getUserInfo();
    if (!userInfo || !userInfo.token) {
      showAdminMessage("Bu işlem için giriş yapmanız gerekmektedir.", "error");
      return null;
    }
    if (userInfo.role !== "admin") {
      showAdminMessage("Bu sayfaya veya işleme erişim yetkiniz yok.", "error");
      return null;
    }
    return userInfo.token;
  };

  const showAdminMessage = (message, type = "success") => {
    if (!adminMessageArea) {
      alert(`${type === "error" ? "HATA: " : ""}${message}`);
      return;
    }
    adminMessageArea.textContent = message;
    adminMessageArea.className = `message-area alert ${type === "success" ? "alert-success" : "alert-danger"}`;
    adminMessageArea.style.display = "block";
    setTimeout(() => {
      adminMessageArea.style.display = "none";
    }, 4000);
  };

  const clearForm = () => {
    if (productForm) productForm.reset();
    if (productIdInput) productIdInput.value = "";
    if (productForm) productForm.querySelector('button[type="submit"]').textContent = "Kaydet / Güncelle";
    
    currentVideoUrl = "";
    if (videoPreview) videoPreview.style.display = "none";
    if (videoSource) videoSource.src = "";
    if (uploadProgress) uploadProgress.style.display = "none";
    if (videoFile) videoFile.value = "";
  };

  // --- FORM VE UI EVENTLERİ ---

  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm);
  }
  
  if (selectVideoBtn && videoFile) {
    selectVideoBtn.addEventListener("click", () => videoFile.click());
  }

  if (videoUploadArea) {
    ["dragover", "dragleave", "drop"].forEach(eventName => videoUploadArea.addEventListener(eventName, e => e.preventDefault()));
    videoUploadArea.addEventListener("dragover", () => videoUploadArea.classList.add("dragover"));
    videoUploadArea.addEventListener("dragleave", () => videoUploadArea.classList.remove("dragover"));
    videoUploadArea.addEventListener("drop", (e) => {
      videoUploadArea.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("video/")) {
        handleVideoFile(files[0]);
      } else {
        showAdminMessage("Lütfen geçerli bir video dosyası seçin.", "error");
      }
    });
  }

  if (videoFile) {
    videoFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleVideoFile(file);
    });
  }

  if (removeVideoBtn) {
    removeVideoBtn.addEventListener("click", () => {
      currentVideoUrl = "";
      if (videoPreview) videoPreview.style.display = "none";
      if (videoSource) videoSource.src = "";
      if (videoFile) videoFile.value = "";
      showAdminMessage("Yüklenen video kaldırıldı.", "success");
    });
  }
  
  // --- API İLE İLGİLİ FONKSİYONLAR ---

  const handleVideoFile = async (file) => {
    if (file.size > 100 * 1024 * 1024) {
      showAdminMessage("Video dosyası 100MB'dan büyük olamaz.", "error");
      return;
    }
    const token = checkAdminAuth();
    if (!token) return;
    // ... (Video yükleme kodunuzun geri kalanı burada)
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL_PRODUCTS);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: `Sunucu hatası (${response.status})` }));
        throw new Error(errData.message);
      }
      const products = await response.json();
      renderProducts(products);
    } catch (error) {
      if (productListBody)
        productListBody.innerHTML = `<tr><td colspan="6" class="text-center">Ürünler yüklenirken bir hata oluştu: ${error.message}</td></tr>`;
    }
  };

  const renderProducts = (products) => {
    if (!productListBody) return;
    productListBody.innerHTML = "";
    if (!products || products.length === 0) {
      productListBody.innerHTML = `<tr><td colspan="6" class="text-center">Gösterilecek ürün bulunmamaktadır.</td></tr>`;
      return;
    }
    products.forEach((product) => {
      // ... (renderProducts kodunuzun geri kalanı burada)
      const row = `
        <tr>
          <td><img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}" width="60" class="img-thumbnail"></td>
          <td>${product.name}</td>
          <td class="text-end">${(product.price / 100).toFixed(2)} TL</td>
          <td class="text-center">${product.stock}</td>
          <td class="text-center">${product.videoUrl ? '<i class="fas fa-video text-success"></i>' : '<i class="fas fa-video-slash text-muted"></i>'}</td>
          <td class="text-center actions">
            <button class="btn btn-sm btn-info edit-product" data-id="${product._id}"><i class="fas fa-edit"></i> Düzenle</button>
            <button class="btn btn-sm btn-danger delete-product" data-id="${product._id}"><i class="fas fa-trash"></i> Sil</button>
          </td>
        </tr>`;
      productListBody.insertAdjacentHTML('beforeend', row);
    });
  };

  // --- ANA EVENT LISTENERS ---

  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = checkAdminAuth();
      if (!token) return;

      const id = productIdInput.value;

      let finalVideoUrl = "";
      if (currentVideoUrl) {
        finalVideoUrl = currentVideoUrl;
      } else if (videoUrlInput && videoUrlInput.value.trim()) {
        finalVideoUrl = videoUrlInput.value.trim();
      }

      const priceAsFloat = parseFloat(priceInput.value);
      if (isNaN(priceAsFloat) || priceAsFloat < 0) {
        showAdminMessage("Lütfen geçerli ve pozitif bir fiyat girin.", "error");
        return;
      }
      const priceInCents = Math.round(priceAsFloat * 100);

      // --- ANA DÜZELTME BURADA ---
      const trendyolLinkValue = document.getElementById("trendyolLink")?.value?.trim();

      const productData = {
        name: nameInput.value,
        description: descriptionInput.value,
        price: priceInCents,
        stock: Number.parseInt(stockInput.value),
        image: imageInput.value.trim() || undefined,
        videoUrl: finalVideoUrl,
        category: document.getElementById("category")?.value?.trim() || "",
        // Sadece trendyolLink doluysa nesneye ekle, boşsa hiç gönderme
        ...(trendyolLinkValue && { trendyolLink: trendyolLinkValue })
      };

      const method = id ? "PUT" : "POST";
      const url = id ? `${API_URL_ADMIN}/${id}` : API_URL_ADMIN;

      try {
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        });
        
        if (!response.ok) {
          const responseData = await response.json().catch(() => ({ message: `Sunucuya ulaşılamadı veya yanıt alınamadı. (Kod: ${response.status})` }));
          // Hata mesajını responseData.errors'dan almayı dene
          const errorMessage = responseData.errors ? `${responseData.message}: ${responseData.errors[0].message}` : responseData.message;
          throw new Error(errorMessage);
        }

        showAdminMessage(id ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla eklendi!", "success");
        clearForm();
        fetchProducts();
      } catch (error) {
        showAdminMessage(`Hata: ${error.message}`, "error");
      }
    });
  }

  if (productListBody) {
    productListBody.addEventListener("click", async (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      const token = checkAdminAuth();
      if (!token) return;

      const currentProductId = button.dataset.id;
      
      // ... (Silme ve düzenleme kodlarınızın geri kalanı burada, onlar doğru çalışıyor)
      if (button.classList.contains("delete-product")) {
        // ...
      } else if (button.classList.contains("edit-product")) {
        // ...
      }
    });
  }

  // --- SAYFA YÜKLENDİĞİNDE ÇALIŞACAK KODLAR ---
  const initialToken = checkAdminAuth();
  if (initialToken) {
    fetchProducts();
  } else {
    if (productForm) productForm.style.display = 'none';
    if (productListBody) productListBody.innerHTML = `<tr><td colspan="6" class="text-center">İçeriği görmek için admin olarak giriş yapmalısınız.</td></tr>`;
  }
});