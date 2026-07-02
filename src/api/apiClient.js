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

  // ❌ ERROR HANDLING
  if (!response.ok || !data?.success) {
    const error = new Error(data?.error?.message || "API Error");
    console.error("API Error:", {
      url,
      status: response.status, }),  
    error.status = response.status;
    error.code = data?.error?.code || "UNKNOWN_ERROR";
    error.extra = data?.error?.extra || null;

    throw error;
  }

  // ✔️ return เฉพาะ data จริง
  return data.data;
}