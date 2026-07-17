import { useMemo } from "react";
import dayjs from "dayjs";
import { unwrap } from "../utils/unwrap";

export function useDaySelection(events, selectedDateRange, participants) {
  const selectedEvents = useMemo(() => {
    return events
      .filter((event) => {
        if (!selectedDateRange || selectedDateRange.length < 2) return false;
        
        const rangeStart = dayjs(selectedDateRange[0]);
        const rangeEnd = dayjs(selectedDateRange[1]);

        const start = dayjs(event.start);
        const end = event.end
          ? dayjs(event.end).subtract(1, "day")
          : start;

        // Check if event overlaps with the selected date range
        // Event starts before or on the range end AND event ends after or on the range start
        return (
          (start.isBefore(rangeEnd, "day") || start.isSame(rangeEnd, "day")) &&
          (end.isAfter(rangeStart, "day") || end.isSame(rangeStart, "day"))
        );
      })
      // Supabase has no guaranteed return order, so without this the list
      // reads in arbitrary (insertion) order instead of by time of day.
      .sort((a, b) => {
        const aStart = a?.extendedProps?.task?.start_time;
        const bStart = b?.extendedProps?.task?.start_time;
        // dayjs(undefined) resolves to "now", so an event missing
        // start_time used to sort by render time instead of a fixed
        // position, making it jump around across re-renders/refetches.
        const aTime = aStart ? dayjs(aStart).valueOf() : Infinity;
        const bTime = bStart ? dayjs(bStart).valueOf() : Infinity;
        return aTime - bTime;
      });
  }, [events, selectedDateRange]);

  const busyMap = useMemo(() => {
    const map = new Map();

    for (const event of selectedEvents) {
      const participants =
        event?.extendedProps?.task?.task_participants ?? [];

      for (const tp of participants) {
        const participant = tp?.participant;

        if (!participant?.id) continue;

        if (!map.has(participant.id)) {
          map.set(participant.id, []);
        }

        map.get(participant.id).push({
          id: event.id,
          title: event.title,
          start_time: event.extendedProps.task.start_time,
          end_time: event.extendedProps.task.end_time,
        });
      }
    }

    return map;
  }, [selectedEvents]);

  const availableParticipants = useMemo(() => {
    return unwrap(participants).filter((p) => !busyMap.has(p.id));
  }, [participants, busyMap]);

  const busyParticipants = useMemo(() => {
    return unwrap(participants).filter((p) => busyMap.has(p.id));
  }, [participants, busyMap]);

  return {
    selectedEvents,
    busyMap,
    availableParticipants,
    busyParticipants,
  };
}
