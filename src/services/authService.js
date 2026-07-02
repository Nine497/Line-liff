import { apiClient } from "../api/apiClient";

export const authUser = async (liff) => {
  const idToken = liff.getIDToken();

  if (!idToken) {
    throw new Error("Missing LIFF ID Token");
  }

  try {
    // apiClient คืนค่า "data" แล้ว
    const user = await apiClient("/users", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });

    return user;

  } catch (error) {
    console.error("authUser failed:", error);

    if (error.status === 401) {
      // กัน loop login
      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        liff.logout();
        liff.login();
      }
      return null;
    }

    throw error;
  }
};