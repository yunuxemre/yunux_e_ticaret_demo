document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const registerForm = document.getElementById("registerForm")
  const loginMessageArea = document.getElementById("loginMessageArea")
  const registerMessageArea = document.getElementById("registerMessageArea")

  const API_BASE_URL = "/api/users"

  const showAuthMessage = (areaElement, message, type = "error") => {
    if (areaElement) {
      areaElement.textContent = message
      areaElement.className = `message-area message-${type}`
      areaElement.style.display = "block"
      setTimeout(() => {
        areaElement.style.display = "none"
      }, 3000)
    } else {
      alert(`${type === "error" ? "HATA: " : ""}${message}`)
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      if (loginMessageArea) loginMessageArea.style.display = "none"
      const email = loginForm.email.value
      const password = loginForm.password.value
      if (!email || !password) {
        showAuthMessage(loginMessageArea, "Tüm alanları doldurun.")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Giriş başarısız.")

        localStorage.setItem("userInfo", JSON.stringify(data))
        showAuthMessage(loginMessageArea, "Giriş başarılı! Yönlendiriliyorsunuz...", "success")
        setTimeout(() => {
          window.location.href = "/"
        }, 1500)
      } catch (error) {
        showAuthMessage(loginMessageArea, error.message || "Bir hata oluştu.")
      }
    })
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      if (registerMessageArea) registerMessageArea.style.display = "none"
      const name = registerForm.name.value
      const email = registerForm.email.value
      const password = registerForm.password.value
      const confirmPassword = registerForm.confirmPassword.value

      if (!name || !email || !password || !confirmPassword) {
        showAuthMessage(registerMessageArea, "Tüm alanları doldurun.")
        return
      }
      if (password !== confirmPassword) {
        showAuthMessage(registerMessageArea, "Şifreler eşleşmiyor.")
        return
      }
      if (password.length < 6) {
        showAuthMessage(registerMessageArea, "Şifre en az 6 karakter olmalı.")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Kayıt başarısız.")

        showAuthMessage(registerMessageArea, "Kayıt başarılı! Şimdi giriş yapabilirsiniz.", "success")
        setTimeout(() => {
          window.location.href = "login.html"
        }, 2000)
      } catch (error) {
        showAuthMessage(registerMessageArea, error.message || "Bir hata oluştu.")
      }
    })
  }
})
