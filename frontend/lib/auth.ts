"use client";

const COOKIE_NAME = "aarogya_session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;


function isProduction() {
  return (
    typeof window !== "undefined" &&
    window.location.protocol === "https:"
  );
}


export function setSessionToken(
  token: string
) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = isProduction()
    ? "; Secure"
    : "";

  document.cookie =
    `${COOKIE_NAME}=${encodeURIComponent(token)}` +
    `; Path=/` +
    `; Max-Age=${COOKIE_MAX_AGE}` +
    `; SameSite=Lax` +
    secure;
}


export function getSessionToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [name, ...valueParts] =
      cookie.trim().split("=");

    if (name === COOKIE_NAME) {
      return decodeURIComponent(
        valueParts.join("=")
      );
    }
  }

  return null;
}


export function clearSessionToken() {
  if (typeof document === "undefined") {
    return;
  }

  const secure = isProduction()
    ? "; Secure"
    : "";

  document.cookie =
    `${COOKIE_NAME}=` +
    `; Path=/` +
    `; Max-Age=0` +
    `; SameSite=Lax` +
    secure;
}


export function hasSession(): boolean {
  return Boolean(
    getSessionToken()
  );
}