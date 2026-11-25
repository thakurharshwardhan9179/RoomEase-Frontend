import axios, {
  AxiosError,
  type AxiosRequestConfig,
} from "axios";
import {
  clearSession,
  getToken,
} from "../utils/session";
import { clearGuestSession } from "../utils/guestSession";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://localhost:7061",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (
      token &&
      !config.headers.Authorization
    ) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    // Proactively attach active property ID header if available in localStorage
    try {
      const activePropertyId = localStorage.getItem("roomease_property_id");
      if (activePropertyId && !config.headers["X-Property-Id"]) {
        config.headers["X-Property-Id"] = activePropertyId;
      }
    } catch {
      // Ignore storage errors safely
    }

    if (
      config.data instanceof FormData
    ) {
      delete config.headers[
        "Content-Type"
      ];
    } else if (
      config.data !== undefined &&
      !config.headers["Content-Type"]
    ) {
      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },
);

api.interceptors.response.use(
  (response) => response,
  (
    error: AxiosError<{
      message?: string;
    }>,
  ) => {
    const status =
      error.response?.status;

    const currentPath =
      window.location.pathname;

    const requestUrl =
      error.config?.url || "";

    const isGuestPage =
      currentPath.startsWith(
        "/guest",
      );

    const isGuestApi =
      requestUrl.startsWith(
        "/api/guest",
      ) ||
      requestUrl.startsWith(
        "/api/guest-access",
      );

    /*
     * Guest session expired / checkout happened.
     * Do NOT redirect to owner login.
     */
    if (
      status === 401 &&
      (isGuestPage ||
        isGuestApi)
    ) {
      clearGuestSession();

      return Promise.reject(
        error,
      );
    }

    /*
     * Normal owner/admin session
     */
    if (status === 401) {
      clearSession();

      if (
        window.location.pathname !==
        "/login"
      ) {
        window.location.replace(
          "/login",
        );
      }
    }

    return Promise.reject(
      error,
    );
  },
);

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;

    if (data) {
      // 1. Direct message field
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }

      // 2. ASP.NET Core ValidationProblemDetails (errors dictionary)
      if (data.errors && typeof data.errors === "object") {
        const errorEntries = Object.values(data.errors as Record<string, unknown>).flat();
        const firstError = errorEntries.find((e) => typeof e === "string" && e.trim());
        if (typeof firstError === "string") {
          return firstError;
        }
      }

      // 3. RFC problem details title
      if (typeof data.title === "string" && data.title.trim()) {
        return data.title;
      }
    }

    if (error.code === "ERR_NETWORK") {
      return "Unable to reach RoomEase server. Check that the backend is running.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function withSignal(
  config:
    | AxiosRequestConfig
    | undefined,
  signal?: AbortSignal,
): AxiosRequestConfig {
  return signal
    ? {
        ...(config ?? {}),
        signal,
      }
    : (config ?? {});
}

export default api;