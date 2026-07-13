import dayjs from "dayjs";
import { monthNamesShort } from "../constants/calendar";

export const todayKey = dayjs().format("YYYY-MM-DD");

export function dayKey(day) {
  return `${day.year}-${day.month}-${day.date}`;
}

const isMidnight = (d) => d.hour() === 0 && d.minute() === 0 && d.second() === 0;

const shortDate = (d) => `${d.date()} ${monthNamesShort[d.month()]}`;

// Single source of truth for how any event's start/end is shown across the
// app: a true midnight-to-midnight span reads as "ทั้งวัน" (All Day) with no
// fabricated 00:00 time, everything else shows its real time range. Also
// surfaces the date whenever the span crosses into another day, since a
// single selected-day view can't otherwise convey that.
export function formatEventSchedule(startTime, endTime) {
  if (!startTime || !endTime) return null;

  const start = dayjs(startTime);
  const end = dayjs(endTime);
  const isAllDay = isMidnight(start) && isMidnight(end);
  const isMultiDay = !start.isSame(end, "day");

  if (isAllDay) {
    return {
      isAllDay: true,
      label: "ทั้งวัน",
      dateLabel: isMultiDay
        ? `${shortDate(start)} – ${shortDate(end)}`
        : shortDate(start),
    };
  }

  return {
    isAllDay: false,
    label: isMultiDay
      ? `${shortDate(start)} ${start.format("HH:mm")} – ${shortDate(end)} ${end.format("HH:mm")} น.`
      : `${start.format("HH:mm")} – ${end.format("HH:mm")} น.`,
    dateLabel: isMultiDay ? `${shortDate(start)} – ${shortDate(end)}` : shortDate(start),
  };
}