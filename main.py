import base64
from typing import Any, List, Dict
import cv2 as cv
from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
from pyzbar.pyzbar import decode
import requests

# cap = cv.VideoCapture(0


app = Flask(__name__)
CORS(app)


@app.route("/decode", methods=["POST"])
def decode_barcode():
    if not request.json or "image" not in request.json:
        return jsonify({"error": "No image data found"})
    data: str = request.json.get("image")

    image_data = base64.b64decode(data)
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv.imdecode(np_arr, cv.IMREAD_COLOR)
    # cv.imwrite("test.jpg", img)
    # gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)

    # barcodes = decode(gray)
    barcodes: List[Any] = decode(img)

    result: List[Dict[str, Any]] = []
    for barcode in barcodes:
        barcode_data = barcode.data.decode("utf-8")
        call_product_api(barcode_data)
        rect = barcode.rect
        result.append(
            {
                "data": barcode_data,
                "rect": {
                    "left": rect.left,
                    "top": rect.top,
                    "width": rect.width,
                    "height": rect.height,
                },
            }
        )
    print(result)
    return jsonify(result)


def call_product_api(barcode_data: str):
    url = "http://localhost:3000/products/code/{}".format(barcode_data)
    headers = {"Content-Type": "application/json", "Accept": "application/json"}

    response = requests.get(url, headers=headers)
    print(response.json())


if __name__ == "__main__":
    app.run(debug=True)
