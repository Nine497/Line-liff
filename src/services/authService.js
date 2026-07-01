import { apiUrl } from "../lib/api";

export const authUser = async (liff) => {
  const idToken = liff.getIDToken();

  if (!idToken) {
    throw new Error("Missing LIFF ID Token");
  }

  const response = await fetch(`${apiUrl}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  const result = await response.json();

  if (response.status === 401) {
    liff.logout();
    liff.login();
    return null;
  }

  if (!response.ok) {
    throw new Error(result.error || "Failed to sync user");
  }

  return result.user;
};