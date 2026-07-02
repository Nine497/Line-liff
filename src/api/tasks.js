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

// =========================
// Task Types
// =========================
export const fetchTaskTypes = async () => {
  return await apiClient("/tasks/types");
};