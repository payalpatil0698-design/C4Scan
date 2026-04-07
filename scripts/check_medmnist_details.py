from datasets import load_dataset

configs = ['chestmnist', 'nodulemnist']
for cfg in configs:
    print(f"\n--- Checking {cfg} ---")
    try:
        ds = load_dataset("albertvillanova/medmnist-v2", cfg, split="train[:100]") # Load small chunk
        print(f"Features: {ds.features}")
        if 'label' in ds.features:
            print(f"Label names: {ds.features['label'].names if hasattr(ds.features['label'], 'names') else 'No names attribute'}")
            print(f"Sample label: {ds[0]['label']}")
    except Exception as e:
        print(f"Error: {e}")
