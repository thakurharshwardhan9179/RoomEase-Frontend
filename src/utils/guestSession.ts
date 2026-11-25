const GUEST_SESSION_KEY = "roomease_guest_session_token";
const GUEST_BED_TOKEN_KEY = "roomease_guest_bed_token";

export function saveGuestSession(
  guestSessionToken: string,
  bedToken: string,
) {
  sessionStorage.setItem(
    GUEST_SESSION_KEY,
    guestSessionToken,
  );

  sessionStorage.setItem(
    GUEST_BED_TOKEN_KEY,
    bedToken,
  );
}

export function getGuestSessionToken(): string | null {
  return sessionStorage.getItem(
    GUEST_SESSION_KEY,
  );
}

export function getGuestBedToken(): string | null {
  return sessionStorage.getItem(
    GUEST_BED_TOKEN_KEY,
  );
}

export function clearGuestSession() {
  sessionStorage.removeItem(
    GUEST_SESSION_KEY,
  );

  sessionStorage.removeItem(
    GUEST_BED_TOKEN_KEY,
  );
}

export function hasGuestSession(): boolean {
  return Boolean(
    getGuestSessionToken(),
  );
}

