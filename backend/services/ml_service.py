import joblib
import os
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

nltk.download("stopwords", quiet=True)
nltk.download("wordnet", quiet=True)

_model = None
_lemmatizer = WordNetLemmatizer()
_stop_words = set(stopwords.words("english"))

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml", "model.joblib")

CATEGORY_LABELS = {
    "air": "Air Pollution",
    "water": "Water Pollution",
    "land": "Land / Forest",
    "waste": "Waste Management",
    "general": "General Environment",
}

def _clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"\d+", "", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    tokens = [_lemmatizer.lemmatize(t) for t in tokens if t not in _stop_words and len(t) > 2]
    return " ".join(tokens)

def _load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Please run: python ml/train.py"
            )
        _model = joblib.load(MODEL_PATH)
    return _model

def classify(title: str, description: str = "") -> dict:
    """
    Classify text into an environmental category.
    Returns: {category, confidence, label}
    """
    model = _load_model()
    combined = f"{title} {description}".strip()
    cleaned = _clean_text(combined)
    if not cleaned:
        return {"category": "general", "confidence": 0.5, "label": "General Environment"}

    proba = model.predict_proba([cleaned])[0]
    classes = model.classes_
    best_idx = proba.argmax()
    category = classes[best_idx]
    confidence = float(proba[best_idx])

    return {
        "category": category,
        "confidence": round(confidence, 4),
        "label": CATEGORY_LABELS.get(category, category),
    }

def extract_locality(text: str) -> str | None:
    """
    Simple heuristic locality extractor.
    Looks for Indian city names in the text.
    """
    if not isinstance(text, str):
        return None
    text_lower = text.lower()
    cities = [
        "delhi", "mumbai", "bangalore", "chennai", "kolkata", "pune",
        "hyderabad", "ahmedabad", "jaipur", "lucknow", "surat", "kanpur",
        "nagpur", "indore", "bhopal", "chennai", "patna", "vadodara",
        "ghaziabad", "coimbatore", "agra", "meerut", "varanasi", "nashik",
        "new york", "london", "beijing", "shanghai", "paris", "tokyo",
        "indonesia", "amazon", "pacific", "arctic", "himalaya",
        "rajasthan", "kerala", "gujarat", "maharashtra", "uttar pradesh",
    ]
    for city in cities:
        if city in text_lower:
            return city.title()
    return None
