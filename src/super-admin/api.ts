import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://localhost:7061",
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("roomease_super_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && location.pathname.startsWith("/super-admin") && location.pathname !== "/super-admin/login") {
    localStorage.removeItem("roomease_super_admin_token");
    location.replace("/super-admin/login");
  }
  return Promise.reject(error);
});

export const saApi = {
  login: (email: string, password: string) => http.post("/api/super-admin/auth/login", { email, password }).then(r => r.data),
  me: () => http.get("/api/super-admin/me").then(r => r.data),
  dashboard: () => http.get("/api/super-admin/dashboard").then(r => r.data),
  clients: (params: Record<string, unknown>) => http.get("/api/super-admin/clients", { params }).then(r => r.data),
  client: (id: string) => http.get(`/api/super-admin/clients/${id}`).then(r => r.data),
  plans: () => http.get("/api/super-admin/plans").then(r => r.data),
  suspend: (id: string) => http.post(`/api/super-admin/clients/${id}/suspend`).then(r => r.data),
  reactivate: (id: string) => http.post(`/api/super-admin/clients/${id}/reactivate`).then(r => r.data),
  changePlan: (id: string, planId: string) => http.post(`/api/super-admin/clients/${id}/plan/${planId}`).then(r => r.data),
  module: (id: string, moduleId: string, enabled: boolean, reason: string) => http.post(`/api/super-admin/clients/${id}/modules/${moduleId}`, null, { params: { enabled, reason } }).then(r => r.data),
  limit: (id: string, code: string, value: number | undefined, unlimited: boolean, reason: string) => http.post(`/api/super-admin/clients/${id}/limits/${encodeURIComponent(code)}`, null, { params: { value, unlimited, reason } }).then(r => r.data),
  settings: (id: string) => http.get(`/api/super-admin/clients/${id}/settings`).then(r => r.data),
  saveSetting: (id: string, category: string, key: string, value: string, valueType: string) => http.post(`/api/super-admin/clients/${id}/settings`, null, { params: { category, key, value, valueType } }).then(r => r.data),
  impersonate: (id: string) => http.post(`/api/super-admin/clients/${id}/impersonate`).then(r => r.data),
  audits: (params: Record<string, unknown>) => http.get("/api/super-admin/audit-logs", { params }).then(r => r.data),
  permissions: (params: Record<string, unknown>) => http.get("/api/super-admin/permission-catalog", { params }).then(r => r.data),
  createPermission: (body: Record<string, unknown>) => http.post("/api/super-admin/permission-catalog", body).then(r => r.data),
  updatePermission: (id: string, body: Record<string, unknown>) => http.put(`/api/super-admin/permission-catalog/${id}`, body).then(r => r.data),
  permissionStatus: (id: string, isActive: boolean) => http.patch(`/api/super-admin/permission-catalog/${id}/status`, { isActive }).then(r => r.data),
  announcements: (params: Record<string, unknown>) => http.get("/api/super-admin/announcements", { params }).then(r => r.data),
  createAnnouncement: (body: Record<string, unknown>) => http.post("/api/super-admin/announcements", body).then(r => r.data),
  announcementStatus: (id: string, isPublished: boolean) => http.patch(`/api/super-admin/announcements/${id}/status`, { isPublished }).then(r => r.data),
};

export function saError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; title?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.title) return data.title;
    if (error.response) return `API request failed (${error.response.status} ${error.response.statusText}).`;
    return `Could not reach the API: ${error.message}`;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}
