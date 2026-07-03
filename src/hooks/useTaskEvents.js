import { useCallback, useState } from "react";
import { fetchTasks } from "../api/tasks";
import { toCalendarEvent } from "../utils/taskMapper";

export function useTaskEvents() {
  const [events, setEvents] = useState([]);

  const fetchTaskEvents = useCallback(async () => {
    try {
      const res = await fetchTasks();

      const tasks = Array.isArray(res)
        ? res
        : res?.data ?? [];

      const calendarEvents = tasks.map(toCalendarEvent);

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Fetch tasks error:", error);
    }
  }, []);

  return {
    events,
    setEvents,
    fetchTaskEvents,
  };
}