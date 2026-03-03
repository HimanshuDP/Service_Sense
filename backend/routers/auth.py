from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import _is_demo, demo_add, demo_list, rtdb_push, rtdb_get_all, rtdb_update, demo_update
from models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate
from datetime import datetime, timedelta
import jwt
import bcrypt

SECRET_KEY = "super_secret_yukti_key_for_profiles"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

router = APIRouter(prefix="/api/auth", tags=["auth"])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(email: str):
    if _is_demo():
        docs, _ = demo_list("users", limit=1000)
        return next((u for u in docs if u.get("email") == email), None)
    else:
        raw = rtdb_get_all("users")
        items = [{"id": k, **v} for k, v in raw.items()]
        return next((u for u in items if u.get("email") == email), None)

def get_user_by_username(username: str):
    if _is_demo():
        docs, _ = demo_list("users", limit=1000)
        return next((u for u in docs if u.get("userName") == username), None)
    else:
        raw = rtdb_get_all("users")
        items = [{"id": k, **v} for k, v in raw.items()]
        return next((u for u in items if u.get("userName") == username), None)

def get_user_by_id(user_id: str):
    if _is_demo():
        docs, _ = demo_list("users", limit=1000)
        return next((u for u in docs if u.get("id") == user_id), None)
    else:
        raw = rtdb_get_all("users")
        if user_id in raw:
            return {"id": user_id, **raw[user_id]}
        return None

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = get_user_by_email(email)
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


@router.get("/check-username")
async def check_username(username: str):
    if not username:
        return {"available": False}
    user = get_user_by_username(username)
    return {"available": user is None}


@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing_em = get_user_by_email(user.email)
    if existing_em:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_un = get_user_by_username(user.userName)
    if existing_un:
        raise HTTPException(status_code=400, detail="Username is already taken")

    now = datetime.utcnow()
    user_data = {
        "userName": user.userName,
        "email": user.email,
        "displayName": user.userName,
        "bio": "",
        "photoURL": None,
        "followersCount": 0,
        "followingCount": 0,
        "hashed_password": get_password_hash(user.password),
        "createdAt": now.isoformat(),
    }
    
    if _is_demo():
        user_id = demo_add("users", user_data)
        user_data["id"] = user_id
    else:
        user_id = rtdb_push("users", user_data)
        user_data["id"] = user_id

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_data["email"], "uid": user_data["id"]}, 
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_data["id"],
            "userName": user_data["userName"],
            "email": user_data["email"],
            "displayName": user_data["displayName"],
            "bio": user_data["bio"],
            "photoURL": user_data["photoURL"],
            "followersCount": user_data["followersCount"],
            "followingCount": user_data["followingCount"],
            "createdAt": now
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin):
    db_user = get_user_by_email(user.email)
    if not db_user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not verify_password(user.password, db_user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user["email"], "uid": db_user["id"]}, 
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user["id"],
            "userName": db_user.get("userName", ""),
            "email": db_user["email"],
            "displayName": db_user.get("displayName", ""),
            "bio": db_user.get("bio", ""),
            "photoURL": db_user.get("photoURL"),
            "followersCount": db_user.get("followersCount", 0),
            "followingCount": db_user.get("followingCount", 0),
            "createdAt": db_user.get("createdAt", datetime.utcnow().isoformat())
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "userName": current_user.get("userName", ""),
        "email": current_user["email"],
        "displayName": current_user.get("displayName", ""),
        "bio": current_user.get("bio", ""),
        "photoURL": current_user.get("photoURL"),
        "followersCount": current_user.get("followersCount", 0),
        "followingCount": current_user.get("followingCount", 0),
        "createdAt": current_user.get("createdAt", datetime.utcnow().isoformat())
    }

@router.put("/me", response_model=UserResponse)
async def update_me(update_data: UserUpdate, current_user: dict = Depends(get_current_user)):
    # If they are changing username, check uniqueness
    if update_data.userName and update_data.userName != current_user.get("userName"):
        existing_un = get_user_by_username(update_data.userName)
        if existing_un:
            raise HTTPException(status_code=400, detail="Username is already taken")

    updates = {}
    if update_data.userName is not None:
        updates["userName"] = update_data.userName
    if update_data.displayName is not None:
        updates["displayName"] = update_data.displayName
    if update_data.bio is not None:
        updates["bio"] = update_data.bio
    if update_data.photoURL is not None:
        updates["photoURL"] = update_data.photoURL

    if updates:
        if _is_demo():
            demo_update("users", current_user["id"], updates)
        else:
            rtdb_update("users", current_user["id"], updates)
            
        # Update local current_user dict so return object has latest
        for k, v in updates.items():
            current_user[k] = v

    return {
        "id": current_user["id"],
        "userName": current_user.get("userName", ""),
        "email": current_user["email"],
        "displayName": current_user.get("displayName", ""),
        "bio": current_user.get("bio", ""),
        "photoURL": current_user.get("photoURL"),
        "followersCount": current_user.get("followersCount", 0),
        "followingCount": current_user.get("followingCount", 0),
        "createdAt": current_user.get("createdAt", datetime.utcnow().isoformat())
    }

@router.get("/users/{username}", response_model=UserResponse)
async def get_public_profile(username: str):
    user = get_user_by_username(username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user["id"],
        "userName": user.get("userName", ""),
        "email": "", # Hidden for public profiles
        "displayName": user.get("displayName", ""),
        "bio": user.get("bio", ""),
        "photoURL": user.get("photoURL"),
        "followersCount": user.get("followersCount", 0),
        "followingCount": user.get("followingCount", 0),
        "createdAt": user.get("createdAt", datetime.utcnow().isoformat())
    }

@router.post("/users/{username}/follow")
async def follow_user(username: str, current_user: dict = Depends(get_current_user)):
    target_user = get_user_by_username(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
        
    following = current_user.get("following", [])
    if target_user["id"] in following:
        return {"status": "already_following"}
        
    following.append(target_user["id"])
    
    followers = target_user.get("followers", [])
    if current_user["id"] not in followers:
        followers.append(current_user["id"])
        
    updates_current = {"following": following, "followingCount": len(following)}
    updates_target = {"followers": followers, "followersCount": len(followers)}
    
    if _is_demo():
        demo_update("users", current_user["id"], updates_current)
        demo_update("users", target_user["id"], updates_target)
    else:
        rtdb_update("users", current_user["id"], updates_current)
        rtdb_update("users", target_user["id"], updates_target)
        
    return {"status": "followed"}

@router.post("/users/{username}/unfollow")
async def unfollow_user(username: str, current_user: dict = Depends(get_current_user)):
    target_user = get_user_by_username(username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    following = current_user.get("following", [])
    if target_user["id"] in following:
        following.remove(target_user["id"])
        
    followers = target_user.get("followers", [])
    if current_user["id"] in followers:
        followers.remove(current_user["id"])
        
    updates_current = {"following": following, "followingCount": len(following)}
    updates_target = {"followers": followers, "followersCount": len(followers)}
    
    if _is_demo():
        demo_update("users", current_user["id"], updates_current)
        demo_update("users", target_user["id"], updates_target)
    else:
        rtdb_update("users", current_user["id"], updates_current)
        rtdb_update("users", target_user["id"], updates_target)
        
    return {"status": "unfollowed"}
