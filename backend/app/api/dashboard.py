from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.db.models import Alert, Report, User, Village
from app.db.session import get_db
from app.schemas import (
    AuthorityDashboardResponse,
    DashboardStats,
    RecentReport,
    AlertResponse,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def alert_to_response(
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
    "/authority",
    response_model=AuthorityDashboardResponse,
)
def authority_dashboard(
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

    if user.role not in ["authority", "admin"]:
        raise HTTPException(
            status_code=403,
            detail="Authority access required.",
        )

    now = datetime.now(timezone.utc)

    yesterday = (
        now - timedelta(hours=24)
    )

    total_reports = (
        db.query(Report)
        .count()
    )

    reports_last_24h = (
        db.query(Report)
        .filter(
            Report.created_at >= yesterday
        )
        .count()
    )

    active_alerts = (
        db.query(Alert)
        .filter(
            Alert.status.in_(
                ["active", "acknowledged"]
            )
        )
        .count()
    )

    affected_villages = (
        db.query(
            func.count(
                func.distinct(
                    Alert.village_id
                )
            )
        )
        .filter(
            Alert.status.in_(
                ["active", "acknowledged"]
            )
        )
        .scalar()
    )

    recent_reports = (
        db.query(Report)
        .order_by(
            Report.created_at.desc()
        )
        .limit(10)
        .all()
    )

    alerts = (
        db.query(Alert)
        .order_by(
            Alert.created_at.desc()
        )
        .limit(10)
        .all()
    )

    return AuthorityDashboardResponse(
        stats=DashboardStats(
            total_reports=total_reports,
            reports_last_24h=reports_last_24h,
            active_alerts=active_alerts,
            affected_villages=affected_villages or 0,
        ),
        recent_reports=[
            RecentReport(
                id=str(report.id),
                village_name=report.village.name,
                symptom=report.symptom,
                water_source=report.water_source,
                has_photo=bool(report.photo_base64),
                occurred_at=report.occurred_at,
            )
            for report in recent_reports
        ],
        alerts=[
            alert_to_response(alert)
            for alert in alerts
        ],
    )