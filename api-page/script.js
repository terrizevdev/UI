const BASEURL = window.location.origin
const particlesJS = window.particlesJS // Declare particlesJS variable
const bootstrap = window.bootstrap // Declare bootstrap variable

document.addEventListener("DOMContentLoaded", async () => {
  const loadingScreen = document.getElementById("loadingScreen")
  const body = document.body
  body.classList.add("no-scroll")

  document.body.classList.add("dark-mode")

  particlesJS("particles-js", {
    particles: {
      number: { value: 80, density: { enable: true, value_area: 800 } },
      color: { value: "#6c5ce7" },
      shape: { type: "circle" },
      opacity: { value: 0.5, random: false },
      size: { value: 3, random: true },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#6c5ce7",
        opacity: 0.4,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true,
      },
    },
  })

  const animateElements = document.querySelectorAll(".animate")

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = 1
          entry.target.style.transform = "translateY(0)"
        }
      })
    },
    { threshold: 0.1 },
  )

  animateElements.forEach((el) => {
    el.style.opacity = 0
    el.style.transform = "translateY(30px)"
    observer.observe(el)
  })

  try {
    const settings = await fetch(BASEURL + "/src/settings.json").then((res) => res.json())

    const setContent = (id, property, value) => {
      const element = document.getElementById(id)
      if (element) element[property] = value
    }

    document.getElementById("currentYear").textContent = new Date().getFullYear()

    setContent("page", "textContent", settings.name || "Hookrest API")
    setContent("header", "textContent", settings.name || "Hookrest API")
    setContent("footerBrand", "textContent", settings.name || "Hookrest API")
    setContent("name", "textContent", settings.name || "Hookrest API")
    setContent("copyrightName", "textContent", settings.name || "Hookrest API")
    setContent("description", "textContent", settings.description || "Simple API's")

    const apiContent = document.getElementById("apiContent")

    let totalEndpoints = 0
    settings.categories.forEach((category) => {
      totalEndpoints += category.items.length
    })

    const endpointsCounter = document.getElementById("endpointsCounter")
    const totalEndpointsSpan = document.getElementById("totalEndpoints")
    if (endpointsCounter && totalEndpointsSpan) {
      totalEndpointsSpan.textContent = totalEndpoints
      endpointsCounter.style.display = "flex"
    }

    settings.categories.forEach((category) => {
      const categoryDiv = document.createElement("div")
      categoryDiv.className = "api-category animate" // Added animate class
      const categoryHeader = document.createElement("div")
      categoryHeader.className = "api-category-header"
      categoryHeader.innerHTML = `<span>${category.name}</span><i class="fas fa-chevron-down"></i>`
      categoryDiv.appendChild(categoryHeader)
      const categoryBody = document.createElement("div")
      categoryBody.className = "api-category-content"
      categoryBody.style.display = "none"
      const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name))
      sortedItems.forEach((item) => {
        const endpointCard = document.createElement("div")
        endpointCard.className = "api-endpoint-card"
        endpointCard.dataset.apiPath = item.path
        endpointCard.dataset.apiName = item.name
        endpointCard.dataset.apiDesc = item.desc
        endpointCard.dataset.apiInnerDesc = item.innerDesc || ""
        endpointCard.innerHTML = `<span class="method-badge">GET</span><div class="endpoint-text"><span class="endpoint-path">${item.path.split("?")[0]}</span><span class="endpoint-name">${item.name}</span></div><i class="fas fa-chevron-down"></i>`
        categoryBody.appendChild(endpointCard)
      })
      categoryDiv.appendChild(categoryBody)
      apiContent.appendChild(categoryDiv)

      observer.observe(categoryDiv)

      categoryHeader.addEventListener("click", () => {
        categoryBody.style.display = categoryBody.style.display === "none" ? "grid" : "none"
        categoryHeader.classList.toggle("collapsed")
        categoryHeader.querySelector(".fas").classList.toggle("fa-chevron-up")
        categoryHeader.querySelector(".fas").classList.toggle("fa-chevron-down")
      })
    })

    const searchInput = document.getElementById("searchInput")
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase()
      document.querySelectorAll(".api-endpoint-card").forEach((item) => {
        const name = item.dataset.apiName.toLowerCase()
        const path = item.dataset.apiPath.toLowerCase()
        item.style.display = name.includes(searchTerm) || path.includes(searchTerm) ? "flex" : "none"
      })
      document.querySelectorAll(".api-category").forEach((categoryDiv) => {
        const categoryBody = categoryDiv.querySelector(".api-category-content")
        const visibleItems = categoryBody.querySelectorAll('.api-endpoint-card[style*="display: flex"]')
        if (visibleItems.length > 0) {
          categoryDiv.style.display = ""
          categoryBody.style.display = "grid"
          categoryDiv.querySelector(".api-category-header").classList.remove("collapsed")
          categoryDiv.querySelector(".api-category-header .fas").classList.replace("fa-chevron-down", "fa-chevron-up")
        } else {
          categoryDiv.style.display = "none"
        }
      })
    })

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".api-endpoint-card")) return
      const card = event.target.closest(".api-endpoint-card")
      const { apiPath, apiName, apiDesc, apiInnerDesc } = card.dataset
      const modal = new bootstrap.Modal(document.getElementById("apiResponseModal"))
      const modalRefs = {
        label: document.getElementById("apiResponseModalLabel"),
        desc: document.getElementById("apiResponseModalDesc"),
        modalApiDescription: document.getElementById("modalApiDescription"),
        modalEndpointPath: document.getElementById("modalEndpointPath"),
        queryInputContainer: document.getElementById("apiQueryInputContainer"),
        submitBtn: document.getElementById("submitQueryBtn"),
        clearBtn: document.getElementById("clearQueryBtn"),
      }
      modalRefs.label.textContent = apiName
      modalRefs.desc.textContent = apiDesc
      modalRefs.modalApiDescription.textContent = apiDesc
      modalRefs.modalEndpointPath.textContent = apiPath.split("?")[0]
      modalRefs.queryInputContainer.innerHTML = ""
      document.getElementById("apiCurlContent").textContent = ""
      document.getElementById("apiRequestUrlContent").textContent = ""
      document.getElementById("apiResponseCode").textContent = ""
      document.getElementById("apiResponseBody").innerHTML = ""
      document.querySelector(".tab-button[data-tab='parameters']").click()

      const baseApiUrl = `${BASEURL}${apiPath.split("?")[0]}`
      const params = new URLSearchParams(apiPath.split("?")[1])
      let currentParams = {}

      // Always show Execute button
      modalRefs.submitBtn.style.display = "inline-block"
      // Show Clear button only if there are parameters
      modalRefs.clearBtn.style.display = "inline-block"

      // Create API key input (required for all endpoints)
      const apiKeyContainer = document.createElement("div")
      apiKeyContainer.className = "param-container"
      const apiKeyGroup = document.createElement("div")
      apiKeyGroup.className = "param-group"
      apiKeyGroup.innerHTML = `
        <label>Apikey <span class="required-star">*</span> <span class="param-type">string (query)</span></label>
        <input type="text" class="form-control" placeholder="Enter apikey" data-param="apikey" required>
        <p class="param-description">Valid API keys</p>
      `
      apiKeyGroup.querySelector("input").addEventListener("input", (e) => {
        currentParams["apikey"] = e.target.value.trim()
        updateCurlAndRequestUrl(baseApiUrl, currentParams)
      })
      apiKeyContainer.appendChild(apiKeyGroup)

      if (params.toString() && Array.from(params.keys()).some(key => key !== "apikey")) {
        // Endpoint has parameters (other than apikey)
        const paramContainer = document.createElement("div")
        paramContainer.className = "param-container"
        
        params.forEach((_, param) => {
          if (param === "apikey") return // Skip apikey as we already added it
          
          const paramGroup = document.createElement("div")
          paramGroup.className = "param-group"
          paramGroup.innerHTML = `<label>${param.charAt(0).toUpperCase() + param.slice(1)} <span class="required-star">*</span> <span class="param-type">string (query)</span></label><input type="text" class="form-control" placeholder="Enter ${param}..." data-param="${param}" required><p class="param-description">Masukkan ${param}</p>`
          paramGroup.querySelector("input").addEventListener("input", (e) => {
            currentParams[param] = e.target.value.trim()
            updateCurlAndRequestUrl(baseApiUrl, currentParams)
          })
          paramContainer.appendChild(paramGroup)
        })

        modalRefs.queryInputContainer.appendChild(paramContainer)
      }

      // Always add API key input
      modalRefs.queryInputContainer.appendChild(apiKeyContainer)

      if (apiInnerDesc) {
        const innerDescDiv = document.createElement("div")
        innerDescDiv.className = "text-muted mt-3"
        innerDescDiv.style.fontSize = "0.875rem"
        innerDescDiv.innerHTML = apiInnerDesc.replace(/\n/g, "<br>")
        modalRefs.queryInputContainer.appendChild(innerDescDiv)
      }

      updateCurlAndRequestUrl(baseApiUrl, currentParams)

      // Onclick for Execute with validation
      modalRefs.submitBtn.onclick = async () => {
        const newParams = new URLSearchParams()
        let isValid = true
        
        // Validate all inputs including API key
        modalRefs.queryInputContainer.querySelectorAll("input").forEach((input) => {
          if (!input.value.trim()) {
            isValid = false
            input.classList.add("is-invalid")
          } else {
            input.classList.remove("is-invalid")
            newParams.append(input.dataset.param, input.value.trim())
          }
        })
        
        if (isValid) {
          handleApiRequest(`${baseApiUrl}?${newParams.toString()}`, apiName)
        } else {
          showToast("Please fill in all required fields", "error")
        }
      }

      modalRefs.clearBtn.onclick = () => {
        modalRefs.queryInputContainer.querySelectorAll("input").forEach((input) => (input.value = ""))
        currentParams = {}
        updateCurlAndRequestUrl(baseApiUrl, currentParams)
      }

      modal.show()
    })

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", function () {
        this.parentElement.querySelectorAll(".tab-button").forEach((btn) => btn.classList.remove("active"))
        this.classList.add("active")
        const tabId = `${this.dataset.tab}Tab`
        const parentPane = this.closest(".modal-body")
        if (parentPane) {
          parentPane.querySelectorAll(".tab-pane").forEach((pane) => pane.classList.remove("active"))
          const activePane = document.getElementById(tabId)
          if (activePane) activePane.classList.add("active")
        }
      })
    })

    document
      .getElementById("copyCurl")
      .addEventListener("click", () =>
        copyToClipboard(document.getElementById("apiCurlContent").textContent, "Curl command copied!"),
      )
    document
      .getElementById("copyRequestUrl")
      .addEventListener("click", () =>
        copyToClipboard(document.getElementById("apiRequestUrlContent").textContent, "Request URL copied!"),
      )
    document.getElementById("copyResponseBody").addEventListener("click", () => {
      const responseBodyElement = document.getElementById("apiResponseBody")
      let textToCopy = ""

      // Handle different content types
      if (responseBodyElement.querySelector("img, audio, video")) {
        // For media content, copy the API response as text
        textToCopy = "Media content - use download button to save the file"
      } else {
        // For text/JSON content, copy the actual content
        textToCopy = responseBodyElement.textContent || responseBodyElement.innerText
      }

      copyToClipboard(textToCopy, "Response body copied!")
    })
  } catch (error) {
    console.error("Error loading settings:", error)
  } finally {
    setTimeout(() => {
      loadingScreen.style.opacity = 0
      setTimeout(() => {
        loadingScreen.style.display = "none"
        body.classList.remove("no-scroll")
      }, 300)
    }, 500)
  }
})

