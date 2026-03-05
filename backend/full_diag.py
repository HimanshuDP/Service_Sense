import sys
import os
import torch
import transformers
import PIL

with open('full_diag.txt', 'w') as f:
    f.write(f"Python: {sys.executable}\n")
    f.write(f"Paths: {sys.path}\n\n")
    f.write(f"TORCH: {torch.__version__} @ {torch.__file__}\n")
    f.write(f"TRANSFORMERS: {transformers.__version__} @ {transformers.__file__}\n")
    f.write(f"PILLOW: {PIL.__version__} @ {PIL.__file__}\n")
    
    # Check for site-packages specifically
    import site
    f.write(f"\nSite Packages: {site.getsitepackages()}\n")
    f.write(f"User Site: {site.getusersitepackages()}\n")
