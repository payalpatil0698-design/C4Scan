from huggingface_hub import HfApi
import os

import os
token = os.getenv("HF_TOKEN")

try:
    api = HfApi()
    user = api.whoami(token=token)
    print(f"Logged in as: {user['name']}")
    
    author = "Sarmad"
    print(f"\n--- Datasets by {author} ---")
    datasets = api.list_datasets(author=author, token=token)
    for ds in datasets:
        print(f"ID: {ds.id} | Downloads: {ds.downloads}")
except Exception as e:
    print(f"Error: {e}")
