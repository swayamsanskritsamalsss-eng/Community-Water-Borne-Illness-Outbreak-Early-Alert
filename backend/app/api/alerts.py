from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user_id
from app.db.models import Alert, PushSubscription, User
from app.db.session import get_db
from app.schemas import (
    AlertResponse,
    PushSubscriptionRequest,
)
from app.services.notifications import send_push_notification


router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"],
)


def alert_response(
    alert: Alert,
) -> AlertResponse:

    return AlertResponse(
        id=str(alert.id),
        village_id=str(alert.village_id),
        village_name=alert.village.name,
        report_count=alert.report_count,
        threshold=alert.threshold,
        window_hours=alert.window_hours,
        status=alert.status,
        message=alert.message,
        created_at=alert.created_at,
    )


@router.get(
    "",
    response_model=list[AlertResponse],
)
def get_alerts(
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
        "authority",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Authority access required.",
        )

    alerts = (
        db.query(Alert)
        .order_by(
            Alert.created_at.desc()
        )
        .limit(100)
        .all()
    )

    return [
        alert_response(alert)
        for alert in alerts
    ]


@router.post(
    "/{alert_id}/acknowledge",
    response_model=AlertResponse,
)
def acknowledge_alert(
    alert_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user or user.role not in [
        "authority",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Authority access required.",
        )

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found.",
        )

    alert.status = "acknowledged"

    db.commit()
    db.refresh(alert)

    return alert_response(alert)


@router.post(
    "/{alert_id}/resolve",
    response_model=AlertResponse,
)
def resolve_alert(
    alert_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user or user.role not in [
        "authority",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Authority access required.",
        )

    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id)
        .first()
    )

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found.",
        )

    alert.status = "resolved"
    alert.resolved_at = datetime.now(
        timezone.utc
    )

    db.commit()
    db.refresh(alert)

    return alert_response(alert)


@router.get("/push-public-key")
def push_public_key():
    return {
        "public_key": settings.vapid_public_key
    }


@router.post("/push-subscription")
def save_push_subscription(
    payload: PushSubscriptionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    existing = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint
            == payload.endpoint,
        )
        .first()
    )

    if existing:

        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
        existing.updated_at = datetime.now(
            timezone.utc
        )

    else:

        subscription = PushSubscription(
            user_id=user_id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
        )

        db.add(subscription)

    db.commit()

    return {
        "message": "Push subscription saved."
    }


@router.delete("/push-subscription")
def delete_push_subscription(
    payload: PushSubscriptionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    subscription = (
        db.query(PushSubscription)
        .filter(
            PushSubscription.user_id == user_id,
            PushSubscription.endpoint
            == payload.endpoint,
        )
        .first()
    )

    if subscription:
        db.delete(subscription)
        db.commit()

    return {
        "message": "Push subscription removed."
    }