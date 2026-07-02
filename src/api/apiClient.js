import { apiUrl } from "../lib/api";

export async function apiClient(url, options = {}) {
  const response = await fetch(`${apiUrl}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  // =========================
  // ❌ handle error ที่เดียว
  // =========================
  if (!response.ok) {
    const error = new Error(data?.error || "API Error");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}