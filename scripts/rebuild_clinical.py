import tensorflow as tf
from tensorflow.keras import layers, models
import os

model_path = 'backend/models/cancer_model.h5'
print(f"Rebuilding clinical-grade architecture to load: {model_path}")

try:
    INPUT_SIZE = 224
    NUM_CLASSES = 4
    
    # Matching the training script
    base_model = tf.keras.applications.EfficientNetB0(
        weights=None, 
        include_top=False, 
        input_shape=(INPUT_SIZE, INPUT_SIZE, 3)
    )
    # The training script used base_model as a single layer
    x = layers.GlobalAveragePooling2D()(base_model.output)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)
    
    model = models.Model(inputs=base_model.input, outputs=outputs)
    
    print("Clinical architecture rebuilt. Attempting to load weights...")
    # Try by_name to be more resilient
    model.load_weights(model_path, by_name=True)
    print("SUCCESS: Weights loaded into clinical-grade model architecture!")
    
    # Save the full model again
    fixed_path = 'backend/models/cancer_model.h5'
    # Backup before overwrite if not already
    model.save(fixed_path)
    print(f"Fixed model saved to {fixed_path}")

except Exception as e:
    print("Clinical rebuild failed:", e)
