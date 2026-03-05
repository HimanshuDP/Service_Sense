import traceback
import sys
import os

# Add the current directory to path
sys.path.append(os.getcwd())

try:
    from ml.image_classifier.predict import predict_image
    print("Import successful")
    
    with open('test_plastic_waste.jpg', 'rb') as f:
        data = f.read()
    
    print(f"Read {len(data)} bytes of image data")
    
    res = predict_image(data)
    print("\n--- RESULT ---")
    print(res)
except Exception:
    print("\n--- TRACEBACK ---")
    traceback.print_exc()
