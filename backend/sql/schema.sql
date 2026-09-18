-- ============================================================
-- AAROGYA DATABASE SCHEMA
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- VILLAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    region VARCHAR(150) NOT NULL,

    district VARCHAR(150),

    state VARCHAR(150),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    role VARCHAR(30) NOT NULL
        CHECK (
            role IN (
                'chw',
                'authority',
                'admin'
            )
        ),

    village_id UUID REFERENCES villages(id),

    region VARCHAR(150),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    chw_id UUID NOT NULL
        REFERENCES users(id),

    village_id UUID NOT NULL
        REFERENCES villages(id),

    symptom VARCHAR(100) NOT NULL,

    water_source VARCHAR(150),

    notes TEXT,

    occurred_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    village_id UUID NOT NULL
        REFERENCES villages(id),

    report_count INTEGER NOT NULL,

    threshold INTEGER NOT NULL,

    window_hours INTEGER NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'acknowledged',
                'resolved'
            )
        ),

    message TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    resolved_at TIMESTAMPTZ
);


-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    endpoint TEXT NOT NULL,

    p256dh TEXT NOT NULL,

    auth TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, endpoint)
);


-- ============================================================
-- SYSTEM SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    setting_key VARCHAR(100) UNIQUE NOT NULL,

    setting_value VARCHAR(255) NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reports_village
ON reports(village_id);

CREATE INDEX IF NOT EXISTS idx_reports_created_at
ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_reports_occurred_at
ON reports(occurred_at);

CREATE INDEX IF NOT EXISTS idx_alerts_village
ON alerts(village_id);

CREATE INDEX IF NOT EXISTS idx_alerts_status
ON alerts(status);

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);


-- ============================================================
-- DEMO VILLAGES
-- ============================================================

INSERT INTO villages
    (name, region, district, state)
VALUES
    (
        'Rampur',
        'North Region',
        'Demo District',
        'Odisha'
    ),
    (
        'Lakshmipur',
        'North Region',
        'Demo District',
        'Odisha'
    ),
    (
        'Shantipur',
        'South Region',
        'Demo District',
        'Odisha'
    )
ON CONFLICT DO NOTHING;


-- ============================================================
-- DEFAULT SETTINGS
-- ============================================================

INSERT INTO system_settings
    (setting_key, setting_value)
VALUES
    ('cluster_threshold', '3'),
    ('window_hours', '24'),
    ('notifications_enabled', 'true')
ON CONFLICT (setting_key)
DO NOTHING;