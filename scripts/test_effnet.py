import tensorflow as tf
from tensorflow.keras import applications

print("TF Version:", tf.__version__)
print("Image Data Format:", tf.keras.backend.image_data_format())

try:
    print("Building EfficientNetB0 (224, 224, 3)...")
    base_model = applications.EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3)
    )
    print("Success!")
except Exception as e:
    print(f"Failed: {e}")
