document.addEventListener("DOMContentLoaded", () => {
  const userGreetingElement = document.getElementById("userGreeting")
  const loginLinkElement = document.getElementById("loginLink")
  const registerLinkElement = document.getElementById("registerLink")
  const logoutLinkElement = document.getElementById("logoutLink")
  const adminLinkElement = document.getElementById("adminLink")
  const favoritesItemCountElement = document.getElementById("favorites-item-count")
  const mainNavbar = document.querySelector(".main-navbar")
  let navLinks = []
  if (mainNavbar) navLinks = mainNavbar.querySelectorAll(".navbar-nav .nav-link")

  const updateFavoritesCount = () => {
    const favoritesString = localStorage.getItem("userFavorites")
    let favorites = []
    try {
      favorites = favoritesString ? JSON.parse(favoritesString) : []
      if (!Array.isArray(favorites)) favorites = []
    } catch (e) {
      favorites = []
    }

    const totalItems = favorites.length
    if (favoritesItemCountElement) {
      favoritesItemCountElement.textContent = totalItems
    }
  }

  window.updateFavoritesCountOnly = updateFavoritesCount

  const updateHeaderUIOnly = () => {
    const userInfoString = localStorage.getItem("userInfo")
    let userInfo = null
    try {
      userInfo = userInfoString ? JSON.parse(userInfoString) : null
    } catch (e) {
      localStorage.removeItem("userInfo")
    }

    console.log("Debug - UserInfo:", userInfo) // Debug log

    if (userGreetingElement && loginLinkElement && registerLinkElement && logoutLinkElement && adminLinkElement) {
      if (userInfo && userInfo.token) {
        userGreetingElement.textContent = `Merhaba, ${userInfo.name}!`
        userGreetingElement.style.display = "inline"
        loginLinkElement.style.display = "none"
        registerLinkElement.style.display = "none"

        // Force display with !important override
        logoutLinkElement.style.setProperty("display", "inline", "important")

        if (userInfo.role === "admin") {
          adminLinkElement.style.setProperty("display", "inline", "important")
        } else {
          adminLinkElement.style.display = "none"
        }

        console.log("Debug - Logout link should be visible") // Debug log
      } else {
        userGreetingElement.style.display = "none"
        loginLinkElement.style.display = "inline"
        registerLinkElement.style.display = "inline"
        logoutLinkElement.style.display = "none"
        adminLinkElement.style.display = "none"

        console.log("Debug - User not logged in") // Debug log
      }
    } else {
      console.log("Debug - Missing elements:", {
        userGreeting: !!userGreetingElement,
        loginLink: !!loginLinkElement,
        registerLink: !!registerLinkElement,
        logoutLink: !!logoutLinkElement,
        adminLink: !!adminLinkElement,
      })
    }

    const currentPath = window.location.pathname
    navLinks.forEach((link) => {
      link.classList.remove("active")
      const href = link.getAttribute("href")
      if (
        href === currentPath ||
        (currentPath === "/" && href === "/") ||
        (currentPath.includes("index.html") && href === "/")
      ) {
        link.classList.add("active")
      }
    })
  }

  window.updateHeaderUIOnly = updateHeaderUIOnly

  const logoutHandlerOnly = () => {
    localStorage.removeItem("userInfo")
    updateHeaderUIOnly()
    updateFavoritesCount()
    if (window.location.pathname.includes("admin.html")) {
      window.location.href = "/"
    }
  }

  if (logoutLinkElement) {
    logoutLinkElement.addEventListener("click", (e) => {
      e.preventDefault()
      logoutHandlerOnly()
    })
  }

  updateHeaderUIOnly()
  updateFavoritesCount()
})
