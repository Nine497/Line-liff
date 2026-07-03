import { useMemo } from "react";
import dayjs from "dayjs";
import { unwrap } from "../utils/unwrap";

export function useDaySelection(events, selectedKey, participants) {
  const selectedEvents = useMemo(() => {
    return events
      .filter((event) => {
        const selected = dayjs(selectedKey);

        const start = dayjs(event.start);
        const end = event.end
          ? dayjs(event.end).subtract(1, "day")
          : start;

        return (
          (selected.isAfter(start, "day") ||
            selected.isSame(start, "day")) &&
          (selected.isBefore(end, "day") ||
            selected.isSame(end, "day"))
        );
      })
      // Supabase has no guaranteed return order, so without this the list
      // reads in arbitrary (insertion) order instead of by time of day.
      .sort((a, b) => {
        const aStart = a?.extendedProps?.task?.start_time;
        const bStart = b?.extendedProps?.task?.start_time;
        return dayjs(aStart).valueOf() - dayjs(bStart).valueOf();
      });
  }, [events, selectedKey]);

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
