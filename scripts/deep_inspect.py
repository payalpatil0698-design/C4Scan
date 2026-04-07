import tensorflow as tf
import os
import h5py

model_path = 'backend/models/cancer_model.h5'
print(f"Inspecting integrated model: {model_path}")

try:
    # Try with h5py to see structure if tf fails
    with h5py.File(model_path, 'r') as f:
        print("Groups in H5:", list(f.keys()))
        if 'model_weights' in f:
            print("Model weights found.")
        if 'keras_version' in f.attrs:
            print("Keras version:", f.attrs['keras_version'])

    # Try loading with more options
    try:
        model = tf.keras.models.load_model(model_path, compile=False)
        print("Model loaded with compile=False")
        model.summary()
        print("Classes count:", model.output_shape[-1])
    except Exception as e2:
        print("Standard load failed:", e2)
        # Try as a functional model if possible
        try:
            from tensorflow.keras.layers import TFSMLayer
            # Not really for H5...
            pass
        except:
            pass
            
except Exception as e:
    print(f"Overall inspection failed: {e}")
