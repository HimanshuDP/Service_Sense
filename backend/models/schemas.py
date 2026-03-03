from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class EnvCategory(str, Enum):
    air = "air"
    water = "water"
    land = "land"
    waste = "waste"
    general = "general"

class AIVerification(str, Enum):
    valid = "valid"
    needs_review = "needs_review"
    invalid = "invalid"

# ── News ──────────────────────────────────────────────────
class NewsArticle(BaseModel):
    id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    url: str
    source: str
    publishedAt: datetime
    category: EnvCategory = EnvCategory.general
    confidence: float = 0.0
    locality: Optional[str] = None
    summary: Optional[str] = None
    actions: List[str] = []
    fetchedAt: datetime = Field(default_factory=datetime.utcnow)

class ClassifyRequest(BaseModel):
    text: str

class ClassifyResponse(BaseModel):
    category: str
    confidence: float

# ── Community Posts ───────────────────────────────────────
class Comment(BaseModel):
    userId: str
    userName: str
    text: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ImpactUpdate(BaseModel):
    text: str
    mediaUrls: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class CommunityPostCreate(BaseModel):
    userId: str
    userName: str
    title: str
    description: str
    category: EnvCategory
    locality: str
    mediaUrls: List[str] = []
    isAnonymous: bool = False

class CommunityPost(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    userName: str
    title: str
    description: str
    category: EnvCategory
    locality: str
    mediaUrls: List[str] = []
    likes: int = 0
    comments: List[Comment] = []
    aiVerification: AIVerification = AIVerification.needs_review
    credibilityScore: float = 0.0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updates: List[ImpactUpdate] = []
    isAnonymous: bool = False

class LikeRequest(BaseModel):
    userId: str

class CommentRequest(BaseModel):
    userId: str
    userName: str
    text: str

class ImpactUpdateRequest(BaseModel):
    text: str
    mediaUrls: List[str] = []

# ── Analytics ─────────────────────────────────────────────
class TrendPoint(BaseModel):
    month: str
    air: int = 0
    water: int = 0
    land: int = 0
    waste: int = 0
    general: int = 0

class HeatmapPoint(BaseModel):
    locality: str
    lat: float
    lng: float
    count: int
    category: str

# ── Users ─────────────────────────────────────────────────
class UserCreate(BaseModel):
    userName: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserUpdate(BaseModel):
    userName: Optional[str] = None
    displayName: Optional[str] = None
    bio: Optional[str] = None
    photoURL: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    userName: str
    email: str
    displayName: Optional[str] = None
    bio: Optional[str] = None
    photoURL: Optional[str] = None
    followersCount: int = 0
    followingCount: int = 0
    createdAt: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
