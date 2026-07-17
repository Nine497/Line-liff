import dayjs from "dayjs";
import { hexToRgba, getContrastText } from "../utils/color";
import { getEventColor } from "../constants/eventColors";

// Titles sometimes carry a "#ชื่อคน"-style suffix used for internal
// bookkeeping when the task was created/imported — that suffix isn't
// meant to be shown to end users, so strip it for display only.
const stripHashSuffix = (title) => (title ?? "").split("#")[0].trim();

export const toCalendarEvent = (task) => {
  const color = getEventColor(task.type);

  return {
    id: task.id,
    title: stripHashSuffix(task.title),
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