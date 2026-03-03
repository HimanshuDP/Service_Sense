import joblib
import os
import sys

# Add backend dir to path for imports
sys.path.append(os.path.dirname(__file__))

from services.ml_service import classify

try:
    print("Testing classification...")
    res = classify("Toxic smog covers Mumbai today", "Air quality is very bad.")
    print("Classification result:")
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
