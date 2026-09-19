import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.types import CHAR, TypeDecorator
from sqlalchemy.orm import relationship

from app.db.session import Base


class GUID(TypeDecorator):
    """
    Platform-independent GUID/UUID type.

    - PostgreSQL/Supabase: uses the native UUID type.
    - SQLite (local demo fallback): stores CHAR(36) strings.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(
                PGUUID(as_uuid=True)
            )
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(str(value))
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value


def utc_now():
    return datetime.now(timezone.utc)


class Village(Base):
    __tablename__ = "villages"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    region = Column(
        String(150),
        nullable=False,
    )

    district = Column(
        String(150),
        nullable=True,
    )

    state = Column(
        String(150),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    users = relationship(
        "User",
        back_populates="village",
    )

    reports = relationship(
        "Report",
        back_populates="village",
    )

    alerts = relationship(
        "Alert",
        back_populates="village",
    )


class User(Base):
    __tablename__ = "users"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    full_name = Column(
        String(150),
        nullable=False,
    )

    role = Column(
        String(30),
        nullable=False,
    )

    village_id = Column(
        GUID,
        ForeignKey("villages.id"),
        nullable=True,
    )

    region = Column(
        String(150),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    village = relationship(
        "Village",
        back_populates="users",
    )

    reports = relationship(
        "Report",
        back_populates="chw",
    )

    push_subscriptions = relationship(
        "PushSubscription",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Report(Base):
    __tablename__ = "reports"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )

    chw_id = Column(
        GUID,
        ForeignKey("users.id"),
        nullable=False,
    )

    village_id = Column(
        GUID,
        ForeignKey("villages.id"),
        nullable=False,
    )

    symptom = Column(
        String(100),
        nullable=False,
    )

    water_source = Column(
        String(150),
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    # Optional photo of the situation, captured by the CHW.
    # Stored as raw base64 (no data: prefix) + mime type so the
    # demo needs no external object storage.
    photo_base64 = Column(
        Text,
        nullable=True,
    )

    photo_mime = Column(
        String(50),
        nullable=True,
    )

    occurred_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    chw = relationship(
        "User",
        back_populates="reports",
    )

    village = relationship(
        "Village",
        back_populates="reports",
    )


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )

    village_id = Column(
        GUID,
        ForeignKey("villages.id"),
        nullable=False,
    )

    report_count = Column(
        Integer,
        nullable=False,
    )

    threshold = Column(
        Integer,
        nullable=False,
    )

    window_hours = Column(
        Integer,
        nullable=False,
    )

    status = Column(
        String(30),
        default="active",
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    village = relationship(
        "Village",
        back_populates="alerts",
    )


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id = Column(
        GUID,
        ForeignKey("users.id"),
        nullable=False,
    )

    endpoint = Column(
        Text,
        nullable=False,
    )

    p256dh = Column(
        Text,
        nullable=False,
    )

    auth = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="push_subscriptions",
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "endpoint",
            name="uq_push_user_endpoint",
        ),
    )


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )

    setting_key = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    setting_value = Column(
        String(255),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )