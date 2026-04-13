import h5py

for fname in ['cancer_model.h5', 'cancer_detection_model.h5']:
    print(fname)
    try:
        f = h5py.File(fname, 'r+')
        if 'model_config' in f.attrs:
            config = f.attrs['model_config']
            if isinstance(config, bytes):
                config = config.decode('utf-8')
            config = config.replace('"batch_shape":', '"batch_input_shape":')
            f.attrs['model_config'] = config.encode('utf-8')
            print("Fixed config")
        f.close()
    except Exception as e:
        print(e)
