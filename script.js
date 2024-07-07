const video = document.getElementById("video")
const videoCustomer = document.getElementById("video-customer")
const canvas = document.getElementById("canvas")
const output = document.getElementById("output")
const outputCustomer = document.getElementById("output-customer")
const context = canvas.getContext("2d")
const toggleButton = document.getElementById("toggleButton")
const toggleButtonCustomer = document.getElementById("toggleButtonCustomer")
const pointCalculateButton = document.getElementById("point-calculator")
const tabButtons = document.querySelectorAll(".tab-button")
const tabContents = document.querySelectorAll(".tab-content")
const canvasCustomer = document.getElementById("canvas-customer")
const contextCustomer = canvasCustomer.getContext("2d")

let stream = null
let streamCustomer = null
let intervalId = null
let products = []
let barcodeRects = []
let savedCustomer = []

function addProduct(product) {
  saved_product_codes = products.map((saved) => saved.product_code)
  if (!saved_product_codes.includes(product.product_code)) {
    products.push(product)
  }
}

const addCustomer = (customer) => {
  savedCustomerCode = savedCustomer.map((saved) => saved.jancode)
  if (!savedCustomerCode.includes(customer.jancode)) {
    savedCustomer.push(customer)
  }
}

// 商品データスキャンボタン
toggleButton.addEventListener("click", () => {
  if (stream) {
    stopCamera()
  } else {
    startCamera()
  }
})

// 顧客データスキャンボタン
toggleButtonCustomer.addEventListener("click", () => {
  if (streamCustomer) {
    stopCameraForCustomer()
  } else {
    startCameraForCustomer()
  }
})

pointCalculateButton.addEventListener("click", () => {
  if (products.length === 0 || savedCustomer.length === 0) {
    console.log("商品データまたは顧客データがありません")
  } else {
    const customerId = savedCustomer[0].id
    const productIds = products.map((product) => product.id)
    fetchCalculatePoint(customerId, productIds)
      .then((response) => {
        console.log(response)
        alert(`付与されるポイントは${response.adding_point}です`)
      })
      .catch((err) => {
        console.error(err)
      })
  }
})

const fetchCalculatePoint = (customerId, productIds) => {
  const url = "http://localhost:3000/points/calculate"
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      customer_id: customerId,
      product_ids: productIds,
      check_flag: true
    })
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .catch((err) => {
      console.error("Fetch error: ", err)
    })
}

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

const startCameraForCustomer = () => {
  navigator.mediaDevices
    .getUserMedia({ video: { width: 1280, height: 720 } })
    .then((videoStream) => {
      streamCustomer = videoStream
      videoCustomer.srcObject = streamCustomer
      videoCustomer.play()
      toggleButtonCustomer.textContent = "Stop Camera"
      startScanForCustomer()
    })
}

const stopCameraForCustomer = () => {
  if (streamCustomer) {
    streamCustomer.getTracks().forEach((track) => track.stop())
    streamCustomer = null
    video.srcObject = null
    toggleButtonCustomer.textContent = "Start Camera"
    stopScanning()
  }
}

function startScanning() {
  intervalId = setInterval(() => {
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas
      .toDataURL("image/png")
      .replace("data:image/png;base64,", "")

    decodeBarcode(canvas)
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

        updateOutputForProduct()
      })
      .catch((err) => {
        console.log(err)
      })
  }, 200)
}

const startScanForCustomer = () => {
  intervalId = setInterval(() => {
    contextCustomer.drawImage(
      videoCustomer,
      0,
      0,
      canvasCustomer.width,
      canvasCustomer.height
    )
    const imageData = canvasCustomer
      .toDataURL("image/png")
      .replace("data:image/png;base64,", "")

    decodeBarcode(canvasCustomer)
      .then((data) => {
        output.innerHTML = ""
        contextCustomer.drawImage(
          videoCustomer,
          0,
          0,
          canvasCustomer.width,
          canvasCustomer.height
        )
        data.forEach((barcode) => {
          fetchCustomer(barcode.data).then((customer) => {
            addCustomer(customer)
          })
        })

        updateForCustomer()
      })
      .catch((err) => {
        console.log(err)
      })
  }, 200)
}

const updateOutputForProduct = () => {
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
}

const updateForCustomer = () => {
  outputCustomer.innerHTML = ""
  savedCustomer.forEach((customer) => {
    const card = document.createElement("div")
    card.className = "customer-card"
    card.innerHTML = `
      <p><strong>顧客名:</strong> ${customer.name}</p>
      <p><strong>保有ポイント:</strong> ${customer.point}</p>
    `
    outputCustomer.appendChild(card)
  })
}

function decodeBarcode(localCanvas) {
  const imageData = localCanvas
    .toDataURL("image/png")
    .replace("data:image/png;base64,", "")
  return fetch("http://127.0.0.1:5000/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageData })
  }).then((response) => response.json())
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

const fetchCustomer = (data) => {
  const cachedCustomer = localStorage.getItem(`customer_${data}`)
  if (cachedCustomer) {
    return Promise.resolve(JSON.parse(cachedCustomer))
  }

  const url = `http://127.0.0.1:3000/customers/code/${data}?t=${new Date().getTime()}`
  return fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  })
    .then((response) => {
      if (response.status === 304) {
        console.log(cachedCustomer)

        return JSON.parse(cachedCustomer)
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    })
    .then((customer) => {
      // 新しいデータをキャッシュに保存
      localStorage.setItem(`customer_${data}`, JSON.stringify(customer))
      return customer
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