function copyToClipboard(text, successMessage) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast(successMessage, "success"))
    .catch((err) => {
      console.error("Could not copy text: ", err)
      showToast("Failed to copy to clipboard", "error")
    })
}

function showToast(message, type = "success") {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector(".toast-container")
  if (!toastContainer) {
    toastContainer = document.createElement("div")
    toastContainer.className = "toast-container"
    document.body.appendChild(toastContainer)
  }

  // Create toast element
  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  const icon = type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle"

  toast.innerHTML = `
    <i class="${icon} toast-icon"></i>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `

  // Add toast to container
  toastContainer.appendChild(toast)

  // Trigger show animation
  setTimeout(() => {
    toast.classList.add("show")
  }, 10)

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove()
      }
    }, 400)
  }, 3000)
}

function updateCurlAndRequestUrl(baseApiUrl, params) {
  const newParams = new URLSearchParams(params)
  const fullRequestUrl = `${baseApiUrl}${newParams.toString() ? "?" + newParams.toString() : ""}`
  document.getElementById("apiRequestUrlContent").textContent = fullRequestUrl
  document.getElementById("apiCurlContent").textContent =
    `curl -X 'GET' \\\n  '${fullRequestUrl}' \\\n  -H 'accept: */*'`
}

// Fungsi untuk mengubah Blob menjadi Base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function handleApiRequest(apiUrl, apiName) {
  const apiResponseCode = document.getElementById("apiResponseCode")
  const apiResponseBody = document.getElementById("apiResponseBody")

  apiResponseCode.textContent = "Loading..."
  apiResponseBody.innerHTML =
    '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>'

  document.querySelector(".tab-button[data-tab='responses']").click()

  try {
    const response = await fetch(apiUrl)
    apiResponseCode.textContent = response.status

    if (!response.ok) {
      try {
        const errorData = await response.json()
        apiResponseBody.textContent = JSON.stringify(errorData, null, 2)
      } catch (e) {
        apiResponseBody.textContent = await response.text()
      }
      return
    }

    const contentType = response.headers.get("Content-Type") || ""

    // --- PERUBAHAN LOGIKA PREVIEW MEDIA ---
    if (contentType.startsWith("image/") || contentType.startsWith("audio/") || contentType.startsWith("video/")) {
      const blob = await response.blob()
      const base64data = await blobToBase64(blob)

      if (contentType.startsWith("image/")) {
        apiResponseBody.innerHTML = `<img src="${base64data}" alt="${apiName}" style="max-width: 100%; border-radius: 8px;">`
      } else if (contentType.startsWith("audio/")) {
        apiResponseBody.innerHTML = `<audio controls src="${base64data}" style="width: 100%;"></audio>`
      } else if (contentType.startsWith("video/")) {
        apiResponseBody.innerHTML = `<video controls src="${base64data}" style="max-width: 100%; border-radius: 8px;"></video>`
      }
    } else if (contentType.includes("application/json")) {
      const data = await response.json()
      apiResponseBody.textContent = JSON.stringify(data, null, 2)
    } else if (contentType.startsWith("text/")) {
      apiResponseBody.textContent = await response.text()
    } else {
      apiResponseBody.textContent = "Preview for this content type is not available."
    }
  } catch (error) {
    apiResponseCode.textContent = "Error"
    apiResponseBody.textContent = `Network or other error occurred: ${error.message}`
  }
}