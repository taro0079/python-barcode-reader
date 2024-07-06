import array
import base64
import cv2 as cv
from flask import Flask, jsonify, request
import numpy as np
from pyzbar.pyzbar import decode

# cap = cv.VideoCapture(0)
# cap.set(3, 640)
# cap.set(4, 480)

# while True:
#     ret, frame = cap.read()
#     for barcode in decode(frame):
#         myData = barcode.data.decode("utf-8")
#         print(myData)
#         pts = np.array([barcode.polygon], np.int32)

#         cv.polylines(frame, [pts], True, (0, 255, 0), 5)

#         pts2 = barcode.rect
#         cv.putText(
#             frame,
#             myData,
#             (pts2[0], pts2[1]),
#             cv.FONT_HERSHEY_SIMPLEX,
#             0.9,
#             (255, 0, 0),
#             2,
#         )

#     cv.imshow("test", frame)

#     if cv.waitKey(1) & 0xFF == ord("q"):
#         break

# cap.release()
# cv.destroyAllWindows()


app = Flask(__name__)


@app.route("/decode", methods=["POST"])
def decode_barcode():
    data = request.json["image"]
    image_data = base64.b64decode(data)
    np_arr = np.frombuffer(image_data, np.uint8)
    img = cv.imdecode(np_arr, cv.IMREAD_COLOR)

    barcodes = decode(img)
    result = []
    for barcode in barcodes:
        barcode_data = barcode.data.decode("utf-8")
        result.append({"data": barcode_data, "rect": barcode.rect})
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
