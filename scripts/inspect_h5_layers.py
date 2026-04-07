import h5py

model_path = 'backend/models/cancer_model.h5'
with h5py.File(model_path, 'r') as f:
    if 'model_weights' in f:
        print("Layer names in model_weights:")
        print(list(f['model_weights'].keys()))
    else:
        print("Model structure keys:", list(f.keys()))
        if 'top_level_model_weights' in f:
             print("Found top_level_model_weights")
