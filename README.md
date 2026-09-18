# Aarogya

**Aarogya** is a community health early-warning system built for the hackathon.
Community Health Workers (CHWs) submit observed illness reports; when reports
from the same village cross a configurable threshold within a configurable
time window, the system creates a **possible illness cluster** alert that
authorities can acknowledge and investigate. It is a triage/early-warning
tool — it does **not** diagnose outbreaks or confirm contaminated water.

## Architecture

```
frontend/  Next.js 14 (App Router) + Tailwind CSS PWA  ->  localhost:3000
backend/   FastAPI + SQLAlchemy + JWT auth             ->  localhost:8000
database/  PostgreSQL (Supabase) in production,
           SQLite fallback for local development
```

## Project structure

```
waterwatch/                 (root folder name is historical; product = Aarogya)
├── backend/
│   ├── app/
│   │   ├── api/            auth, reports, dashboard, alerts, admin routes
│   │   ├── core/           config, security (JWT + bcrypt)
│   │   ├── db/             SQLAlchemy models + session
│   │   └── services/       cluster detection, web push
│   ├── sql/schema.sql      PostgreSQL schema (Supabase setup)
│   └── requirements.txt
└── frontend/
    ├── app/                pages: login, chw, authority(+alerts), admin(+users,settings)
    ├── components/         Shell, AuthGuard, PushSetup
    ├── lib/                API client, cookie session helpers
    └── public/             manifest.webmanifest, sw.js, icon
```

## Roles

| Role      | Home             | Capabilities                                        |
|-----------|------------------|-----------------------------------------------------|
| CHW       | `/chw`           | Submit illness reports, view own reports            |
| AUTHORITY | `/authority`     | Dashboard, view/acknowledge/resolve alerts, push    |
| ADMIN     | `/admin`         | Everything authority has, plus user management and system settings |

Backend authorization is enforced on every endpoint (Bearer JWT in the
`Authorization` header); frontend guards are convenience only.

## Authentication / session notes

- Login returns a JWT; the frontend stores it in a **JavaScript-readable
  cookie** (`aarogya_session`, 7 days) and sends it as a Bearer token.
- This is a deliberate hackathon simplification: the token is NOT HttpOnly,
  so XSS could read it. A production deployment should move to
  HttpOnly+Secure+SameSite server-set cookies or short-lived refresh tokens.
- Logout clears the cookie; invalid/expired tokens are rejected with 401 and
  the frontend redirects to `/login`.

## Local development

### Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
copy .env.example .env        # then edit values if needed
python -m app.seed            # creates demo users, villages, settings
uvicorn app.main:app --reload
```

- Without `DATABASE_URL` set, the backend uses a local SQLite file
  (`aarogya.db`) so the demo runs with zero external services.
- For Supabase/PostgreSQL, set `DATABASE_URL` (see `.env.example`) and/or run
  `sql/schema.sql` in the Supabase SQL editor.

Demo accounts (created by the seed script):

| Role      | Email                     | Password       |
|-----------|---------------------------|----------------|
| ADMIN     | admin@aarogya.app       | Admin@123      |
| AUTHORITY | authority@aarogya.app   | Authority@123  |
| CHW       | chw@aarogya.app         | Chw@123        |

### Frontend

```powershell
cd frontend
npm install
copy .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000.

## Cluster detection (demo rule engine)

`same village + more than N reports within W hours => possible illness cluster`

- `N` (threshold) and `W` (window hours) are configurable by the admin at
  `/admin/settings` (defaults: 3 reports / 24 hours).
- Duplicate alerts for the same village/window are suppressed while an
  existing alert is active/acknowledged.
- Alert statuses: `active` -> `acknowledged` -> `resolved`.

## Web push

- VAPID keys are configured via `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_CLAIMS_EMAIL`. The `render.yaml` blueprint **generates them
  automatically** at provision time; locally, generate with
  `npx web-push generate-vapid-keys` or any EC P-256 keypair.
- **Verified end-to-end**: subscription storage -> cluster alert ->
  `pywebpush` aes128gcm-encrypted delivery -> ES256 VAPID signature
  validated against the public key -> payload decrypts to exactly
  `{title: "Aarogya Alert", message: "Possible illness cluster...",
  url: "/authority/alerts"}`, which the service worker displays and
  routes on click.
- Without keys configured, alert creation still succeeds and push is
  skipped with a logged warning.
- Authority users are asked for notification permission on dashboard
  load (`PushSetup` component); subscriptions are stored per
  user+endpoint.
- Note: browser push subscriptions require **HTTPS** (or localhost) and
  a reachable push service (FCM/Mozilla autopush) from the user's
  device.

## Known limitations

- Reports are **online-first**; there is no offline store-and-forward sync.
- Push notifications were only verified structurally (endpoints, worker
  handlers, subscription storage); end-to-end delivery requires VAPID keys
  and a real browser/device test.
- The cluster rule is a prototype, not a medically validated threshold.
