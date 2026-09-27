from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, hash_password, verify_password
from app.database.db import User, get_session
from app.router.auth.schema import RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/auth")


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, session: AsyncSession = Depends(get_session)):
    existing = await session.scalar(select(User).where(User.email == body.email))
    if existing is not None:
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = User(email=body.email, hashed_password=hash_password(body.password))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return UserResponse(id=user.id, email=user.email)


@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = await session.scalar(select(User).where(User.email == form_data.username))
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise invalid_credentials

    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse(id=current_user.id, email=current_user.email)
