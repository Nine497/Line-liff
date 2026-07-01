import dayjs from "dayjs";

export const todayKey = dayjs().format("YYYY-MM-DD");

export function dayKey(day) {
  return `${day.year}-${day.month}-${day.date}`;
}