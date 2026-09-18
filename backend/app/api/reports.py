from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.db.models import Report, User, Village
from app.db.session import get_db
from app.schemas import (
    ChwDashboardResponse,
    ReportCreate,
    ReportResponse,
)
from app.services.alerts import detect_possible_cluster
from app.services.notifications import notify_authorities


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def report_to_response(
    report: Report,
) -> ReportResponse:

    return ReportResponse(
        id=str(report.id),
        village_id=str(report.village_id),
        village_name=report.village.name,
        symptom=report.symptom,
        water_source=report.water_source,
        notes=report.notes,
        occurred_at=report.occurred_at,
        created_at=report.created_at,
    )


@router.post(
    "",
    response_model=ReportResponse,
)
def create_report(
    payload: ReportCreate,
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

    if user.role != "chw":
        raise HTTPException(
            status_code=403,
            detail="Only CHWs can submit reports.",
        )

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

    report = Report(
        chw_id=user.id,
        village_id=village.id,
        symptom=payload.symptom,
        water_source=payload.water_source,
        notes=payload.notes,
        occurred_at=payload.occurred_at,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    alert = detect_possible_cluster(
        db=db,
        village_id=village.id,
    )

    if alert:
        notify_authorities(
            db=db,
            alert=alert,
        )

    return report_to_response(report)


@router.get(
    "/my",
    response_model=list[ReportResponse],
)
def my_reports(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):

    reports = (
        db.query(Report)
        .filter(
            Report.chw_id == user_id
        )
        .order_by(
            Report.created_at.desc()
        )
        .limit(50)
        .all()
    )

    return [
        report_to_response(report)
        for report in reports
    ]


@router.get(
    "/chw-dashboard",
    response_model=ChwDashboardResponse,
)
def chw_dashboard(
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

    if user.role != "chw":
        raise HTTPException(
            status_code=403,
            detail="CHW access required.",
        )

    now = datetime.now(timezone.utc)

    yesterday = (
        now - timedelta(hours=24)
    )

    total_reports = (
        db.query(Report)
        .filter(
            Report.chw_id == user.id
        )
        .count()
    )

    reports_last_24h = (
        db.query(Report)
        .filter(
            Report.chw_id == user.id,
            Report.created_at >= yesterday,
        )
        .count()
    )

    recent = (
        db.query(Report)
        .filter(
            Report.chw_id == user.id
        )
        .order_by(
            Report.created_at.desc()
        )
        .limit(10)
        .all()
    )

    return ChwDashboardResponse(
        total_reports=total_reports,
        reports_last_24h=reports_last_24h,
        recent_reports=[
            report_to_response(report)
            for report in recent
        ],
    )