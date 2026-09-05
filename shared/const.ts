export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

export function decodeOAuthState(state: string): { redirectUri: string } {
  try {
    const json = typeof Buffer !== "undefined"
      ? Buffer.from(state, "base64").toString("utf-8")
      : atob(state);
    try {
      const parsed = JSON.parse(json);
      if (parsed && typeof parsed.redirectUri === "string") {
        return { redirectUri: parsed.redirectUri };
      }
    } catch {
      return { redirectUri: json };
    }
    return { redirectUri: json };
  } catch {
    return { redirectUri: state };
  }
}
