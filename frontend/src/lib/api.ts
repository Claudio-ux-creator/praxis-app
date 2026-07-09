import type { ApiResponse } from "@shared/types/api";

const BASE_URL = "/api";

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json: ApiResponse<T> = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error ?? `HTTP ${res.status}` };
    }
    return json;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Netzwerkfehler",
    };
  }
}

export function get<T>(endpoint: string) {
  return request<T>(endpoint, { method: "GET" });
}

export function post<T>(endpoint: string, body: unknown) {
  return request<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function put<T>(endpoint: string, body: unknown) {
  return request<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function patch<T>(endpoint: string, body: unknown) {
  return request<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function del<T>(endpoint: string) {
  return request<T>(endpoint, { method: "DELETE" });
}