import { apiUrl } from "../lib/api";

export async function createTask(payload) {
  const response = await fetch(`${apiUrl}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result?.error || "Request failed");
    error.status = response.status;
    error.data = result;
    throw error;
  }

  return result;
}