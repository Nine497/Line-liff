import dayjs from "dayjs";
import { hexToRgba, getContrastText } from "../utils/color";
import { getEventColor } from "../constants/eventColors";

export const toCalendarEvent = (task) => {
  const color = getEventColor(task.type);

  return {
    id: task.id,
    title: task.title,
    start: dayjs(task.start_time).format("YYYY-MM-DD"),
    end: dayjs(task.end_time).add(1, "day").format("YYYY-MM-DD"),
    allDay: true,
    backgroundColor: hexToRgba(color, 0.9),
    borderColor: "transparent",
    textColor: getContrastText(color),
    extendedProps: {
      task,
      participants: task.task_participants,
    },
  };
};