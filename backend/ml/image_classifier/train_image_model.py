"""
train_binary_model.py — Binary Image Classifier for Yukti Innovation
=====================================================================
Trains a separate MobileNetV2 binary model for each environmental category.
Each model answers a single yes/no question:
  "Is this image related to [category]?"

Dataset folder structure per category:
  binary_datasets/
    air/
      positive/   ← air pollution images (smoke, smog, emissions)
      negative/   ← unrelated images (download any generic image set)
    water/
      positive/   ← water pollution images
      negative/
    land/
      positive/   ← deforestation, land degradation images
      negative/
    waste/
      positive/   ← garbage, plastic dump, landfill images
      negative/

Usage:
  # Train a single category
  python ml/image_classifier/train_binary_model.py --category air

  # Train all 4 categories in sequence
  python ml/image_classifier/train_binary_model.py --category all

  # Specify custom dataset root
  python ml/image_classifier/train_binary_model.py --category waste --dataset-dir D:/my_datasets

Saved model files (in ml/image_classifier/models/):
  air_model.h5
  water_model.h5
  land_model.h5
  waste_model.h5
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import warnings
import numpy as np

warnings.filterwarnings("ignore")

# ──────────────────────────────────────────────────────────────────────────────
# Paths & constants
# ──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR  = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))

MODELS_DIR   = os.path.join(SCRIPT_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

CATEGORIES   = ["air", "water", "land", "waste"]

IMG_SIZE     = (224, 224)
BATCH_SIZE   = 32
EPOCHS       = 12
LR           = 1e-4

# ──────────────────────────────────────────────────────────────────────────────
# TensorFlow imports
# ──────────────────────────────────────────────────────────────────────────────

try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, optimizers, callbacks
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    from sklearn.metrics import (
        classification_report, confusion_matrix,
        accuracy_score, precision_score, recall_score,
    )
except ImportError as e:
    sys.exit(
        f"\n[ERROR] Missing dependency: {e}\n"
        "Install with:  pip install tensorflow scikit-learn Pillow\n"
    )


# ──────────────────────────────────────────────────────────────────────────────
# 1. Validate dataset folder
# ──────────────────────────────────────────────────────────────────────────────

def validate_binary_dataset(category: str, dataset_root: str) -> str:
    """Return the category folder path after validating structure."""
    cat_dir = os.path.join(dataset_root, category)
    pos_dir = os.path.join(cat_dir, "positive")
    neg_dir = os.path.join(cat_dir, "negative")

    errors = []
    if not os.path.isdir(cat_dir):
        errors.append(f"Category folder missing: {cat_dir}")
    else:
        if not os.path.isdir(pos_dir):
            errors.append(f"'positive/' folder missing inside: {cat_dir}")
        if not os.path.isdir(neg_dir):
            errors.append(f"'negative/' folder missing inside: {cat_dir}")

    if errors:
        sys.exit(
            "\n[ERROR] Dataset structure invalid:\n  " + "\n  ".join(errors) +
            "\n\nExpected structure:\n"
            f"  {dataset_root}/{category}/\n"
            "    positive/   ← images showing this environmental issue\n"
            "    negative/   ← unrelated / general images\n"
            "\nSee binary_datasets/README.md for dataset download instructions.\n"
        )

    EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    n_pos = sum(1 for f in os.listdir(pos_dir) if os.path.splitext(f)[1].lower() in EXTS)
    n_neg = sum(1 for f in os.listdir(neg_dir) if os.path.splitext(f)[1].lower() in EXTS)

    print(f"\n📂 Dataset for '{category}':")
    print(f"   positive/ : {n_pos:>4} images")
    print(f"   negative/ : {n_neg:>4} images")
    print(f"   total     : {n_pos + n_neg:>4} images")

    if n_pos < 20 or n_neg < 20:
        print(f"\n[WARNING] Very few images — at least 50 per class recommended.")

    return cat_dir


# ──────────────────────────────────────────────────────────────────────────────
# 2. Split dataset  70 / 20 / 10
# ──────────────────────────────────────────────────────────────────────────────

def split_dataset(cat_dir: str, split_dir: str) -> None:
    import random
    random.seed(42)
    EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    if os.path.exists(split_dir):
        shutil.rmtree(split_dir)

    for split in ["train", "val", "test"]:
        for label in ["positive", "negative"]:
            os.makedirs(os.path.join(split_dir, split, label), exist_ok=True)

    for label in ["positive", "negative"]:
        src = os.path.join(cat_dir, label)
        imgs = [f for f in os.listdir(src) if os.path.splitext(f)[1].lower() in EXTS]
        random.shuffle(imgs)

        n = len(imgs)
        n_train = int(n * 0.70)
        n_val   = int(n * 0.20)

        split_map = {
            "train": imgs[:n_train],
            "val":   imgs[n_train:n_train + n_val],
            "test":  imgs[n_train + n_val:],
        }

        for split_name, files in split_map.items():
            for fname in files:
                shutil.copy2(
                    os.path.join(src, fname),
                    os.path.join(split_dir, split_name, label, fname),
                )

    print("✅ Split: train 70% / val 20% / test 10%\n")


# ──────────────────────────────────────────────────────────────────────────────
# 3. Data generators
# ──────────────────────────────────────────────────────────────────────────────

def create_generators(split_dir: str):
    train_gen_cfg = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        horizontal_flip=True,
        zoom_range=0.20,
        rotation_range=15,
        brightness_range=[0.8, 1.2],
        width_shift_range=0.10,
        height_shift_range=0.10,
        fill_mode="nearest",
    )
    eval_gen_cfg = ImageDataGenerator(preprocessing_function=preprocess_input)

    classes = ["negative", "positive"]   # 0=negative, 1=positive

    train_gen = train_gen_cfg.flow_from_directory(
        os.path.join(split_dir, "train"),
        target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        class_mode="binary", classes=classes, shuffle=True, seed=42,
    )
    val_gen = eval_gen_cfg.flow_from_directory(
        os.path.join(split_dir, "val"),
        target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        class_mode="binary", classes=classes, shuffle=False,
    )
    test_gen = eval_gen_cfg.flow_from_directory(
        os.path.join(split_dir, "test"),
        target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        class_mode="binary", classes=classes, shuffle=False,
    )

    return train_gen, val_gen, test_gen


# ──────────────────────────────────────────────────────────────────────────────
# 4. Model (MobileNetV2 + binary head)
# ──────────────────────────────────────────────────────────────────────────────

def build_binary_model() -> tf.keras.Model:
    base = MobileNetV2(input_shape=(*IMG_SIZE, 3), include_top=False, weights="imagenet")
    base.trainable = False  # freeze all base layers

    inp = tf.keras.Input(shape=(*IMG_SIZE, 3))
    x   = base(inp, training=False)
    x   = layers.GlobalAveragePooling2D()(x)
    x   = layers.BatchNormalization()(x)
    x   = layers.Dense(256, activation="relu")(x)
    x   = layers.Dropout(0.30)(x)
    x   = layers.Dense(128, activation="relu")(x)
    x   = layers.Dropout(0.20)(x)
    out = layers.Dense(1, activation="sigmoid")(x)   # binary output

    model = models.Model(inp, out)
    model.compile(
        optimizer=optimizers.Adam(learning_rate=LR),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    return model


# ──────────────────────────────────────────────────────────────────────────────
# 5. Train
# ──────────────────────────────────────────────────────────────────────────────

def train_model(model, train_gen, val_gen, model_path: str):
    cb_list = [
        callbacks.EarlyStopping(monitor="val_accuracy", patience=4,
                                restore_best_weights=True, verbose=1),
        callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5,
                                    patience=2, min_lr=1e-6, verbose=1),
        callbacks.ModelCheckpoint(filepath=model_path, monitor="val_accuracy",
                                  save_best_only=True, verbose=1),
    ]

    print(f"🚀 Training for up to {EPOCHS} epochs ...\n")
    history = model.fit(train_gen, validation_data=val_gen,
                        epochs=EPOCHS, callbacks=cb_list, verbose=1)
    return history


# ──────────────────────────────────────────────────────────────────────────────
# 6. Evaluate & save report
# ──────────────────────────────────────────────────────────────────────────────

def evaluate_model(model, test_gen, category: str) -> None:
    print("\n📊 Evaluating on test set...")
    test_gen.reset()
    probs  = model.predict(test_gen, verbose=1).flatten()
    y_pred = (probs >= 0.50).astype(int)
    y_true = test_gen.classes

    acc  = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec  = recall_score(y_true, y_pred, zero_division=0)
    cm   = confusion_matrix(y_true, y_pred)
    cr   = classification_report(y_true, y_pred,
                                  target_names=["negative", "positive"],
                                  zero_division=0)

    print(f"\n  Accuracy  : {acc*100:.2f}%")
    print(f"  Precision : {prec*100:.2f}%")
    print(f"  Recall    : {rec*100:.2f}%\n")
    print(cr)
    print("Confusion Matrix:")
    print(cm)

    report_path = os.path.join(MODELS_DIR, f"{category}_evaluation_report.txt")
    with open(report_path, "w") as f:
        f.write(f"Yukti Innovation — {category.upper()} Binary Classifier Report\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Accuracy  : {acc*100:.2f}%\n")
        f.write(f"Precision : {prec*100:.2f}%\n")
        f.write(f"Recall    : {rec*100:.2f}%\n\n")
        f.write("Classification Report:\n" + cr + "\n")
        f.write("Confusion Matrix (rows=true, cols=predicted):\n")
        f.write("Labels: [negative, positive]\n" + str(cm) + "\n")

    print(f"✅ Report saved → {report_path}")


# ──────────────────────────────────────────────────────────────────────────────
# 7. Train one category
# ──────────────────────────────────────────────────────────────────────────────

def train_category(category: str, dataset_root: str) -> None:
    print("\n" + "=" * 60)
    print(f"  Training binary model : {category.upper()}")
    print("=" * 60)

    cat_dir    = validate_binary_dataset(category, dataset_root)
    split_dir  = os.path.join(SCRIPT_DIR, f"_split_{category}")
    model_path = os.path.join(MODELS_DIR, f"{category}_model.h5")

    split_dataset(cat_dir, split_dir)
    train_gen, val_gen, test_gen = create_generators(split_dir)

    print(f"  Train: {train_gen.samples} | Val: {val_gen.samples} | Test: {test_gen.samples}")

    model = build_binary_model()
    train_model(model, train_gen, val_gen, model_path)

    best = tf.keras.models.load_model(model_path)
    evaluate_model(best, test_gen, category)

    print(f"\n🎉 Model saved → {model_path}\n")


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Train binary image classifiers for Yukti Innovation"
    )
    parser.add_argument(
        "--category",
        choices=CATEGORIES + ["all"],
        required=True,
        help="Category to train: air | water | land | waste | all",
    )
    parser.add_argument(
        "--dataset-dir",
        default=None,
        help="Root of binary_datasets/ folder (auto-detected if not specified)",
    )
    args = parser.parse_args()

    if args.dataset_dir:
        dataset_root = args.dataset_dir
    else:
        candidates = [
            os.path.join(PROJECT_ROOT, "binary_datasets"),
            os.path.join(BACKEND_DIR,  "binary_datasets"),
            os.path.join(SCRIPT_DIR,   "binary_datasets"),
        ]
        dataset_root = next((p for p in candidates if os.path.isdir(p)), candidates[0])

    print(f"📁 Dataset root: {dataset_root}")

    to_train = CATEGORIES if args.category == "all" else [args.category]
    for cat in to_train:
        train_category(cat, dataset_root)

    print("\n✅ All done! Models saved in:", MODELS_DIR)
