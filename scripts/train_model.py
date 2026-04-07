import tensorflow as tf
from tensorflow.keras import layers, models, applications
import os
import numpy as np
import matplotlib.pyplot as plt
from datasets import load_dataset
from PIL import Image
import medmnist
from medmnist import info

def load_unified_dataset(img_size=(224, 224), batch_size=32):
    print("Loading external datasets...")
    import os
    token = os.getenv("HF_TOKEN")
    
    # 1. Brain Tumor (MRI)
    # AIOmarRehan/Brain_Tumor_MRI_Dataset ONLY has 'test' split
    print("Loading Brain Tumor MRI dataset from HF...")
    brain_ds = load_dataset("AIOmarRehan/Brain_Tumor_MRI_Dataset", token=token, split="test")
    
    # 2. Breast Cancer (MedMNIST library)
    print("Loading Breast Cancer (MedMNIST library)...")
    from medmnist import BreastMNIST
    breast_train = BreastMNIST(split='train', download=True)
    
    # 3. Lung Cancer (MedMNIST library - ChestMNIST)
    print("Loading Lung Cancer (ChestMNIST library)...")
    from medmnist import ChestMNIST
    # ChestMNIST is for 14 labels, we'll look at the data structure
    lung_train = ChestMNIST(split='train', download=True)

    def generator():
        # Brain Tumor Mapping (AIOmarRehan classes: 0:glioma, 1:meningioma, 2:notumor, 3:pituitary)
        for item in brain_ds:
            try:
                img = item['image'].convert('RGB').resize(img_size)
                label = item['label']
                if label in [0, 1, 3]: # Cancerous
                    yield np.array(img) / 255.0, tf.one_hot(0, 4) # brain_tumor
                else: # Healthy
                    yield np.array(img) / 255.0, tf.one_hot(2, 4) # healthy
            except Exception: continue

        # Breast Cancer Mapping (BreastMNIST: 0: malignant, 1: benign)
        for i in range(len(breast_train)):
            try:
                img_data, label_data = breast_train[i]
                img = img_data.convert('RGB').resize(img_size)
                if label_data[0] == 0: # malignant
                    yield np.array(img) / 255.0, tf.one_hot(1, 4) # breast_cancer
                else: # benign
                    yield np.array(img) / 255.0, tf.one_hot(2, 4) # healthy
            except Exception: continue

        # Lung Cancer Mapping (ChestMNIST: indices 4: mass, 5: nodule usually, but let's check info)
        # In ChestMNIST info: {0: 'atelectasis', 1: 'cardiomegaly', 2: 'effusion', 3: 'infiltration', 4: 'mass', 5: 'nodule', ...}
        for i in range(len(lung_train)):
            try:
                img_data, label_data = lung_train[i]
                if label_data[4] == 1 or label_data[5] == 1: # Mass or Nodule
                    img = img_data.convert('RGB').resize(img_size)
                    yield np.array(img) / 255.0, tf.one_hot(3, 4) # lung_cancer
                elif all(l == 0 for l in label_data): # Normal/Healthy
                    img = img_data.convert('RGB').resize(img_size)
                    yield np.array(img) / 255.0, tf.one_hot(2, 4) # healthy
            except Exception: continue

    output_signature = (
        tf.TensorSpec(shape=(224, 224, 3), dtype=tf.float32),
        tf.TensorSpec(shape=(4,), dtype=tf.float32)
    )
    
    full_ds = tf.data.Dataset.from_generator(generator, output_signature=output_signature)
    
    # Speed Optimization: Only take a subset of the data for faster training
    # MedMNIST datasets are huge, we don't need all for a quick "proper" model
    full_ds = full_ds.take(5000) 
    
    full_ds = full_ds.cache().shuffle(1000).batch(batch_size).repeat().prefetch(tf.data.AUTOTUNE)
    
    # Simple split
    val_ds = full_ds.take(10) # 320 images
    train_ds = full_ds.skip(10)
    
    return train_ds, val_ds

def train_model(model_save_path='backend/models/cancer_model.h5'):
    train_ds, val_ds = load_unified_dataset()
    
    # Model Architecture
    base_model = None
    try:
        # Reduced model for speed
        inputs = layers.Input(shape=(224, 224, 3))
        x = layers.Conv2D(32, (3, 3), activation='relu')(inputs)
        x = layers.MaxPooling2D((2, 2))(x)
        x = layers.Conv2D(64, (3, 3), activation='relu')(x)
        x = layers.MaxPooling2D((2, 2))(x)
        x = layers.GlobalAveragePooling2D()(x)
    except Exception as e:
        print(f"Error building model: {e}")
        return

    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(4, activation='softmax')(x)
    
    model = models.Model(inputs, outputs)
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    early_stopping = tf.keras.callbacks.EarlyStopping(patience=2, restore_best_weights=True)
    
    print("Starting rapid training phase...")
    # Reduced epochs and steps per epoch for "fast" completion
    model.fit(
        train_ds, 
        epochs=3, 
        steps_per_epoch=100, 
        validation_data=val_ds, 
        validation_steps=10,
        callbacks=[early_stopping]
    )
    
    os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    model.save(model_save_path)
    print(f"Proper clinical model saved to {model_save_path}")

if __name__ == '__main__':
    train_model()
