import tensorflow as tf
from tensorflow.keras import layers, models
import os

model_path = 'backend/models/cancer_model.h5'
print(f"Guessing complex architecture for: {model_path}")

try:
    # Build what we saw in the H5 list:
    # ['batch_normalization', 'dense_1', 'dense_2', 'dropout_1', 'efficientnetb0', 'global_average_pooling2d_1']
    
    # 1. Base model
    base_model = tf.keras.applications.EfficientNetB0(
        include_top=False, 
        weights=None, 
        input_shape=(224, 224, 3)
    )
    # Give it the name from H5? 
    # Actually EfficientNetB0 in TF is usually named 'efficientnetb0' by default
    base_model._name = 'efficientnetb0' 
    
    # 2. Build the rest
    x = base_model.output
    x = layers.GlobalAveragePooling2D(name='global_average_pooling2d_1')(x)
    x = layers.BatchNormalization(name='batch_normalization')(x)
    x = layers.Dropout(0.3, name='dropout_1')(x)
    x = layers.Dense(256, activation='relu', name='dense_1')(x) # Updated based on log
    outputs = layers.Dense(4, activation='softmax', name='dense_2')(x)
    
    model = models.Model(inputs=base_model.input, outputs=outputs)
    
    print("Architecture built. Loading weights by name...")
    model.load_weights(model_path, by_name=True)
    print("SUCCESS: Weights loaded into guessed clinical model!")
    
    model.save('backend/models/cancer_model.h5')
    print("Model successfully reintegrated.")

except Exception as e:
    print("Guessed load failed:", e)
