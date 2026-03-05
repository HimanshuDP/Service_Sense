"""
predict.py — Multi-Binary-Model Inference for Yukti Innovation
===============================================================
Loads up to 4 binary MobileNetV2 models (one per environmental category)
and runs them all on a single uploaded image.

Decision logic:
  - Find the category with the HIGHEST confidence score
  - If that score >= 0.70  →  post ACCEPTED with that category
  - If all scores < 0.70   →  post REJECTED (not environmental)

Models expected at: ml/image_classifier/models/
  air_model.h5
  water_model.h5
  land_model.h5
  waste_model.h5
  (missing models are skipped gracefully — train at least one to start)
"""

from __future__ import annotations

import io
import os
import sys
from typing import Optional

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR  = os.path.join(SCRIPT_DIR, "models")

CATEGORIES          = ["air", "water", "land", "waste"]
IMG_SIZE            = (224, 224)
CONFIDENCE_THRESHOLD = 0.70

# ──────────────────────────────────────────────────────────────────────────────
# Internal state — models loaded lazily on first request
# ──────────────────────────────────────────────────────────────────────────────

_models: dict[str, object] = {}   # category → Keras model
_tf_ready: bool = False


def _load_all_models() -> None:
    """Load all available binary models into memory (called once)."""
    global _models, _tf_ready

    if _tf_ready:
        return

    try:
        import tensorflow as tf
        from tensorflow.keras.models import load_model
    except ImportError:
        raise ImportError(
            "TensorFlow is not installed.\n"
            "Run:  pip install tensorflow Pillow"
        )

    loaded = []
    missing = []

    for cat in CATEGORIES:
        model_path = os.path.join(MODELS_DIR, f"{cat}_model.h5")
        if os.path.exists(model_path):
            try:
                _models[cat] = load_model(model_path)
                loaded.append(cat)
            except Exception as e:
                print(f"[WARNING] Could not load {cat}_model.h5: {e}", file=sys.stderr)
        else:
            missing.append(cat)

    if not loaded:
        raise FileNotFoundError(
            f"No trained models found in: {MODELS_DIR}\n"
            "Train at least one model first:\n"
            "  python ml/image_classifier/train_image_model.py --category air\n"
            "  python ml/image_classifier/train_image_model.py --category waste\n"
            "  ... (or --category all)"
        )

    if missing:
        print(
            f"[INFO] Models loaded: {loaded} | Not yet trained: {missing}",
            file=sys.stderr,
        )

    _tf_ready = True


def _preprocess_image(image_bytes: bytes):
    """Decode raw bytes, resize to 224×224, apply MobileNetV2 preprocessing."""
    try:
        from PIL import Image
    except ImportError:
        raise ImportError("Pillow is not installed. Run:  pip install Pillow")

    import numpy as np
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    arr = preprocess_input(arr)
    return arr[np.newaxis, ...]   # shape: (1, 224, 224, 3)


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def predict_image(image_bytes: bytes) -> dict:
    """
    Run all available binary models on the image and return the verdict.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of a JPEG / PNG / WebP image.

    Returns
    -------
    dict:
        category   (str | None) — winning category, or None if rejected
        confidence (float)      — confidence of the winning category (0–1)
        accepted   (bool)       — True if environmental and confident
        all_scores (dict)       — confidence from every loaded model
        models_used (list)      — categories whose models were available

    Raises
    ------
    FileNotFoundError  if no models have been trained yet.
    ValueError         if the image cannot be decoded.
    """
    _load_all_models()

    try:
        arr = _preprocess_image(image_bytes)
    except Exception as e:
        raise ValueError(f"Could not decode image: {e}") from e

    all_scores: dict[str, float] = {}

    for cat, model in _models.items():
        # Binary sigmoid output → probability of "positive" (environmental) class
        prob = float(model.predict(arr, verbose=0)[0][0])
        all_scores[cat] = round(prob, 4)

    # Pick the category with the highest confidence
    if all_scores:
        best_cat   = max(all_scores, key=all_scores.get)
        best_score = all_scores[best_cat]
    else:
        best_cat   = None
        best_score = 0.0

    accepted = best_score >= CONFIDENCE_THRESHOLD

    return {
        "category":    best_cat if accepted else None,
        "confidence":  round(best_score, 4),
        "accepted":    accepted,
        "all_scores":  all_scores,
        "models_used": list(_models.keys()),
    }


def predict_image_verbose(image_bytes: bytes) -> dict:
    """Same as predict_image but includes detailed per-model breakdown."""
    result = predict_image(image_bytes)

    breakdown = {}
    for cat, score in result["all_scores"].items():
        breakdown[cat] = {
            "confidence": score,
            "is_detected": score >= CONFIDENCE_THRESHOLD,
        }
    result["breakdown"] = breakdown
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Quick CLI test
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(f"File not found: {img_path}")
        sys.exit(1)

    with open(img_path, "rb") as fh:
        data = fh.read()

    result = predict_image_verbose(data)

    print(f"\n{'='*50}")
    print(f"  Yukti Innovation — Image Analysis Result")
    print(f"{'='*50}")
    print(f"  Models used  : {result['models_used']}")
    print(f"  Category     : {(result['category'] or 'NONE').upper()}")
    print(f"  Confidence   : {result['confidence']:.4f} ({result['confidence']*100:.1f}%)")
    print(f"  Decision     : {'✅ ACCEPTED' if result['accepted'] else '❌ REJECTED'}")
    print(f"\n  Per-model Scores:")
    for cat, info in sorted(result["breakdown"].items(), key=lambda x: -x[1]["confidence"]):
        bar    = "█" * int(info["confidence"] * 30)
        status = "✅" if info["is_detected"] else "  "
        print(f"    {status} {cat:<8}  {info['confidence']:.4f}  {bar}")
    print()
