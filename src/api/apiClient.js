import liff from "@line/liff";
import { apiUrl } from "../lib/api";

export async function apiClient(url, options = {}) {
  // FormData bodies (file uploads) need the browser to set their own
  // multipart Content-Type with boundary — forcing application/json here
  // would silently corrupt the request.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  // Mutating routes verify this token server-side and resolve the real
  // creator/user from it — by the time any API call happens, initLiff()
  // has already succeeded, so getIDToken() is safe to call here.
  let authHeader = {};
  try {
    const token = liff.getIDToken?.();
    if (token) authHeader = { Authorization: `Bearer ${token}` };
  } catch {
    // Not logged in yet (e.g. the very first /users call during init) —
    // proceed without it; routes that require auth will reject anyway.
  }

  const response = await fetch(`${apiUrl}${url}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...authHeader,
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