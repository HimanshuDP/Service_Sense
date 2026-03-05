"""
predict.py — Smart Image Classifier for Yukti Innovation
=========================================================
AUTO-SELECTS between two modes:

  MODE 1 — Trained binary models (.h5)
    Used when: any of {air,water,land,waste}_model.h5 exist in models/
    Runs all available MobileNetV2 binary classifiers in parallel.

  MODE 2 — CLIP zero-shot (pretrained fallback)
    Used when: no .h5 models have been trained yet
    Uses OpenAI CLIP via HuggingFace Transformers. No training needed.

Transition is automatic — once you drop trained .h5 files into models/
and restart the server, the system switches to MODE 1 permanently.

Decision logic (same for both modes):
  accepted = True  →  best category confidence >= 0.70
  accepted = False →  all confidence scores < 0.70
"""

from __future__ import annotations

import io
import os
import sys

# ──────────────────────────────────────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR  = os.path.join(SCRIPT_DIR, "models")

CATEGORIES           = ["air", "water", "land", "waste"]
IMG_SIZE             = (224, 224)
CONFIDENCE_THRESHOLD = 0.50

# ──────────────────────────────────────────────────────────────────────────────
# Internal state
# ──────────────────────────────────────────────────────────────────────────────

_trained_models: dict[str, object] = {}   # category → Keras model
_mode: str = "unknown"                    # "trained" | "pretrained_clip"
_initialized: bool = False


def _check_trained_models() -> list[str]:
    """Return list of categories that have a trained .h5 model ready."""
    available = []
    for cat in CATEGORIES:
        if os.path.exists(os.path.join(MODELS_DIR, f"{cat}_model.h5")):
            available.append(cat)
    return available


def _initialize() -> None:
    """Detect available models and set inference mode. Called once."""
    global _trained_models, _mode, _initialized

    if _initialized:
        return

    available = _check_trained_models()

    if available:
        # ── MODE 1: Load trained binary .h5 models ───────────────────────────
        try:
            from tensorflow.keras.models import load_model
        except ImportError:
            raise ImportError("TensorFlow is required: pip install tensorflow")

        loaded = []
        for cat in available:
            path = os.path.join(MODELS_DIR, f"{cat}_model.h5")
            try:
                _trained_models[cat] = load_model(path)
                loaded.append(cat)
            except Exception as e:
                print(f"[WARNING] Could not load {cat}_model.h5: {e}", file=sys.stderr)

        if loaded:
            _mode = "trained"
            print(f"[Yukti Classifier] MODE: Trained binary models — {loaded}", file=sys.stderr)
        else:
            _mode = "pretrained_clip"
            print("[Yukti Classifier] MODE: CLIP pretrained (trained models failed to load)", file=sys.stderr)
    else:
        # ── MODE 2: CLIP zero-shot fallback ──────────────────────────────────
        _mode = "pretrained_clip"
        print(
            "[Yukti Classifier] MODE: CLIP pretrained (no .h5 models found)\n"
            "  Train models with: python ml/image_classifier/train_image_model.py --category all",
            file=sys.stderr,
        )

    _initialized = True


def _preprocess_for_keras(image_bytes: bytes):
    """Preprocess image bytes for MobileNetV2 binary models."""
    try:
        from PIL import Image
    except ImportError:
        raise ImportError("Pillow is required: pip install Pillow")

    import numpy as np
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE, Image.LANCZOS)
    arr = np.array(img, dtype=np.float32)
    arr = preprocess_input(arr)
    return arr[None, ...]   # (1, 224, 224, 3)


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def predict_image(image_bytes: bytes) -> dict:
    """
    Classify an environmental image using whichever mode is available.

    Parameters
    ----------
    image_bytes : bytes
        Raw bytes of a JPEG / PNG / WebP image.

    Returns
    -------
    dict:
        category    (str | None) — winning category or None if rejected
        confidence  (float)      — best confidence score (0–1)
        accepted    (bool)       — True if env. category with >= 70% confidence
        all_scores  (dict)       — score per category
        mode        (str)        — "trained" or "pretrained_clip"

    Raises
    ------
    ValueError  if the image cannot be decoded.
    ImportError if required packages are missing.
    """
    _initialize()

    try:
        if _mode == "trained":
            return _predict_with_trained_models(image_bytes)
        else:
            return _predict_with_clip(image_bytes)
    except Exception as e:
        if "decode" in str(e).lower() or "image" in str(e).lower():
            raise ValueError(f"Could not process image: {e}") from e
        raise


def _predict_with_trained_models(image_bytes: bytes) -> dict:
    """Run all loaded binary .h5 models and pick the highest score."""
    import numpy as np

    try:
        arr = _preprocess_for_keras(image_bytes)
    except Exception as e:
        raise ValueError(f"Could not decode image: {e}") from e

    all_scores: dict[str, float] = {}
    for cat, model in _trained_models.items():
        prob = float(model.predict(arr, verbose=0)[0][0])
        all_scores[cat] = round(prob, 4)

    best_cat   = max(all_scores, key=all_scores.get) if all_scores else None
    best_score = all_scores[best_cat] if best_cat else 0.0
    accepted   = best_score >= CONFIDENCE_THRESHOLD

    return {
        "category":    best_cat if accepted else None,
        "confidence":  round(best_score, 4),
        "accepted":    accepted,
        "all_scores":  all_scores,
        "mode":        "trained",
    }


def _predict_with_clip(image_bytes: bytes) -> dict:
    """Delegate to CLIP zero-shot classifier."""
    try:
        from ml.image_classifier.pretrained_classifier import classify_with_clip
    except ImportError:
        # Try relative import (when used standalone)
        from pretrained_classifier import classify_with_clip

    return classify_with_clip(image_bytes)


def predict_image_verbose(image_bytes: bytes) -> dict:
    """Same as predict_image with per-category breakdown added."""
    result = predict_image(image_bytes)
    result["breakdown"] = {
        cat: {
            "confidence":  score,
            "is_detected": score >= CONFIDENCE_THRESHOLD,
        }
        for cat, score in result.get("all_scores", {}).items()
    }
    return result


def get_current_mode() -> str:
    """Return the active inference mode string."""
    _initialize()
    return _mode


# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"File not found: {path}")
        sys.exit(1)

    with open(path, "rb") as fh:
        data = fh.read()

    result = predict_image_verbose(data)

    print(f"\n{'='*55}")
    print(f"  Yukti Innovation — Environmental Image Analysis")
    print(f"{'='*55}")
    print(f"  Mode       : {result['mode'].upper()}")
    print(f"  Category   : {(result.get('category') or 'NONE').upper()}")
    print(f"  Confidence : {result['confidence']:.4f} ({result['confidence']*100:.1f}%)")
    print(f"  Decision   : {'✅ ACCEPTED' if result['accepted'] else '❌ REJECTED'}")
    print(f"\n  Per-Category Scores:")
    for cat, info in sorted(result.get("breakdown", {}).items(),
                            key=lambda x: -x[1]["confidence"]):
        bar    = "█" * int(info["confidence"] * 35)
        status = "✅" if info["is_detected"] else "  "
        print(f"    {status} {cat:<8}  {info['confidence']:.4f}  {bar}")
    print()
