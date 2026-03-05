import sys
import os

print("--- DIAGNOSTICS ---")
print(f"Python Executable: {sys.executable}")
print(f"Current Directory: {os.getcwd()}")
print(f"Python Path: {sys.path}")

try:
    import torch
    print(f"Torch: {torch.__version__} @ {torch.__file__}")
except ImportError as e:
    print(f"Torch Import Failed: {e}")

try:
    import transformers
    print(f"Transformers: {transformers.__version__} @ {transformers.__file__}")
except ImportError as e:
    print(f"Transformers Import Failed: {e}")

try:
    from PIL import Image
    print(f"Pillow (PIL): {Image.__version__}")
except ImportError as e:
    print(f"Pillow Import Failed: {e}")

print("--- END DIAGNOSTICS ---")
