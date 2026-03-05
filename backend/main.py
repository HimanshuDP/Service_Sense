from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import init_firebase
from routers import news, community, analytics, auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_firebase()   # Replaces MongoDB connect_db()
    yield
    # Firebase Admin SDK has no explicit close needed

app = FastAPI(
    title="Environmental ServiceSense API",
    description="TRL-4 Prototype — AI-powered environmental platform (Firebase Firestore backend)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(news.router)
app.include_router(community.router)
app.include_router(analytics.router)
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"name": "Environmental ServiceSense API", "version": "2.0.0", "db": "Firebase Firestore", "status": "running", "docs": "/docs"}

@app.get("/health")
async def health():
    return {"status": "healthy", "db": "firestore"}
