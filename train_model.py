import tensorflow as tf
from tensorflow.keras import layers, models, applications
from datasets import load_dataset
import numpy as np
import cv2
import os
import medmnist
from medmnist import BreastMNIST, PneumoniaMNIST

# Configuration
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.0001
MODEL_SAVE_PATH = 'backend/models/cancer_model.h5'

# Label Mapping
# 0: brain_tumor
# 1: breast_cancer
# 2: healthy
# 3: lung_cancer

def resize_and_process(img, label_val):
    img = np.array(img)
    # Convert to RGB if grayscale
    if len(img.shape) == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 1:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4: # RGBA
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
        
    # Resize
    if img.shape[:2] != IMG_SIZE:
        img = cv2.resize(img, IMG_SIZE)
        
    img = img / 255.0
    return img.astype(np.float32), int(label_val)

def master_generator():
    # 1. Brain Tumor
    print("Yielding Brain Tumor Data...")
    try:
        brain_ds = load_dataset("AIOmarRehan/Brain_Tumor_MRI_Dataset", split="test")
        for item in brain_ds:
            lbl = item['label']
            # Original: 0: glioma, 1: meningioma, 2: notumor, 3: pituitary
            mapped_lbl = 2 if lbl == 2 else 0
            
            img, final_lbl = resize_and_process(item['image'], mapped_lbl)
            yield img, final_lbl
    except Exception as e:
        print(f"Error yielding brain data: {e}")

    # 2. Breast MNIST
    print("Yielding BreastMNIST...")
    try:
        data = BreastMNIST(split='train', download=True, size=224)
        inputs = data.imgs
        targets = data.labels
        
        for i in range(len(inputs)):
            lbl = targets[i]
            val = int(lbl[0]) if isinstance(lbl, (list, np.ndarray)) else int(lbl)
            # 0: malignant -> 1 (breast_cancer), 1: normal -> 2 (healthy)
            mapped_lbl = 1 if val == 0 else 2
            
            img, final_lbl = resize_and_process(inputs[i], mapped_lbl)
            yield img, final_lbl
    except Exception as e:
        print(f"Error yielding breast data: {e}")

    # 3. Lung (PneumoniaMNIST) 
    print("Yielding PneumoniaMNIST...")
    try:
        data = PneumoniaMNIST(split='train', download=True, size=224)
        inputs = data.imgs
        targets = data.labels
        
        for i in range(len(inputs)):
            lbl = targets[i]
            val = int(lbl[0]) if isinstance(lbl, (list, np.ndarray)) else int(lbl)
            # 1: pneumonia -> 3 (lung_cancer/issue), 0: normal -> 2 (healthy)
            mapped_lbl = 3 if val == 1 else 2
            
            img, final_lbl = resize_and_process(inputs[i], mapped_lbl)
            yield img, final_lbl
    except Exception as e:
        print(f"Error yielding pneumonia data: {e}")

def main():
    print("Setting up dataset generator...")
    
    # Calculate dataset size roughly just for info (optional, skip for speed)
    # We'll just define output signature
    
    full_ds = tf.data.Dataset.from_generator(
        master_generator,
        output_signature=(
            tf.TensorSpec(shape=(224, 224, 3), dtype=tf.float32),
            tf.TensorSpec(shape=(), dtype=tf.int32)
        )
    )
    
    full_ds = full_ds.shuffle(1000).batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)

    # Model Architecture
    print("Building model...")
    base_model = applications.EfficientNetB0(
        include_top=False,
        weights='imagenet',
        input_shape=(224, 224, 3)
    )
    base_model.trainable = False 

    x = layers.GlobalAveragePooling2D()(base_model.output)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(4, activation='softmax')(x) 

    model = models.Model(inputs=base_model.input, outputs=outputs)
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    print("Starting training...")
    try:
        model.fit(full_ds, epochs=EPOCHS)
        
        # Save
        os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
        model.save(MODEL_SAVE_PATH)
        print(f"Model saved to {MODEL_SAVE_PATH}")
    except Exception as e:
        print(f"Training loop failed: {e}")

if __name__ == "__main__":
    main()
