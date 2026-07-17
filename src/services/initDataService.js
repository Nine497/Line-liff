import { fetchParticipants, fetchTaskTypes } from "../api/tasks";

// The task list itself is loaded separately via useTaskEvents (react-query)
// and useInitApp's explicit fetchTaskEvents() call — this used to also
// fetch it here and discard the result, tripling the /tasks request on
// every cold start for no reason.
export const loadInitialData = async () => {
  const [types, participants] = await Promise.all([
    fetchTaskTypes(),
    fetchParticipants(),
  ]);

  return { types, participants };
};