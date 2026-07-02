import { apiClient } from "../api/apiClient";

export const authUser = async (liff) => {
  const idToken = liff.getIDToken();

  if (!idToken) {
    throw new Error("Missing LIFF ID Token");
  }

  try {
    const data = await apiClient("/users", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });

    return data.user;

  } catch (error) {
    if (error.status === 401) {
      liff.logout();
      liff.login();
      return null;
    }

    throw error;
  }
};