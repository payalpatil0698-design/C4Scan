import tensorflow as tf
import os

model_path = 'cancer_model.h5'
if not os.path.exists(model_path):
    print(f"Model not found at {model_path}")
else:
    try:
        model = tf.keras.models.load_model(model_path, compile=False)
        print(f"Model summary for {model_path}:")
        model.summary()
        print(f"Input shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")
    except Exception as e:
        print(f"Error loading model: {e}")
