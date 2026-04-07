import keras
import os

model_path = 'backend/models/cancer_model.h5'
print(f"Loading with standalone keras (v3): {model_path}")

try:
    if os.path.exists(model_path):
        model = keras.saving.load_model(model_path)
        print("Model loaded with keras.saving.load_model!")
        model.summary()
    else:
        print("Model not found.")
except Exception as e:
    print("Keras 3 load failed:", e)
