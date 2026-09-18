from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user_id,
    verify_password,
)
from app.db.models import User
from app.db.session import get_db
from app.schemas import LoginRequest, LoginResponse, UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def build_user_response(
    user: User,
) -> UserResponse:

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        village_id=(
            str(user.village_id)
            if user.village_id
            else None
        ),
        village_name=(
            user.village.name
            if user.village
            else None
        ),
        region=user.region,
        is_active=user.is_active,
    )


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.email == payload.email.lower()
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is disabled.",
        )

    if not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    token = create_access_token(
        user_id=str(user.id),
        role=user.role,
    )

    return LoginResponse(
        access_token=token,
        user=build_user_response(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is disabled.",
        )

    return build_user_response(user)


@router.post("/logout")
def logout():
    """
    JWT logout is handled on the frontend by removing
    the browser session cookie.

    This endpoint exists for API completeness.
    """

    return {
        "message": "Logged out successfully."
    }