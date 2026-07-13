import { useCallback, useState } from "react";
import { fetchTasks } from "../api/tasks";
import { toCalendarEvent } from "../utils/taskMapper";

export function useTaskEvents() {
  const [events, setEvents] = useState([]);

  const fetchTaskEvents = useCallback(async () => {
    // TEMP-DEV-STUB: mock data for local modal testing only.
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const mockTasks = [
      {
        id: "1",
        title: "ทดสอบ Modal เหตุการณ์ที่มีชื่อยาวมากเพื่อทดสอบการตัดบรรทัด",
        start_time: `${y}-${m}-05T09:00:00`,
        end_time: `${y}-${m}-05T11:00:00`,
        type: { id: 1, name: "ประชุม" },
        description: "รายละเอียดทดสอบ modal เมื่อคลิก event ในปฏิทิน\nบรรทัดที่สองของรายละเอียด เพื่อทดสอบการแสดงผลข้อความยาว ๆ ในกล่อง modal ว่าพอดีกับหน้าจอหรือไม่ เมื่อเทียบกับหน้าจอมือถือขนาดเล็ก",
        task_participants: [
          { id: 1, participant: { id: 1, name: "สมชาย ใจดี" } },
          { id: 2, participant: { id: 2, name: "สมหญิง รักงาน" } },
          { id: 3, participant: { id: 3, name: "วิชัย มั่นคง" } },
          { id: 4, participant: { id: 4, name: "ประภา ศรีสุข" } },
          { id: 5, participant: { id: 5, name: "อนันต์ ทองดี" } },
          { id: 6, participant: { id: 6, name: "สุดา แสงจันทร์" } },
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