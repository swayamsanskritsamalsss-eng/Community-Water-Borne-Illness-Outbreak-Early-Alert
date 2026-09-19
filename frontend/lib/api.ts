import {
  clearSessionToken,
  getSessionToken,
} from "./auth";


/*
 * API base URL.
 *
 * Priority:
 *   1. NEXT_PUBLIC_API_URL      (explicit, recommended)
 *   2. Same-origin /backend     (Vercel rewrite proxying to Render,
 *                                configured in vercel.json)
 *   3. http://localhost:8000    (local development)
 */
const isBrowser =
  typeof window !== "undefined";

const isLocalhost =
  isBrowser &&
  window.location.hostname === "localhost";

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isBrowser && !isLocalhost
    ? "/backend"
    : "http://localhost:8000");

// Guard against a trailing slash in the env var, which would
// produce requests like "//auth/login" (404).
const API_URL = RAW_API_URL.replace(/\/+$/, "");


export class ApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.status = status;
  }
}


async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {

  const token =
    getSessionToken();

  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Content-Type",
    "application/json"
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    }
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {

    if (
      response.status === 401
    ) {
      clearSessionToken();
    }

    const message =
      data?.detail ||
      "Something went wrong.";

    throw new ApiError(
      message,
      response.status
    );
  }

  return data as T;
}


/* ============================================================
   AUTH
   ============================================================ */

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "chw" | "authority" | "admin";
  village_id: string | null;
  village_name: string | null;
  region: string | null;
  is_active: boolean;
}


export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}


export async function login(
  email: string,
  password: string
) {
  return apiRequest<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
}


export async function getMe() {
  return apiRequest<User>(
    "/auth/me"
  );
}


export async function logout() {
  try {
    await apiRequest(
      "/auth/logout",
      {
        method: "POST",
      }
    );
  } finally {
    clearSessionToken();
  }
}


/* ============================================================
   REPORTS
   ============================================================ */

export interface Report {
  id: string;
  village_id: string;
  village_name: string;
  symptom: string;
  water_source: string | null;
  notes: string | null;
  has_photo: boolean;
  occurred_at: string;
  created_at: string;
}


/**
 * Resize + compress an image file in the browser (canvas), then
 * return base64 (no data: prefix) and the mime type. Keeps uploads
 * small (~50-200 KB typical) so they can be stored in the database
 * without external object storage.
 */
export async function compressImage(
  file: File,
  maxSize = 1024,
  quality = 0.7
): Promise<{ base64: string; mime: string }> {
  const dataUrl = await new Promise<string>(
    (resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read the image file."));
      reader.readAsDataURL(file);
    }
  );

  const img = await new Promise<HTMLImageElement>(
    (resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unsupported image format."));
      image.src = dataUrl;
    }
  );

  const scale = Math.min(
    1,
    maxSize / Math.max(img.width, img.height)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported in this browser.");
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const out = canvas.toDataURL("image/jpeg", quality);
  // dataUrl = "data:image/jpeg;base64,<payload>"
  const base64 = out.slice(out.indexOf(",") + 1);

  return { base64, mime: "image/jpeg" };
}


/**
 * URL of the photo endpoint for a report (used as <img src>).
 */
export function reportPhotoUrl(
  reportId: string
): string {
  const token = getSessionToken();
  // The <img> tag cannot send Authorization headers, so the token
  // rides in the query string; the backend accepts either.
  return `${API_URL}/reports/${reportId}/photo?token=${encodeURIComponent(
    token || ""
  )}`;
}


export interface ChwDashboard {
  total_reports: number;
  reports_last_24h: number;
  recent_reports: Report[];
}


export async function submitReport(
  report: {
    village_id: string;
    symptom: string;
    water_source?: string;
    notes?: string;
    photo_base64?: string;
    photo_mime?: string;
    occurred_at: string;
  }
) {
  return apiRequest<Report>(
    "/reports",
    {
      method: "POST",
      body: JSON.stringify(report),
    }
  );
}


export async function getMyReports() {
  return apiRequest<Report[]>(
    "/reports/my"
  );
}


export async function getChwDashboard() {
  return apiRequest<ChwDashboard>(
    "/reports/chw-dashboard"
  );
}


/* ============================================================
   ALERTS
   ============================================================ */

export interface Alert {
  id: string;
  village_id: string;
  village_name: string;
  report_count: number;
  threshold: number;
  window_hours: number;
  status:
    | "active"
    | "acknowledged"
    | "resolved";
  message: string;
  created_at: string;
}


export async function getAlerts() {
  return apiRequest<Alert[]>(
    "/alerts"
  );
}


export async function acknowledgeAlert(
  alertId: string
) {
  return apiRequest<Alert>(
    `/alerts/${alertId}/acknowledge`,
    {
      method: "POST",
    }
  );
}


export async function resolveAlert(
  alertId: string
) {
  return apiRequest<Alert>(
    `/alerts/${alertId}/resolve`,
    {
      method: "POST",
    }
  );
}


/* ============================================================
   AUTHORITY DASHBOARD
   ============================================================ */

export interface AuthorityDashboard {
  stats: {
    total_reports: number;
    reports_last_24h: number;
    active_alerts: number;
    affected_villages: number;
  };

  recent_reports: {
    id: string;
    village_name: string;
    symptom: string;
    water_source: string | null;
    has_photo: boolean;
    occurred_at: string;
  }[];

  alerts: Alert[];
}


export async function getAuthorityDashboard() {
  return apiRequest<AuthorityDashboard>(
    "/dashboard/authority"
  );
}


/* ============================================================
   ADMIN
   ============================================================ */

export interface AdminUser extends User {
  created_at: string;
}


export interface Village {
  id: string;
  name: string;
  region: string;
  district: string | null;
  state: string | null;
}


export interface SystemSettings {
  cluster_threshold: number;
  window_hours: number;
  notifications_enabled: boolean;
}


export async function getAdminUsers() {
  return apiRequest<AdminUser[]>(
    "/admin/users"
  );
}


export async function createAdminUser(
  payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    village_id?: string;
    region?: string;
  }
) {
  return apiRequest<AdminUser>(
    "/admin/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function updateAdminUser(
  userId: string,
  payload: {
    full_name?: string;
    role?: string;
    village_id?: string;
    region?: string;
    is_active?: boolean;
  }
) {
  return apiRequest<AdminUser>(
    `/admin/users/${userId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}


export async function getVillages() {
  return apiRequest<Village[]>(
    "/admin/villages"
  );
}


export async function getAdminSettings() {
  return apiRequest<SystemSettings>(
    "/admin/settings"
  );
}


export async function updateAdminSettings(
  settings: SystemSettings
) {
  return apiRequest<SystemSettings>(
    "/admin/settings",
    {
      method: "PUT",
      body: JSON.stringify(settings),
    }
  );
}


/* ============================================================
   PUSH NOTIFICATIONS
   ============================================================ */

export async function getPushPublicKey() {
  return apiRequest<{
    public_key: string;
  }>(
    "/alerts/push-public-key"
  );
}


export async function savePushSubscription(
  subscription: PushSubscription
) {

  const json =
    subscription.toJSON();

  return apiRequest(
    "/alerts/push-subscription",
    {
      method: "POST",
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
      }),
    }
  );
}