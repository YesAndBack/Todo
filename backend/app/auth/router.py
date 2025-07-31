from fastapi import APIRouter, Depends, Response, status, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.auth import (
    authenticate_user, 
    create_access_token, 
    create_refresh_token,
    verify_refresh_token,
    revoke_refresh_token,
    get_password_hash, 
    get_current_active_user
)
from app.auth.models import User
from app.auth.schemas import SUserLogin, SUserRegister, User as UserSchema

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.post("/register")
async def register_user(user_data: SUserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = await get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User registered successfully"}

@router.post("/login")
async def login_user(response: Response, user_data: SUserLogin, db: Session = Depends(get_db)):
    user = await authenticate_user(user_data.username, user_data.password, db)
    
    access_token = await create_access_token({"sub": str(user.id)})
    refresh_token = await create_refresh_token(user.id, db)
    
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    response.set_cookie(
        key="refresh_token", 
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token", httponly=True)
    response.delete_cookie(key="refresh_token", httponly=True)
    return {"message": "Logged out"}


@router.post("/refresh")
async def refresh_tokens(response: Response, request: Request, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token provided")
    
    user_id = await verify_refresh_token(refresh_token, db)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    await revoke_refresh_token(refresh_token, db)
    
    new_access_token = await create_access_token({"sub": str(user.id)})
    new_refresh_token = await create_refresh_token(user.id, db)
    
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax"
    )
    
    return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

@router.post("/me", response_model=UserSchema)
async def read_user_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/all")
async def read_all_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    return [{"id": user.id, "username": user.username, "email": user.email} for user in users]