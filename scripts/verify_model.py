from services import PredictionService
import os

print("Testing model loading and prediction...")
try:
    service = PredictionService()
    model = service.load_model()
    if model:
        print("Model loaded successfully.")
        # Create a dummy image to test prediction
        import cv2
        import numpy as np
        dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
        cv2.imwrite("test_dummy.jpg", dummy_img)
        
        label, conf, heatmap = service.predict_scan("test_dummy.jpg")
        print(f"Prediction: {label}, Confidence: {conf}")
        
        # Clean up
        os.remove("test_dummy.jpg")
        if heatmap and os.path.exists(heatmap):
            os.remove(heatmap)
    else:
        print("Model failed to load.")
except Exception as e:
    print(f"Error: {e}")
