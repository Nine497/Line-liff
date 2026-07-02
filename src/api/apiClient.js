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

  //  ERROR FORMAT
  if (!response.ok) {
    const error = new Error(data?.error || "API Error");

    error.status = response.status;
    error.data = data;

    error.type =
      response.status === 409
        ? "CONFLICT"
        : response.status === 401
        ? "UNAUTHORIZED"
        : "GENERAL_ERROR";

    throw error;
  }

  return data;
}