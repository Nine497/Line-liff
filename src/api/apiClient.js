import { apiUrl } from "../lib/api";

export async function apiClient(url, options = {}) {
  // FormData bodies (file uploads) need the browser to set their own
  // multipart Content-Type with boundary — forcing application/json here
  // would silently corrupt the request.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const response = await fetch(`${apiUrl}${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // ❌ ERROR HANDLING
  if (!response.ok || !data?.success) {
    const error = new Error(
      data?.error?.message || data?.message || "API Error"
    );

    console.error("API Error:", {
      url,
      status: response.status,
      data,
    });

    error.status = response.status;
    error.code = data?.error?.code || "UNKNOWN_ERROR";
    error.extra = data?.error?.extra || null;

    throw error;
  }

  // ✔️ return เฉพาะ data จริง
  return data.data;
}