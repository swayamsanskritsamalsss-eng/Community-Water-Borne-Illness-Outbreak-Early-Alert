# Aarogya — Deployment Checklist

## Backend (Render / Railway / any Python host)

- [ ] Python 3.11+, install `backend/requirements.txt`
- [ ] Set environment variables:
  - [ ] `PYTHON_VERSION` — `3.11.9` (REQUIRED on Render: the default
        Python 3.14 cannot build pydantic-core from source)
  - [ ] `DATABASE_URL` — Supabase/PostgreSQL connection string
        (any format works: `postgres://`, `postgresql://`,
        `postgresql+psycopg://` — the app normalizes automatically)
  - [ ] `JWT_SECRET` — long random value (NOT the default)
  - [ ] `FRONTEND_URL` — production frontend URL (CORS allow-list)
  - [ ] `ENVIRONMENT=production`
  - [ ] Optional: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CLAIMS_EMAIL`
        (required only for web push)
  - [ ] `DEFAULT_CLUSTER_THRESHOLD`, `DEFAULT_WINDOW_HOURS` (defaults 3 / 24)
- [ ] Initialize DB: run `backend/sql/schema.sql` in Supabase SQL editor,
      or let `Base.metadata.create_all` create tables on first boot
- [ ] Seed demo data: `python -m app.seed` (optional, demo only)
- [ ] Verify `GET /health` returns `{"status": "healthy"}`

## Frontend (Vercel)

- [ ] Set `NEXT_PUBLIC_API_URL` to the production backend URL
- [ ] Build command `npm run build`, framework Next.js
- [ ] Confirm service worker is served at `/sw.js` with no-cache headers
- [ ] Confirm `/manifest.webmanifest` is reachable and names **Aarogya**

## Cross-domain notes (Vercel + Render)

- The JWT is stored in a JavaScript-readable cookie and sent via the
  `Authorization` header, so cross-origin auth works without third-party
  cookie changes. CORS on the backend must include the frontend origin and
  `allow_credentials=True`.
- Known limitation: the cookie is readable by JavaScript (XSS risk).
  Acceptable for the hackathon demo; harden before real use.

## Database (Supabase)

- [ ] Tables: villages, users, reports, alerts, push_subscriptions,
      system_settings (see `backend/sql/schema.sql`)
- [ ] UUID primary keys (pgcrypto / `gen_random_uuid()`)
- [ ] Row Level Security: not used — the FastAPI backend enforces access
      control; do NOT expose the database directly to clients

## Push notifications (optional)

- [ ] Generate VAPID keys (e.g. `npx web-push generate-vapid-keys`)
- [ ] Set keys + `VAPID_CLAIMS_EMAIL` (mailto:) on the backend
- [ ] Test: subscribe an authority device, submit enough reports in one
      village to cross the threshold, confirm notification arrives

## Security

- [ ] Change all demo passwords (`Admin@123`, `Authority@123`, `Chw@123`)
- [ ] Rotate `JWT_SECRET` away from any committed default
- [ ] No secrets in frontend `NEXT_PUBLIC_*` variables
      (only the API URL, which is public)
- [ ] Demo emails use `@aarogya.app` — replace with real accounts

## Smoke test before demo

1. Login as each role (CHW / Authority / Admin)
2. Submit 4+ reports in one village as CHW -> cluster alert appears
3. Authority dashboard shows stats + alert; acknowledge and resolve it
4. Admin: create a user, disable a user, save settings
5. Logout, refresh, verify redirect to login; direct URL access blocked

---

# Zero-configuration deployment (render.yaml + Vercel)

## One-time setup

1. Push this repository to GitHub.
2. **Backend (Render):**
   - Render dashboard → **New → Blueprint** → select the repo.
   - Render reads `render.yaml` and provisions everything:
     - free PostgreSQL instance (`aarogya-db`)
     - `aarogya-api` web service (root dir `backend`)
     - `DATABASE_URL` wired automatically (any `postgres://` /
       `postgresql://` URL format is normalized by the app)
     - `JWT_SECRET` auto-generated
     - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` auto-generated
     - DB tables created + demo data seeded on first boot
   - First deploy gives you `https://aarogya-api.onrender.com`.
3. **Frontend (Vercel):**
   - Vercel dashboard → **Add New → Project** → import the repo.
   - Set **Root Directory** to `frontend`. Everything else comes
     from `frontend/vercel.json` (framework + `/backend/*` proxy
     rewrite to `https://aarogya-api.onrender.com`).
   - Deploy. You get `https://<project>.vercel.app`.
   - The frontend calls `/backend/...` same-origin in production,
     so **no NEXT_PUBLIC_API_URL is required**.
4. **Final wiring (30 seconds):** in Render, set the service env var
   `FRONTEND_URL=https://<your-vercel-url>` (removes the CORS `*`
   fallback and locks the API to your frontend only). Render redeploys
   automatically.

## Verify after deploy

```powershell
curl https://aarogya-api.onrender.com/health
curl https://aarogya-api.onrender.com/alerts/push-public-key   # should return a key
```

Then open the Vercel URL, log in with the demo accounts, submit 4
reports in one village as CHW, and confirm the authority dashboard
shows the cluster alert.
