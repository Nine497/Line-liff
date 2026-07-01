import { apiUrl } from "../lib/api";

export const fetchTasks = async () => {
  const response = await fetch(`${apiUrl}/tasks`);

  if (!response.ok) {
    throw new Error("Failed to load tasks from backend");
  }

  return response.json();
};

export const fetchParticipants = async () => {
  const response = await fetch(`${apiUrl}/tasks/participants`);

  if (!response.ok) {
    throw new Error("Failed to load participants");
  }

  return response.json();
};

export const fetchTaskTypes = async () => {
  const response = await fetch(`${apiUrl}/tasks/types`);

  if (!response.ok) {
    throw new Error("Failed to load task types");
  }

  return response.json();
};