import json
import logging

from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Alert, PushSubscription


logger = logging.getLogger(__name__)


def send_push_notification(
    subscription: PushSubscription,
    title: str,
    message: str,
    url: str = "/authority/alerts",
):
    """
    Send a Web Push notification.

    If VAPID keys are not configured, the function
    safely skips sending.
    """

    if not settings.vapid_private_key:
        logger.warning(
            "VAPID private key is not configured. "
            "Skipping push notification."
        )
        return False

    subscription_info = {
        "endpoint": subscription.endpoint,
        "keys": {
            "p256dh": subscription.p256dh,
            "auth": subscription.auth,
        },
    }

    payload = json.dumps(
        {
            "title": title,
            "message": message,
            "url": url,
        }
    )

    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={
                "sub": settings.vapid_claims_email,
            },
        )

        return True

    except WebPushException as exc:
        logger.error(
            "Web Push failed: %s",
            exc,
        )

        return False

    except Exception as exc:
        logger.error(
            "Unexpected push notification error: %s",
            exc,
        )

        return False


def notify_authorities(
    db: Session,
    alert: Alert,
):
    """
    Notify all active authority users who have
    registered a push subscription.
    """

    from app.db.models import User

    authorities = (
        db.query(User)
        .filter(
            User.role == "authority",
            User.is_active.is_(True),
        )
        .all()
    )

    sent_count = 0

    for authority in authorities:

        for subscription in authority.push_subscriptions:

            success = send_push_notification(
                subscription=subscription,
                title="Aarogya Alert",
                message=alert.message,
            )

            if success:
                sent_count += 1

    return sent_count