import numpy as np
import cv2
import os
from sklearn.model_selection import train_test_split

def generate_synthetic_data(base_path='data', num_samples=200):
    classes = ['healthy', 'brain_tumor', 'lung_cancer', 'breast_cancer']
    img_size = (224, 224)
    
    for cls in classes:
        os.makedirs(os.path.join(base_path, cls), exist_ok=True)
        print(f"Generating samples for {cls}...")
        
        for i in range(num_samples):
            # Create a base gray image
            img = np.random.randint(20, 50, (img_size[0], img_size[1], 3), dtype=np.uint8)
            
            # Add some "biological" noise/shapes
            center = (img_size[0]//2, img_size[1]//2)
            if cls == 'healthy':
                # Normal organ structure (smooth oval)
                cv2.ellipse(img, center, (60, 80), 0, 0, 360, (80, 80, 80), -1)
            elif cls == 'brain_tumor':
                # Large bright spot in one hemisphere
                cv2.ellipse(img, center, (60, 80), 0, 0, 360, (80, 80, 80), -1)
                cv2.circle(img, (center[0]+20, center[1]-30), 15, (200, 200, 200), -1)
            elif cls == 'lung_cancer':
                # Mottled background with specific nodes
                cv2.ellipse(img, center, (70, 90), 0, 0, 360, (60, 60, 60), -1)
                for _ in range(3):
                    pt = (np.random.randint(80, 140), np.random.randint(80, 140))
                    cv2.circle(img, pt, 8, (180, 180, 180), -1)
            elif cls == 'breast_cancer':
                # Calcifications (tiny bright dots)
                cv2.ellipse(img, center, (50, 70), 0, 0, 360, (90, 90, 90), -1)
                for _ in range(10):
                    pt = (np.random.randint(90, 130), np.random.randint(90, 130))
                    cv2.circle(img, pt, 2, (255, 255, 255), -1)
            
            # Apply blur to make it look like a scan
            img = cv2.GaussianBlur(img, (5, 5), 0)
            
            # Save image
            file_path = os.path.join(base_path, cls, f"{cls}_{i}.png")
            cv2.imwrite(file_path, img)

if __name__ == '__main__':
    generate_synthetic_data()
