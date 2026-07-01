import dayjs from "dayjs";
import { hexToRgba } from "../utils/color";

export const toCalendarEvent = (task) => {
  const color = task.type?.color ?? "#6c5ce7";

  return {
    id: task.id,
    title: task.title,
    start: dayjs(task.start_time).format("YYYY-MM-DD"),
    end: dayjs(task.end_time).add(1, "day").format("YYYY-MM-DD"),
    allDay: true,
    backgroundColor: hexToRgba(color, 0.15),
    borderColor: "transparent",
    textColor: color,
    extendedProps: {
      task,
      participants: task.task_participants,
    },
  };
};