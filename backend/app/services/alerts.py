from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Alert, Report


def get_setting(
    db: Session,
    key: str,
    default: int,
) -> int:
    """
    Read a numeric setting from the database.

    For the hackathon MVP we use the environment defaults
    if no database setting exists.
    """

    from app.db.models import SystemSetting

    setting = (
        db.query(SystemSetting)
        .filter(SystemSetting.setting_key == key)
        .first()
    )

    if not setting:
        return default

    try:
        return int(setting.setting_value)
    except ValueError:
        return default


def detect_possible_cluster(
    db: Session,
    village_id,
) -> Alert | None:
    """
    Detect a possible illness cluster.

    IMPORTANT:
    This does NOT diagnose an outbreak.

    It simply checks whether the number of reports
    crosses the configured demo threshold.
    """

    threshold = get_setting(
        db,
        "cluster_threshold",
        settings.default_cluster_threshold,
    )

    window_hours = get_setting(
        db,
        "window_hours",
        settings.default_window_hours,
    )

    now = datetime.now(timezone.utc)

    start_time = now - timedelta(
        hours=window_hours
    )

    report_count = (
        db.query(func.count(Report.id))
        .filter(
            Report.village_id == village_id,
            Report.created_at >= start_time,
        )
        .scalar()
    )

    if report_count is None:
        report_count = 0

    if report_count <= threshold:
        return None

    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.village_id == village_id,
            Alert.status.in_(
                ["active", "acknowledged"]
            ),
            Alert.created_at >= start_time,
        )
        .first()
    )

    if existing_alert:
        return existing_alert

    message = (
        f"Possible illness cluster detected: "
        f"{report_count} reports from this village "
        f"within {window_hours} hours. "
        f"Investigation is recommended."
    )

    alert = Alert(
        village_id=village_id,
        report_count=report_count,
        threshold=threshold,
        window_hours=window_hours,
        status="active",
        message=message,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert