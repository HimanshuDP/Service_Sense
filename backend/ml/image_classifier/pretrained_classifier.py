"""
pretrained_classifier.py — CLIP Zero-Shot Environmental Image Classifier
=========================================================================
Uses OpenAI's CLIP model (via HuggingFace Transformers) to classify
environmental images without any training data required.

This is the FALLBACK classifier used when no trained .h5 binary models
are found. Once you train your own models, predict.py will automatically
switch to using them instead.

Install dependencies:
  pip install transformers torch torchvision
  # For CPU-only (smaller download):
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
  pip install transformers
"""

from __future__ import annotations

import io
import sys
import os
from typing import Optional

# ──────────────────────────────────────────────────────────────────────────────
# Category prompts — descriptive text CLIP uses to understand each category
# More specific prompts = better accuracy
# ──────────────────────────────────────────────────────────────────────────────

CATEGORY_PROMPTS: dict[str, list[str]] = {
    "air": [
        "air pollution with thick smoke and smog",
        "industrial factory emitting smoke and toxic emissions",
        "hazy polluted sky with visible smog layer",
        "burning waste causing air pollution",
        "heavy smoke from chimneys polluting the air",
    ],
    "water": [
        "water pollution in a river or lake",
        "oil spill on water surface causing pollution",
        "dirty contaminated water body with waste",
        "polluted river with garbage and chemical waste",
        "toxic effluent discharge into water",
    ],
    "land": [
        "deforestation with cleared and damaged forest",
        "land degradation with soil erosion",
        "burned forest land after wildfire",
        "illegal mining causing land destruction",
        "barren land with environmental damage",
    ],
    "waste": [
        "garbage dump with piles of trash and litter",
        "plastic waste pollution on the ground",
        "landfill site with mountains of garbage",
        "illegal waste dumping in an open area",
        "scattered plastic bottles and trash on road",
    ],
    "general": [
        "a photo of a person, animal, or everyday object",
        "a normal city street or building without pollution",
        "a clean landscape or generic background",
        "a picture of a dog, cat, or pet",
        "a screenshot of text or an application",
    ],
}

# Best single representative prompt per category (used for scoring)
BEST_PROMPTS: dict[str, str] = {
    "air":   "air pollution with smoke and smog",
    "water": "polluted water body with contamination",
    "land":  "deforestation and damaged land",
    "waste": "garbage dump with plastic waste and litter",
}

CONFIDENCE_THRESHOLD = 0.30

# ──────────────────────────────────────────────────────────────────────────────
# Singleton state
# ──────────────────────────────────────────────────────────────────────────────

_clip_model     = None
_clip_processor = None
_clip_ready     = False


def _load_clip() -> None:
    """Load CLIP model once."""
    global _clip_model, _clip_processor, _clip_ready

    if _clip_ready:
        return

    try:
        from transformers import CLIPProcessor, CLIPModel
    except ImportError:
        raise ImportError(
            "CLIP requires the 'transformers' and 'torch' packages.\n"
            "Install them:\n"
            "  pip install transformers torch\n"
            "Or for CPU-only (recommended if no GPU):\n"
            "  pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu\n"
            "  pip install transformers"
        )

    print("[CLIP] Loading openai/clip-vit-base-patch32 (first run downloads ~600MB)...",
          file=sys.stderr)

    _clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    _clip_model.eval()
    _clip_ready = True

    print("[CLIP] Model loaded ✅", file=sys.stderr)


def _preprocess_pil(image_bytes: bytes):
    """Return a PIL Image from raw bytes."""
    try:
        from PIL import Image
    except ImportError:
        raise ImportError("Pillow is required: pip install Pillow")
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

def classify_with_clip(image_bytes: bytes) -> dict:
    """
    Classify an image using CLIP zero-shot classification.

    For each environmental category we run CLIP with multiple descriptive
    prompts and take the maximum similarity score across all prompts.
    This is the most reliable zero-shot approach.

    Returns
    -------
    dict:
        category   (str | None) — winning category, or None if below threshold
        confidence (float)      — best score across all categories (0–1)
        accepted   (bool)       — True if environmental and confident
        all_scores (dict)       — best score per category
        mode       (str)        — "pretrained_clip"
    """
    import torch
    import torch.nn.functional as F

    _load_clip()

    pil_image = _preprocess_pil(image_bytes)

    flat_prompts = []
    prompt_to_cat = {}
    for cat, prompts in CATEGORY_PROMPTS.items():
        for p in prompts:
            flat_prompts.append(p)
            prompt_to_cat[p] = cat

    with torch.no_grad():
        inputs = _clip_processor(
            text=flat_prompts,
            images=pil_image,
            return_tensors="pt",
            padding=True,
        )
        outputs = _clip_model(**inputs)
        # Similarity between image and each text prompt
        logits = outputs.logits_per_image          # shape: (1, total_prompts)
        probs = F.softmax(logits, dim=-1)[0]       # shape: (total_prompts,)

    # Aggregate probabilities by category
    all_scores: dict[str, float] = {cat: 0.0 for cat in CATEGORY_PROMPTS.keys()}
    for idx, p in enumerate(flat_prompts):
        cat = prompt_to_cat[p]
        all_scores[cat] += float(probs[idx].item())

    all_scores = {k: round(v, 4) for k, v in all_scores.items()}

    # Calculate total probability that this is an environmental issue
    env_total = sum(score for cat, score in all_scores.items() if cat != "general")
    general_score = all_scores.get("general", 0.0)

    # Find the best specific environmental category
    env_scores = {k: v for k, v in all_scores.items() if k != "general"}
    best_cat = max(env_scores, key=env_scores.get)
    best_score = env_scores[best_cat]

    # Acceptance Logic:
    # Confident that it's more environmental than general
    accepted = (env_total > max(0.4, general_score)) and (best_score >= CONFIDENCE_THRESHOLD)

    return {
        "category":   best_cat if accepted else None,
        "confidence": round(best_score, 4),
        "accepted":   accepted,
        "all_scores": all_scores,
        "mode":       "pretrained_clip",
    }


# ──────────────────────────────────────────────────────────────────────────────
# CLI test
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pretrained_classifier.py <image_path>")
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"File not found: {path}")
        sys.exit(1)

    with open(path, "rb") as f:
        data = f.read()

    result = classify_with_clip(data)

    print(f"\n{'='*50}")
    print(f"  CLIP Zero-Shot Classification Result")
    print(f"{'='*50}")
    print(f"  Category   : {(result['category'] or 'NONE').upper()}")
    print(f"  Confidence : {result['confidence']:.4f} ({result['confidence']*100:.1f}%)")
    print(f"  Decision   : {'✅ ACCEPTED' if result['accepted'] else '❌ REJECTED'}")
    print(f"\n  All Scores:")
    for cat, score in sorted(result["all_scores"].items(), key=lambda x: -x[1]):
        bar = "█" * int(score * 40)
        print(f"    {cat:<8}  {score:.4f}  {bar}")
    print()
