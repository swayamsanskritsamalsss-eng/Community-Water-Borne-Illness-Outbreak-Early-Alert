from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ============================================================
# AUTH
# ============================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    role: str
    village_id: Optional[str] = None
    village_name: Optional[str] = None
    region: Optional[str] = None
    is_active: bool


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# REPORTS
# ============================================================

class ReportCreate(BaseModel):
    village_id: str
    symptom: str = Field(min_length=1, max_length=100)
    water_source: Optional[str] = Field(
        default=None,
        max_length=150,
    )
    notes: Optional[str] = Field(
        default=None,
        max_length=1000,
    )
    occurred_at: datetime


class ReportResponse(BaseModel):
    id: str
    village_id: str
    village_name: str
    symptom: str
    water_source: Optional[str]
    notes: Optional[str]
    occurred_at: datetime
    created_at: datetime


# ============================================================
# ALERTS
# ============================================================

class AlertResponse(BaseModel):
    id: str
    village_id: str
    village_name: str
    report_count: int
    threshold: int
    window_hours: int
    status: str
    message: str
    created_at: datetime


# ============================================================
# PUSH NOTIFICATIONS
# ============================================================

class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys


# ============================================================
# ADMIN
# ============================================================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2, max_length=150)
    role: str
    village_id: Optional[str] = None
    region: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    village_id: Optional[str] = None
    region: Optional[str] = None
    is_active: Optional[bool] = None


class UserAdminResponse(UserResponse):
    created_at: datetime


class SettingsResponse(BaseModel):
    cluster_threshold: int
    window_hours: int
    notifications_enabled: bool


class SettingsUpdate(BaseModel):
    cluster_threshold: int = Field(
        ge=1,
        le=100,
    )

    window_hours: int = Field(
        ge=1,
        le=168,
    )

    notifications_enabled: bool


# ============================================================
# DASHBOARD
# ============================================================

class DashboardStats(BaseModel):
    total_reports: int
    reports_last_24h: int
    active_alerts: int
    affected_villages: int


class RecentReport(BaseModel):
    id: str
    village_name: str
    symptom: str
    water_source: Optional[str]
    occurred_at: datetime


class AuthorityDashboardResponse(BaseModel):
    stats: DashboardStats
    recent_reports: list[RecentReport]
    alerts: list[AlertResponse]


class ChwDashboardResponse(BaseModel):
    total_reports: int
    reports_last_24h: int
    recent_reports: list[ReportResponse]