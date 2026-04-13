import { fetch } from "expo/fetch";
import { authClient } from "../auth/auth-client";

// Response envelope type - all app routes return { data: T }
interface ApiResponse<T> {
  data: T;
}

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

const request = async <T>(
  url: string,
  options: { method?: string; body?: string } = {}
): Promise<T | null> => {
  const cookieHeader =
    typeof authClient.getCookie === "function" ? authClient.getCookie() : "";
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });

  // 1. Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  // 2. Handle error responses
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Not JSON or no message
    }
    throw new Error(errorMessage);
  }

  // 3. JSON responses: parse and unwrap { data }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json = await response.json();
    // Handle both { data: T } and { error: ... } responses
    if (json && "data" in json) {
      return json.data ?? null;
    }
    if (json && "error" in json) {
      throw new Error(json.error || "Unknown API error");
    }
    return json as T;
  }

  // 4. Non-JSON: return null
  return null;
};

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
};
