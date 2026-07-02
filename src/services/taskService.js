import { apiClient } from "../api/apiClient";

export async function createTask(payload) {
  const { response, data } = await apiClient("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return { response, data };
}