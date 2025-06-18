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

  let currentVideoUrl = ""; // Yüklenen videonun yolunu tutmak için

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
    // İYİLEŞTİRME: HTML'deki Bootstrap sınıflarıyla uyumlu hale getirildi.
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
    // Buton metnini ilk haline çevir
    if (productForm) productForm.querySelector('button[type="submit"]').textContent = "Kaydet / Güncelle";
    
    // Video alanını temizle
    currentVideoUrl = "";
    if (videoPreview) videoPreview.style.display = "none";
    if (videoSource) videoSource.src = "";
    if (uploadProgress) uploadProgress.style.display = "none";
    if (videoFile) videoFile.value = ""; // Dosya seçimini de sıfırla
  };

  // --- FORM VE UI EVENTLERİ ---

  if (clearFormButton) {
    clearFormButton.addEventListener("click", clearForm);
  }

  // Video Yükleme Alanı Eventleri
  if (selectVideoBtn && videoFile) {
    selectVideoBtn.addEventListener("click", () => videoFile.click());
  }

  if (videoUploadArea) {
    videoUploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      videoUploadArea.classList.add("dragover");
    });

    videoUploadArea.addEventListener("dragleave", () => {
      videoUploadArea.classList.remove("dragover");
    });

    videoUploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
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
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      showAdminMessage("Video dosyası 100MB'dan büyük olamaz.", "error");
      return;
    }

    const token = checkAdminAuth();
    if (!token) return;

    if (uploadProgress) {
      uploadProgress.style.display = "block";
      const progressBar = uploadProgress.querySelector(".progress-bar");
      if (progressBar) progressBar.style.width = "0%";
    }

    const formData = new FormData();
    formData.append("video", file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        const progressBar = uploadProgress?.querySelector(".progress-bar");
        if (progressBar) {
          progressBar.style.width = percentComplete + "%";
          progressBar.textContent = percentComplete + "%";
        }
      }
    });

    xhr.onload = () => {
      if (uploadProgress) uploadProgress.style.display = "none";
      if (xhr.status === 200 || xhr.status === 201) {
        const response = JSON.parse(xhr.responseText);
        currentVideoUrl = response.videoUrl;
        if (videoSource && videoPreview) {
          videoSource.src = response.videoUrl;
          videoPreview.style.display = "block";
        }
        if (videoUrlInput) videoUrlInput.value = ""; // YouTube linkini temizle
        showAdminMessage("Video başarıyla yüklendi!", "success");
      } else {
        const errorResponse = JSON.parse(xhr.responseText);
        showAdminMessage(errorResponse.message || "Video yükleme başarısız oldu.", "error");
      }
    };

    xhr.onerror = () => {
      if (uploadProgress) uploadProgress.style.display = "none";
      showAdminMessage("Video yüklenirken bir ağ hatası oluştu.", "error");
    };

    xhr.open("POST", API_URL_VIDEO_UPLOAD);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
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
      let videoStatus = '<i class="fas fa-video-slash text-muted"></i>';
      if (product.videoUrl) {
        videoStatus = product.videoUrl.includes("youtube.com")
          ? '<i class="fab fa-youtube text-danger"></i>'
          : '<i class="fas fa-video text-success"></i>';
      }

      const row = `
        <tr>
          <td><img src="${product.image || 'https://via.placeholder.com/60'}" alt="${product.name}" width="60" class="img-thumbnail"></td>
          <td>${product.name}</td>
          <td class="text-end">${(product.price / 100).toFixed(2)} TL</td>
          <td class="text-center">${product.stock}</td>
          <td class="text-center">${videoStatus}</td>
          <td class="text-center actions">
            <button class="btn btn-sm btn-info edit-product" data-id="${product._id}">
                <i class="fas fa-edit"></i> Düzenle
            </button>
            <button class="btn btn-sm btn-danger delete-product" data-id="${product._id}">
                <i class="fas fa-trash"></i> Sil
            </button>
          </td>
        </tr>
      `;
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

      // --- ANA DÜZELTME BURADA: FİYATI KURUŞ'A ÇEVİRME ---
      // Formdaki "150.50" gibi bir değeri 15050 tamsayısına çeviriyoruz.
      const priceInCents = Math.round(Number.parseFloat(priceInput.value) * 100);
      if (isNaN(priceInCents) || priceInCents < 0) {
          showAdminMessage("Lütfen geçerli bir fiyat girin.", "error");
          return;
      }

      const productData = {
        name: nameInput.value,
        description: descriptionInput.value,
        price: priceInCents, // Sunucuya kuruş olarak gönder
        stock: Number.parseInt(stockInput.value),
        image: imageInput.value.trim() || undefined,
        videoUrl: finalVideoUrl,
        trendyolLink: document.getElementById("trendyolLink")?.value?.trim() || "",
        category: document.getElementById("category")?.value?.trim() || "",
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
          const responseData = await response.json().catch(() => ({ message: `Sunucu hatası (${response.status})` }));
          throw new Error(responseData.message);
        }

        showAdminMessage(id ? "Ürün başarıyla güncellendi!" : "Ürün başarıyla eklendi!", "success");
        clearForm();
        fetchProducts(); // Listeyi yenile
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

      // Silme İşlemi
      if (button.classList.contains("delete-product")) {
        if (currentProductId && confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
          try {
            const response = await fetch(`${API_URL_ADMIN}/${currentProductId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` },
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ message: "Silme işlemi başarısız." }));
              throw new Error(errorData.message);
            }
            fetchProducts();
            showAdminMessage("Ürün başarıyla silindi!", "success");
          } catch (error) {
            showAdminMessage(`Hata: ${error.message}`, "error");
          }
        }
      }
      // Düzenleme İşlemi
      else if (button.classList.contains("edit-product")) {
        if (currentProductId) {
          try {
            const response = await fetch(`${API_URL_PRODUCTS}/${currentProductId}`);
            if (!response.ok) throw new Error("Düzenlenecek ürün bilgileri alınamadı.");
            const product = await response.json();
            
            clearForm(); // Formu düzenlemeye hazırlamadan önce temizle

            productIdInput.value = product._id;
            nameInput.value = product.name;
            descriptionInput.value = product.description;
            priceInput.value = (product.price / 100).toFixed(2); // Kuruşu TL'ye çevir
            stockInput.value = product.stock;
            imageInput.value = product.image || "";
            document.getElementById("trendyolLink").value = product.trendyolLink || "";
            document.getElementById("category").value = product.category || "";

            // Video alanını doldur
            if (product.videoUrl) {
              if (product.videoUrl.includes("youtube.com")) {
                videoUrlInput.value = product.videoUrl;
                new bootstrap.Tab(document.getElementById("youtube-tab")).show();
              } else {
                currentVideoUrl = product.videoUrl;
                videoSource.src = product.videoUrl;
                videoPreview.style.display = "block";
                new bootstrap.Tab(document.getElementById("upload-tab")).show();
              }
            }
            
            productForm.querySelector('button[type="submit"]').textContent = "Güncelle";
            document.getElementById("addProductSection").scrollIntoView({ behavior: "smooth" });

          } catch (error) {
            showAdminMessage(`Hata: ${error.message}`, "error");
          }
        }
      }
    });
  }

  // --- SAYFA YÜKLENDİĞİNDE ÇALIŞACAK KODLAR ---
  const initialToken = checkAdminAuth();
  if (initialToken) {
    fetchProducts();
  } else {
      // Yetki yoksa formu ve listeyi gizle/devre dışı bırak
      if(productForm) productForm.style.display = 'none';
      if(productListBody) productListBody.innerHTML = `<tr><td colspan="6" class="text-center">İçeriği görmek için admin olarak giriş yapmalısınız.</td></tr>`;
  }
});