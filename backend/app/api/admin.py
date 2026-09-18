from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    get_current_user_id,
    hash_password,
)
from app.db.models import SystemSetting, User, Village
from app.db.session import get_db
from app.schemas import (
    SettingsResponse,
    SettingsUpdate,
    UserAdminResponse,
    UserCreate,
    UserUpdate,
)


router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


def require_admin(
    user_id: str,
    db: Session,
) -> User:

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

    if user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required.",
        )

    return user


def user_response(
    user: User,
) -> UserAdminResponse:

    return UserAdminResponse(
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
        created_at=user.created_at,
    )


@router.get(
    "/users",
    response_model=list[UserAdminResponse],
)
def get_users(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    require_admin(user_id, db)

    users = (
        db.query(User)
        .order_by(
            User.created_at.desc()
        )
        .all()
    )

    return [
        user_response(user)
        for user in users
    ]


@router.post(
    "/users",
    response_model=UserAdminResponse,
)
def create_user(
    payload: UserCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    require_admin(user_id, db)

    existing = (
        db.query(User)
        .filter(
            User.email == payload.email.lower()
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )

    if payload.role not in [
        "chw",
        "authority",
        "admin",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role.",
        )

    village = None

    if payload.village_id:

        village = (
            db.query(Village)
            .filter(
                Village.id == payload.village_id
            )
            .first()
        )

        if not village:
            raise HTTPException(
                status_code=404,
                detail="Village not found.",
            )

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(
            payload.password
        ),
        full_name=payload.full_name,
        role=payload.role,
        village_id=(
            village.id
            if village
            else None
        ),
        region=payload.region,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user_response(user)


@router.patch(
    "/users/{target_user_id}",
    response_model=UserAdminResponse,
)
def update_user(
    target_user_id: str,
    payload: UserUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    require_admin(user_id, db)

    user = (
        db.query(User)
        .filter(User.id == target_user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if payload.full_name is not None:
        user.full_name = payload.full_name

    if payload.role is not None:

        if payload.role not in [
            "chw",
            "authority",
            "admin",
        ]:
            raise HTTPException(
                status_code=400,
                detail="Invalid role.",
            )

        user.role = payload.role

    if payload.region is not None:
        user.region = payload.region

    if payload.village_id is not None:

        village = (
            db.query(Village)
            .filter(
                Village.id == payload.village_id
            )
            .first()
        )

        if not village:
            raise HTTPException(
                status_code=404,
                detail="Village not found.",
            )

        user.village_id = village.id

    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    return user_response(user)


@router.get(
    "/settings",
    response_model=SettingsResponse,
)
def get_settings(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    require_admin(user_id, db)

    threshold_setting = (
        db.query(SystemSetting)
        .filter(
            SystemSetting.setting_key
            == "cluster_threshold"
        )
        .first()
    )

    window_setting = (
        db.query(SystemSetting)
        .filter(
            SystemSetting.setting_key
            == "window_hours"
        )
        .first()
    )

    notification_setting = (
        db.query(SystemSetting)
        .filter(
            SystemSetting.setting_key
            == "notifications_enabled"
        )
        .first()
    )

    threshold = (
        int(threshold_setting.setting_value)
        if threshold_setting
        else settings.default_cluster_threshold
    )

    window_hours = (
        int(window_setting.setting_value)
        if window_setting
        else settings.default_window_hours
    )

    notifications_enabled = (
        notification_setting.setting_value.lower()
        == "true"
        if notification_setting
        else True
    )

    return SettingsResponse(
        cluster_threshold=threshold,
        window_hours=window_hours,
        notifications_enabled=notifications_enabled,
    )


@router.put(
    "/settings",
    response_model=SettingsResponse,
)
def update_settings(
    payload: SettingsUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    require_admin(user_id, db)

    values = {
        "cluster_threshold": str(
            payload.cluster_threshold
        ),
        "window_hours": str(
            payload.window_hours
        ),
        "notifications_enabled": str(
            payload.notifications_enabled
        ),
    }

    for key, value in values.items():

        setting = (
            db.query(SystemSetting)
            .filter(
                SystemSetting.setting_key == key
            )
            .first()
        )

        if setting:
            setting.setting_value = value
            setting.updated_at = datetime.now(
                timezone.utc
            )

        else:

            setting = SystemSetting(
                setting_key=key,
                setting_value=value,
            )

            db.add(setting)

    db.commit()

    return SettingsResponse(
        cluster_threshold=payload.cluster_threshold,
        window_hours=payload.window_hours,
        notifications_enabled=payload.notifications_enabled,
    )


@router.get("/villages")
def get_villages(
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

    if user.role not in [
        "chw",
        "authority",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied.",
        )

    villages = (
        db.query(Village)
        .order_by(Village.name)
        .all()
    )

    return [
        {
            "id": str(village.id),
            "name": village.name,
            "region": village.region,
            "district": village.district,
            "state": village.state,
        }
        for village in villages
    ]