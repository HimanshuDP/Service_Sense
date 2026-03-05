"""
test_image_classify.py — Test Script for Multi-Binary Image Classifier
=======================================================================
Run from the backend/ directory:
    python test_image_classify.py [--images-dir path/to/binary_datasets]

For each trained category model, picks one "positive" image and one
"negative" image, runs the full prediction pipeline, and prints results.
"""

import os
import sys
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CATEGORIES = ["air", "water", "land", "waste"]
EXTS       = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def pick_first_image(folder: str) -> str | None:
    if not os.path.isdir(folder):
        return None
    for f in os.listdir(folder):
        if os.path.splitext(f)[1].lower() in EXTS:
            return os.path.join(folder, f)
    return None


def run_tests(dataset_dir: str) -> None:
    sys.path.insert(0, SCRIPT_DIR)

    try:
        from ml.image_classifier.predict import predict_image_verbose
    except FileNotFoundError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)
    except ImportError as e:
        print(f"\n[ERROR] Missing dependency: {e}")
        print("Install:  pip install tensorflow Pillow")
        sys.exit(1)

    print("=" * 65)
    print("  Yukti Innovation — Multi-Binary Image Classifier Test")
    print("=" * 65)

    total_passed  = 0
    total_failed  = 0
    total_skipped = 0

    for cat in CATEGORIES:
        cat_dir      = os.path.join(dataset_dir, cat)
        pos_img_path = pick_first_image(os.path.join(cat_dir, "positive"))
        neg_img_path = pick_first_image(os.path.join(cat_dir, "negative"))

        print(f"\n── Category: {cat.upper()} " + "─" * 40)

        for label, img_path, expected_accept in [
            ("positive (should ACCEPT)", pos_img_path, True),
            ("negative (should REJECT)", neg_img_path, False),
        ]:
            if img_path is None:
                print(f"  [SKIP] {label} — no images found")
                total_skipped += 1
                continue

            print(f"\n  Sample : {label}")
            print(f"  File   : {os.path.basename(img_path)}")

            with open(img_path, "rb") as f:
                image_bytes = f.read()

            try:
                result = predict_image_verbose(image_bytes)
            except Exception as e:
                print(f"  ❌ FAIL — Exception: {e}")
                total_failed += 1
                continue

            # Display result
            cat_out    = result["category"] or "NONE"
            confidence = result["confidence"]
            accepted   = result["accepted"]
            all_scores = result["all_scores"]

            correct = (accepted == expected_accept)
            symbol  = "✅" if correct else "❌"

            print(f"  Top category : {cat_out.upper()}")
            print(f"  Confidence   : {confidence:.4f} ({confidence*100:.1f}%)")
            print(f"  Decision     : {'ACCEPTED ✅' if accepted else 'REJECTED ❌'}")
            print(f"  {symbol} {'PASS' if correct else 'FAIL'} (expected: {'ACCEPT' if expected_accept else 'REJECT'})")
            print(f"  All scores   :")
            for c, s in sorted(all_scores.items(), key=lambda x: -x[1]):
                bar = "█" * int(s * 25)
                print(f"    {c:<8} {s:.4f}  {bar}")

            # Validate schema
            assert isinstance(confidence, float), "confidence must be float"
            assert isinstance(accepted, bool),    "accepted must be bool"
            assert isinstance(all_scores, dict),  "all_scores must be dict"
            assert 0.0 <= confidence <= 1.0,      "confidence out of range [0,1]"

            if correct:
                total_passed += 1
            else:
                total_failed += 1

    print("\n" + "=" * 65)
    print(f"  Results — Passed: {total_passed}  Failed: {total_failed}  Skipped: {total_skipped}")
    print("=" * 65 + "\n")

    if total_failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Yukti binary image classifiers")
    parser.add_argument(
        "--images-dir",
        default=None,
        help="Path to binary_datasets/ root (auto-detected if not specified)",
    )
    args = parser.parse_args()

    if args.images_dir:
        dataset_dir = args.images_dir
    else:
        project_root = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
        candidates   = [
            os.path.join(project_root, "binary_datasets"),
            os.path.join(SCRIPT_DIR,   "binary_datasets"),
        ]
        dataset_dir = next((p for p in candidates if os.path.isdir(p)), candidates[0])

    run_tests(dataset_dir)
