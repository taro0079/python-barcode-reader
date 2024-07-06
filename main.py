import cv2 as cv
import numpy as np
from pyzbar.pyzbar import decode

cap = cv.VideoCapture(0)
cap.set(3, 640)
cap.set(4, 480)

while True:
    ret, frame = cap.read()
    for barcode in decode(frame):
        print(barcode.data)
    cv.imshow("test", frame)
    if cv.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv.destroyAllWindows()
