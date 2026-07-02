import { apiClient } from "../api/apiClient";

export async function importTasks(file, userId) {
  const formData = new FormData();

  if (userId) {
    formData.append("user_id", userId);
  }

  formData.append("file", file);

  return await apiClient("/tasks/import", {
    method: "POST",
    body: formData,
    headers: {
      // ❗ ไม่ต้อง set Content-Type (browser จะจัด boundary ให้เอง)
    },
  });
}