import { useCallback, useState } from "react";
import { fetchTasks } from "../api/tasks";
import { toCalendarEvent } from "../utils/taskMapper";

export function useTaskEvents() {
  const [events, setEvents] = useState([]);

  const fetchTaskEvents = useCallback(async () => {
    // TEMP-DEV-STUB: mock data for local UI testing only.
    const today = new Date().toISOString().slice(0, 10);
    const mockTasks = [
      {
        id: "1",
        title: "ประชุมคณะกรรมการบริหารศูนย์ยุทธการ ศรชล. ประจำเดือนและติดตามความคืบหน้าโครงการ",
        start_time: `${today}T09:00:00`,
        end_time: `${today}T11:00:00`,
        type: { id: 1, name: "ประชุม" },
        description: "รายละเอียดทดสอบ modal",
        task_participants: [
          { id: 1, participant: { id: 1, name: "สมชาย ใจดี" } },
          { id: 2, participant: { id: 2, name: "สมหญิง รักงาน" } },
          { id: 3, participant: { id: 3, name: "วิชัย มั่นคง" } },
        ],
      },
    ];
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