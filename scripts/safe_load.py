import tensorflow as tf
import os

model_path = 'backend/models/cancer_model.h5'
print(f"Loading with safe_mode=False and compile=False: {model_path}")

try:
    # Some environments need this
    model = tf.keras.models.load_model(model_path, compile=False, safe_mode=False)
    print("SUCCESS: Model loaded!")
    model.summary()
except Exception as e:
    print("Failed with current settings:", e)
