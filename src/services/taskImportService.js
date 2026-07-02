import { apiUrl } from "../lib/api";

export async function importTasks(file, userId) {
  const formData = new FormData();

  if (userId) {
    formData.append("user_id", userId);
  }

  formData.append("file", file);

  const response = await fetch(`${apiUrl}/tasks/import`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error || "Import failed");
  }

  return result;
}