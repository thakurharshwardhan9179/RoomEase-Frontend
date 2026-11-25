export const SESSION_KEYS = {
  token: "roomease_token",
  owner: "roomease_owner",
  propertyId: "roomease_property_id",
} as const;

export interface StoredOwner {
  fullName?: string;
  ownerId?: string;
  hasProperty?: boolean;
  documentsSubmitted?: boolean;
  userType?: "Owner" | "TeamUser";
  accountUserId?: string;
  roleName?: string;
  permissions?: string[];
  modules?: { code: string; name?: string }[];
  accessLoaded?: boolean;
}

export function getToken(): string | null {
  return localStorage.getItem(SESSION_KEYS.token);
}

export function getOwner(): StoredOwner {
  try {
    const raw = localStorage.getItem(SESSION_KEYS.owner);
    return raw ? (JSON.parse(raw) as StoredOwner) : {};
  } catch {
    return {};
  }
}

export function setSession(token: string, owner: StoredOwner): void {
  localStorage.setItem(SESSION_KEYS.token, token);
  localStorage.setItem(SESSION_KEYS.owner, JSON.stringify(owner));
}

export function clearSession(): void {
  Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
