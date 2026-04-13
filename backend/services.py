import tensorflow as tf
import cv2
import numpy as np
import pytesseract
from PIL import Image
import os
import PyPDF2
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import pydicom
import traceback

class PredictionService:
    def __init__(self, model_path=None, model2_path=None):
        if model_path is None:
            # Default to path relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.model_path = os.path.join(base_dir, 'backend', 'models', 'cancer_model_balanced.h5')
        else:
            self.model_path = model_path
            
        if model2_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.model2_path = os.path.join(base_dir, 'cancer_detection_model.h5')
        else:
            self.model2_path = model2_path
            
        self.model = None
        self.model2 = None
        # True Mapping derived from train_model.py
        self.class_indices = {0: 'Brain Tumor', 1: 'Breast Cancer', 2: 'Normal', 3: 'Lung Cancer'}

    def load_model(self):
        if self.model is None:
            if os.path.exists(self.model_path):
                import tensorflow as tf
                tf.get_logger().setLevel('ERROR')
                try:
                    # Our balanced model includes a Rescaling layer at the top
                    self.model = tf.keras.models.load_model(self.model_path, compile=False)
                    print(f"Balanced Model loaded successfully from {self.model_path}")
                except Exception as e:
                    print(f"Direct load failed: {e}. Attempting architecture rebuild...")
                    try:
                        base_model = tf.keras.applications.EfficientNetB0(
                            include_top=False, weights=None, input_shape=(224, 224, 3)
                        )
                        model = tf.keras.models.Sequential([
                            tf.keras.layers.Input(shape=(224, 224, 3)),
                            base_model,
                            tf.keras.layers.GlobalAveragePooling2D(),
                            tf.keras.layers.BatchNormalization(),
                            tf.keras.layers.Dropout(0.3),
                            tf.keras.layers.Dense(256, activation='relu'),
                            tf.keras.layers.Dense(4, activation='softmax')
                        ])
                        model.load_weights(self.model_path)
                        self.model = model
                        print("Weights successfully loaded into manual balanced architecture.")
                    except Exception as rebuild_e:
                        print(f"Rebuild failed: {rebuild_e}")
            else:
                print(f"Model file not found at {self.model_path}")
                
        return self.model, None

    def correlate_results(self, scan_label, text_context):
        if not text_context:
            return scan_label, 1.0
        
        keywords = self.analyze_keywords(text_context)
        # Mapping keywords to labels
        k_map = {
            'malignant': 'cancer',
            'tumor': 'tumor',
            'carcinoma': 'cancer',
            'benign': 'Normal',
            'normal': 'Normal'
        }
        
        text_hits = [k_map[k] for k in keywords if k in k_map]
        
        # Boost confidence if both agree
        boost = 1.0
        if any(h in scan_label.lower() for h in text_hits):
            boost = 1.2 # 20% boost for cross-verification
        elif text_hits and not any(h in scan_label.lower() for h in text_hits):
            boost = 0.5 # Substantial penalty for contradiction
            
            # If text indicates healthy but scan says cancer, or vice versa,
            # we should trust the explicit clinical report text context more 
            # as a definitive ground truth override in this application.
            if 'Normal' in text_hits:
                scan_label = 'Normal'
                boost = 1.0 # Reset boost for the new label
            elif 'cancer' in text_hits or 'tumor' in text_hits:
                # If text says tumor/cancer, but scan was healthy, we might just flag it
                pass
            
        return scan_label, min(boost, 1.5) # Cap boost

    def predict_scan(self, img_path, text_context=None, user_city=None, nearby_doctors=None):
        model1, _ = self.load_model()
        if model1 is None:
            return None, 0.0, None, None, None
        
        # Handle DICOM or standard image
        if img_path.lower().endswith('.dcm'):
            try:
                ds = pydicom.dcmread(img_path)
                img = ds.pixel_array
                if len(img.shape) == 2:
                    img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
                img = img.astype(float)
                img = (img - np.min(img)) / (np.max(img) - np.min(img)) * 255.0
                img = img.astype(np.uint8)
            except Exception as e:
                print(f"Error reading DICOM for prediction: {e}")
                return None, 0.0, None, None, None
        else:
            img = cv2.imread(img_path)
            if img is not None:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        if img is None:
            return None, 0.0, None, None, None

        img = cv2.resize(img, (224, 224))
        img = np.expand_dims(img, axis=0)

        # Pure inference from custom .h5 model
        label = "Unknown"
        confidence = 0.0
        class_idx = 0
        
        try:
            preds = model1.predict(img)
            class_idx = int(np.argmax(preds[0]))
            confidence = float(np.max(preds[0]))
            label = self.class_indices.get(class_idx, "Unknown")
        except Exception as e:
            print(f"Prediction error: {e}")
            return None, 0.0, None, None, None
            
        # No demo mode constraints, output pure model inference.
            
        severity = self.calculate_severity(label, confidence)
        recommendation = self.get_clinical_recommendation(label, severity, user_city, nearby_doctors)
        
        if confidence < 0.70:
            recommendation += "\nDisclaimer: Prediction confidence is low. Please consult a medical professional."

        heatmap_path = None
        try:
            # For Sequential models with Functional base, we need to access the base model layers
            all_layers = []
            for layer in model1.layers:
                if hasattr(layer, 'layers'): # It's a nested model
                    all_layers.extend(layer.layers)
                else:
                    all_layers.append(layer)
            
            conv_layers = [l.name for l in all_layers if 'conv' in l.name.lower()]
            if conv_layers:
                last_conv = conv_layers[-1]
                heatmap = self.make_gradcam_heatmap(img, model1, last_conv, pred_index=class_idx)
                
                # Make sure the image path has a valid extension
                base_name = os.path.basename(img_path)
                name, ext = os.path.splitext(base_name)
                heatmap_filename = f"cam_{name}.jpg"
                
                heatmap_path = os.path.join(os.path.dirname(img_path), heatmap_filename)
                
                # img input is already 0-255 scale
                viz_img = img[0].astype(np.uint8)
                viz_img = cv2.cvtColor(viz_img, cv2.COLOR_RGB2BGR)
                self.save_gradcam(viz_img, heatmap, heatmap_path)
        except Exception as e:
            print(f"Grad-CAM Error: {e}")

        return label, confidence, heatmap_path, severity, recommendation

    def calculate_severity(self, label, confidence):
        if label.lower() == 'normal':
            return 'Low'
        
        if confidence > 0.90:
            return 'Critical'
        elif confidence > 0.70:
            return 'High'
        else:
            return 'Medium'

    def get_clinical_recommendation(self, label, severity, user_city=None, nearby_doctors=None):
        base_recs = {
            'Brain Tumor': "Neurologist",
            'Lung Cancer': "Oncologist/Pulmonologist",
            'Skin Cancer': "Dermatologist",
            'Blood Cancer': "Hematologist",
            'Normal': "No immediate specialist required",
        }
        
        specialist_type = base_recs.get(label, "General Oncologist")
        rec = f"Refer to {specialist_type}. "
        
        if severity == 'Critical':
            rec += "EMERGENCY: Immediate medical consultation and advanced imaging required within 24 hours. "
        elif severity == 'High':
            rec += "URGENT: Schedule specialized review and biopsy/PET-CT assessment. "
        elif severity == 'Medium':
            rec += "ADVISORY: Follow-up and further clinical correlation advised. "

        # Add nearby specialist suggestions
        if nearby_doctors and len(nearby_doctors) > 0:
            rec += f"\n\nSuggested Specialists in {user_city or 'your area'}:"
            for doc in nearby_doctors:
                rec += f"\n- {doc['name']} ({doc['specialization'] or specialist_type})"
        elif user_city:
            rec += f"\n\nNote: No specific {specialist_type}s found in {user_city}. Please consult the nearest oncology hub."
            
        return rec

    def make_gradcam_heatmap(self, img_array, model, last_conv_layer_name, pred_index=None):
        grad_model = tf.keras.models.Model(
            model.inputs, [model.get_layer(last_conv_layer_name).output, model.output]
        )

        with tf.GradientTape() as tape:
            last_conv_layer_output, preds = grad_model(img_array)
            if pred_index is None:
                pred_index = tf.argmax(preds[0])
            class_channel = preds[:, pred_index]

        grads = tape.gradient(class_channel, last_conv_layer_output)
        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

        last_conv_layer_output = last_conv_layer_output[0]
        heatmap = last_conv_layer_output @ pooled_grads[..., tf.newaxis]
        heatmap = tf.squeeze(heatmap)

        heatmap = tf.maximum(heatmap, 0)
        max_heat = tf.math.reduce_max(heatmap)
        if max_heat > 0:
            heatmap = heatmap / max_heat
        return heatmap.numpy()

    def save_gradcam(self, bgr_img, heatmap, cam_path):
        heatmap = cv2.resize(heatmap, (bgr_img.shape[1], bgr_img.shape[0]))
        heatmap = np.uint8(255 * heatmap)
        heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
        superimposed_img = cv2.addWeighted(bgr_img, 0.6, heatmap, 0.4, 0)
        cv2.imwrite(cam_path, superimposed_img)
        return cam_path

    def extract_text(self, pdf_path):
        if pdf_path.lower().endswith('.txt'):
            try:
                with open(pdf_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except Exception as e:
                print(f"Text Read Error: {e}")
                return "Failed to read text file."

        if pdf_path.lower().endswith('.pdf'):
            try:
                text = ""
                with open(pdf_path, 'rb') as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
                
                if text.strip():
                    return text
                # If no text could be extracted, maybe it's an image-only PDF.
            except Exception as e:
                print(f"PDF Parsing Error: {e}")

        # In a real scenario, we'd use PyPDF2 to extract images or text
        # For simplicity, we'll assume it's an image-based PDF or direct image
        # If it's a PDF, we'd normally convert to image first.
        try:
            text = pytesseract.image_to_string(Image.open(pdf_path))
            return text
        except Exception as e:
            print(f"OCR Error: {e}")
            return "OCR failed or file not readable as image."

    def extract_dicom_metadata(self, filepath):
        if not filepath.lower().endswith('.dcm'):
            return {"type": "Standard Image", "metadata": {}}
            
        try:
            ds = pydicom.dcmread(filepath)
            metadata = {
                "PatientName": str(ds.PatientName) if hasattr(ds, 'PatientName') else "N/A",
                "PatientID": str(ds.PatientID) if hasattr(ds, 'PatientID') else "N/A",
                "Modality": str(ds.Modality) if hasattr(ds, 'Modality') else "N/A",
                "StudyDate": str(ds.StudyDate) if hasattr(ds, 'StudyDate') else "N/A",
                "Manufacturer": str(ds.Manufacturer) if hasattr(ds, 'Manufacturer') else "N/A"
            }
            return {"type": "DICOM", "metadata": metadata}
        except Exception as e:
            print(f"DICOM Read Error: {e}")
            return {"type": "Non-compliant file", "metadata": {}}

    def analyze_keywords(self, text):
        keywords = ['malignant', 'benign', 'carcinoma', 'tumor', 'metastasis', 'lesion', 'normal']
        found = [kw for kw in keywords if kw in text.lower()]
        return found

    def send_email_simulation(self, user_email, prediction, confidence):
        print(f"--- EMAIL SIMULATION ---")
        print(f"TO: {user_email}")
        print(f"SUBJECT: Diagnostic Report Ready - C4Scan")
        print(f"CONTENT: Your diagnostic scan has been processed.")
        print(f"RESULT: {prediction} ({confidence * 100:.2f}% confidence)")
        print(f"------------------------")
        return True
