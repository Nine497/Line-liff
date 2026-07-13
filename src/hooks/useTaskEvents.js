import { useCallback, useState } from "react";
import { fetchTasks } from "../api/tasks";
import { toCalendarEvent } from "../utils/taskMapper";

export function useTaskEvents() {
  const [events, setEvents] = useState([]);

  const fetchTaskEvents = useCallback(async () => {
    // TEMP-DEV-STUB: mock data for local layout testing only.
    const today = new Date().toISOString().slice(0, 10);
    const names = ["ประชุมทีม A", "ตรวจเวร", "อบรมความปลอดภัย", "ประชุมผู้บริหาร", "ตรวจสอบอุปกรณ์"];
    const mockTasks = names.map((title, i) => ({
      id: String(i + 1),
      title,
      start_time: `${today}T0${i + 1}:00:00`,
      end_time: `${today}T1${i + 1}:00:00`,
      type: { id: 1, name: "ประชุม" },
      description: "รายละเอียดทดสอบ",
      task_participants: [{ id: i + 1, participant: { id: (i % 4) + 1, name: "ผู้เข้าร่วม" } }],
    }));
    setEvents(mockTasks.map(toCalendarEvent));
    return;
    // eslint-disable-next-line no-unreachable
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