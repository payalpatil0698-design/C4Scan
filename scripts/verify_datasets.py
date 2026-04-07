from datasets import load_dataset, get_dataset_config_names

import os
token = os.getenv("HF_TOKEN")

datasets_to_check = [
    ("AIOmarRehan/Brain_Tumor_MRI_Dataset", None),
    ("albertvillanova/medmnist-v2", "breastmnist"),
    ("albertvillanova/medmnist-v2", "chestmnist")
]

for ds_id, config in datasets_to_check:
    print(f"\nChecking {ds_id} (Config: {config})...")
    try:
        ds = load_dataset(ds_id, config, token=token)
        print(f"Splits: {list(ds.keys())}")
        for split in ds.keys():
            print(f"Split {split} features: {ds[split].features}")
            if 'label' in ds[split].features:
                print(f"Classes in {split}: {ds[split].features['label'].names}")
            break # Just need one split for feature info
    except Exception as e:
        print(f"Error checking {ds_id}: {e}")
