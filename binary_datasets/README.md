# Binary Datasets — Setup Guide for Yukti Innovation

## Folder Structure Required

```
binary_datasets/
  air/
    positive/     ← air pollution images
    negative/     ← unrelated / general images
  water/
    positive/     ← water pollution images
    negative/
  land/
    positive/     ← deforestation, land damage images
    negative/
  waste/
    positive/     ← garbage, plastic waste, landfill images
    negative/
```

Place this `binary_datasets/` folder in the **project root** (next to `backend/` and `frontend/`).

---

## Where to Download Free Datasets

### 🗑️ Waste Model (Best Starting Point — 12,000+ images)
**Kaggle: Garbage Classification**
- URL: https://www.kaggle.com/datasets/asdasdasasdas/garbage-classification
- Use: cardboard, glass, metal, paper, plastic, trash → all go to `positive/`
- For `negative/`: download any city/building photos

### 🌫️ Air Model
**Kaggle: Air Pollution Dataset**
- Search: "air pollution smog dataset" on https://www.kaggle.com
- Recommended: "Air Pollution Image Dataset" or "Smog Detection"
- `positive/`: smog, smoke, haze, industrial emission images
- `negative/`: clear sky, indoor, building images

### 💧 Water Model
**Kaggle: Water Pollution Dataset**
- Search: "water pollution images" on https://www.kaggle.com
- `positive/`: polluted rivers, oil spills, algal bloom images
- `negative/`: clean water, city streets, indoor images

### 🌲 Land Model
**Kaggle: Deforestation / Forest Dataset**
- Search: "deforestation dataset" or "forest fire detection" on Kaggle
- `positive/`: deforested areas, soil erosion, burned land images
- `negative/`: urban, buildings, clean street images

---

## Tips

- **Minimum**: 100 images per class (positive + negative) for decent accuracy
- **Recommended**: 500+ images per class for good accuracy
- **Negative class**: You can reuse the same set of "general" images
  across all 4 categories (city streets, buildings, people, etc.)
- **Image format**: JPEG, PNG, WebP all supported
- **Resolution**: Any size — images are auto-resized to 224×224

---

## Training Commands

```bash
cd backend
venv\Scripts\activate

# Train one category at a time
python ml/image_classifier/train_image_model.py --category waste
python ml/image_classifier/train_image_model.py --category air
python ml/image_classifier/train_image_model.py --category water
python ml/image_classifier/train_image_model.py --category land

# Or train all 4 in sequence
python ml/image_classifier/train_image_model.py --category all

# Custom dataset path
python ml/image_classifier/train_image_model.py --category waste --dataset-dir D:\my_datasets
```

## Output

After training, you'll find in `backend/ml/image_classifier/models/`:
- `air_model.h5`
- `water_model.h5`
- `land_model.h5`
- `waste_model.h5`
- `air_evaluation_report.txt`
- `waste_evaluation_report.txt`
- ... (one report per trained category)

The API endpoint `/api/community/classify-image` will automatically use
whichever models are present — you don't need all 4 to start using it.
