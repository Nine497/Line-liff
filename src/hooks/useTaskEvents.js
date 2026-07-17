import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "../api/tasks";
import { toCalendarEvent } from "../utils/taskMapper";

export function useTaskEvents() {
  const { data: events = [], refetch, isLoading, isError } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetchTasks();
      const tasks = Array.isArray(res) ? res : res?.data ?? [];
      return tasks.map(toCalendarEvent);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    events,
    fetchTaskEvents: refetch, // Kept for backwards compatibility if any component calls it directly
    isLoading,
    isError,
  };
}