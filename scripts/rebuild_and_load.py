import tensorflow as tf
import os

model_path = 'backend/models/cancer_model.h5'
print(f"Manually rebuilding architecture to load weights from: {model_path}")

try:
    # Assuming standard EfficientNetB0 + GAP + Dense(4) based on train_model.py
    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False, 
        weights=None, 
        input_shape=(224, 224, 3)
    )
    x = tf.keras.layers.GlobalAveragePooling2D()(base_model.output)
    outputs = tf.keras.layers.Dense(4, activation='softmax')(x)
    model = tf.keras.Model(inputs=base_model.input, outputs=outputs)
    
    print("Architecture rebuilt. Loading weights...")
    model.load_weights(model_path)
    print("SUCCESS: Weights loaded successfully into rebuilt architecture!")
    
    # Save it back as a fixed model if it works
    fixed_path = 'backend/models/cancer_model_fixed.h5'
    model.save(fixed_path)
    print(f"Fixed model saved to {fixed_path}")
    
except Exception as e:
    print("Manual weight load failed:", e)
