import { apiClient } from "./apiClient";

// =========================
// Tasks
// =========================
export const fetchTasks = async () => {
  return await apiClient("/tasks");
};

// =========================
// My Tasks (filtered by LIFF line_id)
// =========================
export const fetchMyTasks = async (lineId) => {
  return await apiClient(`/tasks/mine?line_id=${encodeURIComponent(lineId)}`);
};

// =========================
// Participants
// =========================
export const fetchParticipants = async () => {
  return await apiClient("/tasks/participants");
};

export const fetchAvailableParticipants = (start, end) => {
  return apiClient("/tasks/participants/available", {
    method: "POST",
    body: JSON.stringify({
      start,
      end,
    }),
  });
};
// =========================
// Task Types
// =========================
export const fetchTaskTypes = async () => {
  return await apiClient("/tasks/types");
};

// =========================
// Create Task
// =========================
export const createTask = async (payload) => {
  return await apiClient("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// =========================
// Import Excel
// =========================
export const importTasks = async (file, userId) => {
  const formData = new FormData();

  if (userId) {
    formData.append("user_id", userId);
  }

  formData.append("file", file);

  return await apiClient("/tasks/import", {
    method: "POST",
    body: formData,
  });
};