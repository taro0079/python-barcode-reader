const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const output = document.getElementById("output")
const context = canvas.getContext("2d")

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream
    video.play()
  })
  .catch((err) => {
    console.log(err)
  })

video.addEventListener("play", () => {
  setInterval(() => {
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
          output.innerHTML += `<p>${barcode.data}</p>`
          context.strokeStyle = "red"
          context.lineWidth = 2
          context.strokeRect(
            barcode.rect.left,
            barcode.rect.top,
            barcode.rect.width,
            barcode.rect.height
          )
        })
      })
      .catch((err) => {
        console.log(err)
      })
  }, 200)
})
