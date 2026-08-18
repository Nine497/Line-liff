import { apiClient } from "../api/apiClient";

export const authUser = async (liff) => {
  const idToken = liff.getIDToken();

  if (!idToken) {
    throw new Error("Missing LIFF ID Token");
  }

  try {
    // Temporary standalone login endpoint — accepts both the portal channel
    // and the Scheduler LIFF channel, and self-registers unknown line_ids as
    // no-permission "custom" users. Swap back to /users once the portal's
    // own /auth/bind-line flow is the intended path for this app.
    // apiClient คืนค่า "data" แล้ว
    const user = await apiClient("/users/standalone_login", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });

    return user;

  } catch (error) {
    console.error("authUser failed:", error);

    if (error.status === 401) {
      if (liff.isLoggedIn()) {
        liff.logout();
      }
      return null;
    }

    throw error;
  }
};