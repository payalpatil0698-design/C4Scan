import tensorflow as tf
import numpy as np
import os

model_path = 'backend/models/cancer_model.h5'
print(f"Verifying prediction capability of: {model_path}")

try:
    model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully!")
    
    # Dummy data
    dummy_input = np.random.rand(1, 224, 224, 3)
    preds = model.predict(dummy_input)
    print("Prediction successful!")
    print("Output shape:", preds.shape)
    print("Probabilities:", preds[0])
    
except Exception as e:
    print("Verification failed:", e)
