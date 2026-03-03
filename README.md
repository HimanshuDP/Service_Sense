# Environmental ServiceSense Platform 🌱

> **TRL-4 Prototype** — AI-powered environmental news intelligence & community action platform

## Overview

```
Environmental News → ML Classification → Local Insights → Community Action
```

### Core Features
- 🤖 **Custom ML Model** — TF-IDF + Logistic Regression classifies news into 5 environmental categories
- 📰 **News Collection** — NewsAPI integration with AI summarization & citizen action suggestions  
- 🤝 **Community Posts** — Report issues, AI verification badge, credibility scoring
- 🗺️ **Heatmap** — Geographic hotspot visualization (Leaflet.js)
- 📊 **Dashboards** — 8 themed dashboards with Recharts analytics

---

## Project Structure

```
Yukti_Innovation_Challange_New/
├── backend/                    # FastAPI + Scikit-learn + MongoDB
│   ├── main.py                 # App entry point
│   ├── config.py               # Environment settings
│   ├── database.py             # Motor async MongoDB client
│   ├── ml/
│   │   └── train.py            # ML training pipeline
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   ├── routers/
│   │   ├── news.py             # News endpoints
│   │   ├── community.py        # Community post endpoints
│   │   └── analytics.py        # Trends & heatmap endpoints
│   ├── services/
│   │   ├── ml_service.py       # ML inference
│   │   ├── news_service.py     # NewsAPI integration
│   │   └── openai_service.py   # Summarization & verification
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/                   # Next.js + TypeScript + Tailwind CSS
    ├── app/
    │   ├── page.tsx            # Main Dashboard
    │   └── dashboard/
    │       ├── air/            # Air Quality Dashboard
    │       ├── water/          # Water Dashboard
    │       ├── land/           # Land/Forest Dashboard
    │       ├── waste/          # Waste Dashboard
    │       ├── community/      # Community Action Dashboard
    │       ├── analytics/      # Monthly Trend Analytics
    │       └── heatmap/        # Environmental Heatmap
    ├── components/
    │   ├── Navbar.tsx
    │   ├── NewsCard.tsx
    │   ├── CommunityPostCard.tsx
    │   ├── PostForm.tsx
    │   └── MapView.tsx         # Leaflet map
    └── lib/
        ├── types.ts            # TypeScript types + theme system
        └── api.ts              # API client
```

---

## Quick Start

### Prerequisites
- Python 3.10+, Node.js 18+, MongoDB running on `localhost:27017`

### 1. Backend Setup

```bash
cd backend

# Copy environment file
copy .env.example .env
# Edit .env and add your API keys (optional — mock fallbacks are included)

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Train the ML model (IMPORTANT — do this first!)
python ml/train.py

# Start the API server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ML Model Design

| Step | Method |
|------|--------|
| Text cleaning | Lowercase, URL removal, digit removal, punctuation strip |
| Tokenization | NLTK word tokenization |
| Stopword removal | NLTK English stopwords |
| Lemmatization | WordNet Lemmatizer |
| Feature extraction | TF-IDF (max_features=5000, bigrams) |
| Classification | Logistic Regression (multinomial, lbfgs) |
| Output | Category label + confidence probability |

**Training dataset:** 200+ manually labeled samples across 5 categories (air, water, land, waste, general)  
**Target accuracy:** > 85%

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/news` | Paginated news feed |
| POST | `/api/news/fetch` | Fetch + ML classify new articles |
| GET | `/api/news/stats` | Category distribution |
| POST | `/api/news/classify` | Classify any text with ML |
| POST | `/api/community/posts` | Create post (AI verified) |
| GET | `/api/community/posts` | List community posts |
| PUT | `/api/community/posts/{id}/like` | Like/unlike |
| POST | `/api/community/posts/{id}/comment` | Add comment |
| GET | `/api/analytics/trends` | Monthly trend data |
| GET | `/api/analytics/heatmap` | Locality hotspots |
| GET | `/api/analytics/summary` | Dashboard summary stats |

**Swagger UI:** http://localhost:8000/docs

---

## Environment Variables

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=servicesense
NEWS_API_KEY=your_newsapi_key_here      # From newsapi.org (free plan works)
OPENAI_API_KEY=your_openai_key_here     # From platform.openai.com
```

> **Note:** Both API keys are optional for prototyping — the system has realistic mock fallbacks built in for demos without real keys.

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS 4 |
| Charts | Recharts |
| Maps | Leaflet.js + React-Leaflet |
| Backend | FastAPI, Python 3.10+ |
| Database | MongoDB (Motor async driver) |
| ML | Scikit-learn, NLTK, joblib |
| AI | OpenAI GPT-3.5-turbo |
| News | NewsAPI |

---

## Dashboards

| Dashboard | Theme | Key Feature |
|-----------|-------|-------------|
| Main | Purple | Category charts, news feed, stat cards |
| Air 💨 | Blue | AQI gauge, severity scale, trend chart |
| Water 🌊 | Cyan | Water quality indicators, trend chart |
| Land 🌿 | Green | Forest cover stats, trend chart |
| Waste ♻️ | Orange | MSW composition chart, recycling tips |
| Community 🤝 | Emerald | Post form, AI verification badges |
| Analytics 📊 | Purple | Multi-category line + stacked bar charts |
| Heatmap 🗺️ | Teal | Leaflet map, locality hotspot table |

---

*Built for Yukti Innovation Challenge — TRL-4 Prototype*
