from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user_allow_pending
from app.auth.security import create_access_token, hash_password, verify_password
from app.database.db import User, get_session
from app.router.auth.schema import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    MessageResponse,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

TEMPORARY_PASSWORD = "1234"

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

    return TokenResponse(
        access_token=create_access_token(user.id),
        must_change_password=user.must_change_password,
    )


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, session: AsyncSession = Depends(get_session)):
    user = await session.scalar(select(User).where(User.email == body.email))
    if user is not None:
        user.hashed_password = hash_password(TEMPORARY_PASSWORD)
        user.must_change_password = True
        await session.commit()
    # Same response whether or not the email exists, to avoid leaking registered emails.
    return MessageResponse(
        message=f"If the account exists, its password has been reset to the temporary password "
        f"{TEMPORARY_PASSWORD}. Sign in with it to choose a new one."
    )


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user_allow_pending),
    session: AsyncSession = Depends(get_session),
):
    if verify_password(body.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from the current one")

    current_user.hashed_password = hash_password(body.new_password)
    current_user.must_change_password = False
    await session.commit()
    return MessageResponse(message="Password updated. Please sign in again.")


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user_allow_pending)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        must_change_password=current_user.must_change_password,
    )
