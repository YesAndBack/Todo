from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends, Request
from passlib.context import CryptContext
from jose import JWTError, jwt
from sqlalchemy.orm import Session
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.config import settings
from app.database import get_db
from app.auth.models import User, RefreshToken
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security_scheme = HTTPBearer()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
executor = ThreadPoolExecutor(max_workers=4)

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 70

async def get_password_hash(password: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, pwd_context.hash, password)

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, pwd_context.verify, plain_password, hashed_password)

async def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if "sub" not in to_encode:
        raise ValueError("Token must include 'sub'")
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

async def create_refresh_token(user_id: int, db: Session):
    token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    refresh_token = RefreshToken(
        token=token,
        expires_at=expires_at,
        user_id=user_id
    )
    
    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)
    
    return token

async def authenticate_user(username: str, password: str, db: Session):
    user = db.query(User).filter(User.username == username).first()
    if not user or not await verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return user

async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id_int = int(user_id)
        user = db.query(User).filter(User.id == user_id_int).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_refresh_token(refresh_token: str, db: Session):
    db_token = db.query(RefreshToken).filter(
        RefreshToken.token == refresh_token,
        RefreshToken.revoked == False,
        RefreshToken.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not db_token:
        return None
        
    return db_token.user_id

async def revoke_refresh_token(refresh_token: str, db: Session):
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if db_token:
        db_token.revoked = True
        db.commit()

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user