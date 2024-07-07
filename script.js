const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const output = document.getElementById("output")
const context = canvas.getContext("2d")
const toggleButton = document.getElementById("toggleButton")
const tabButtons = document.querySelectorAll(".tab-button")
const tabContents = document.querySelectorAll(".tab-content")
let stream = null
let intervalId = null
let products = []
let barcodeRects = []

function addProduct(product) {
  saved_product_codes = products.map((saved) => saved.product_code)
  if (!saved_product_codes.includes(product.product_code)) {
    products.push(product)
  }
}

toggleButton.addEventListener("click", () => {
  if (stream) {
    stopCamera()
  } else {
    startCamera()
  }
})

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.getAttribute("data-tab")
    tabButtons.forEach((btn) => btn.classList.remove("active"))
    tabContents.forEach((content) => content.classList.remove("active"))
    button.classList.add("active")
    document.getElementById(tab).classList.add("active")
  })
})

function startCamera() {
  navigator.mediaDevices
    .getUserMedia({ video: { width: 1280, height: 720 } })
    .then((videoStream) => {
      stream = videoStream
      video.srcObject = stream
      video.play()
      toggleButton.textContent = "Stop Camera"
      startScanning()
    })
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
    video.srcObject = null
    toggleButton.textContent = "Start Camera"
    stopScanning()
  }
}

function startScanning() {
  intervalId = setInterval(() => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas
      .toDataURL("image/png")
      .replace("data:image/png;base64,", "")

    fetch("http://127.0.0.1:5000/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageData })
    })
      .then((response) => response.json())
      .then((data) => {
        output.innerHTML = ""
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        data.forEach((barcode) => {
          fetchProduct(barcode.data).then((product) => {
            addProduct(product)
            updateCanvas(barcode)
          })
          updateCanvas(barcode)
        })

        output.innerHTML = ""
        products.forEach((product) => {
          const card = document.createElement("div")
          card.className = "card"
          card.innerHTML = `
          <p><strong>商品名:</strong> ${product.product_name}</p>
          <p><strong>バーコード:</strong> ${product.product_code}</p>
          <p><strong>価格:</strong> ${product.price}</p>
        `
          output.appendChild(card)
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }, 200)
}

const fetchProduct = (data) => {
  const cachedProduct = localStorage.getItem(`product_${data}`)
  if (cachedProduct) {
    return Promise.resolve(JSON.parse(cachedProduct))
  }

  const url = `http://127.0.0.1:3000/products/${data}?t=${new Date().getTime()}`
  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  })
    .then((response) => {
      if (response.status === 304) {
        return JSON.parse(cachedProduct)
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((product) => {
      // 新しいデータをキャッシュに保存
      localStorage.setItem(`product_${data}`, JSON.stringify(product))
      return product
    })
    .catch((err) => {
      console.error("Fetch error: ", err)
    })
}

const stopScanning = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const updateCanvas = (barcode) => {
  context.strokeStyle = "red"
  context.lineWidth = 2
  context.strokeRect(
    barcode.rect.left,
    barcode.rect.top,
    barcode.rect.width,
    barcode.rect.height
  )
}
