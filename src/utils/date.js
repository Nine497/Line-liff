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

  // Structured start/end points let a caller (e.g. the detail modal) lay
  // out a multi-day span as two clearly separated rows instead of one long
  // concatenated string — `label`/`dateLabel` stay as the flat summary used
  // by compact contexts like the event card.
  const startPoint = { date: shortDate(start), time: start.format("HH:mm") };
  const endPoint = { date: shortDate(end), time: end.format("HH:mm") };

  if (isAllDay) {
    return {
      isAllDay: true,
      isMultiDay,
      label: "ทั้งวัน",
      dateLabel: isMultiDay
        ? `${shortDate(start)} – ${shortDate(end)}`
        : shortDate(start),
      start: startPoint,
      end: endPoint,
    };
  }

  return {
    isAllDay: false,
    isMultiDay,
    label: isMultiDay
      ? `${shortDate(start)} ${start.format("HH:mm")} – ${shortDate(end)} ${end.format("HH:mm")} น.`
      : `${start.format("HH:mm")} – ${end.format("HH:mm")} น.`,
    // label already embeds both dates when it spans days ("2 ส.ค. 07:00 –
    // 8 ส.ค. 07:00 น."), so a separate dateLabel there would just repeat it.
    dateLabel: isMultiDay ? null : shortDate(start),
    start: startPoint,
    end: endPoint,
  };
}