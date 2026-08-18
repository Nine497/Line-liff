import { apiClient } from "./apiClient";

// =========================
// Tasks
// =========================
export const fetchTasks = async () => {
  return await apiClient("/tasks");
};

export const fetchMyTasks = async (lineId, userId) => {
  const params = new URLSearchParams();
  if (lineId && lineId !== "undefined" && lineId !== "null") params.append("line_id", lineId);
  if (userId && userId !== "undefined" && userId !== "null") params.append("user_id", userId);
  const queryStr = params.toString();
  return await apiClient(`/tasks/mine${queryStr ? `?${queryStr}` : ""}`);
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
export const importTasks = async (file, userId, isDuty = false) => {
  const formData = new FormData();

  if (userId) {
    formData.append("user_id", userId);
  }

  formData.append("file", file);
  formData.append("is_duty", isDuty ? "true" : "false");

  return await apiClient("/tasks/import", {
    method: "POST",
    body: formData,
  });
};