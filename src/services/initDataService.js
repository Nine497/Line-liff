import { fetchTasks, fetchParticipants, fetchTaskTypes } from "../api/tasks";

export const loadInitialData = async () => {
  const [tasks, types, participants] = await Promise.all([
    fetchTasks(),
    fetchTaskTypes(),
    fetchParticipants(),
  ]);

  return { tasks, types, participants };
};