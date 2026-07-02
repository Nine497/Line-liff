import { apiClient } from "./apiClient";

// =========================
// Tasks
// =========================
export const fetchTasks = async () => {
  return await apiClient("/tasks");
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