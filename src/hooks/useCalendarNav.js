import { useRef, useState } from "react";

export function useCalendarNav() {
  const calendarRef = useRef(null);

  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const moveMonth = (direction) => {
    const calendarApi = calendarRef.current?.getApi();

    if (!calendarApi) return;

    if (direction > 0) {
      calendarApi.next();
    } else {
      calendarApi.prev();
    }

    const currentDate = calendarApi.getDate();

    setMonth({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    });
  };

  const goToday = (onToday) => {
    const calendarApi = calendarRef.current?.getApi();

    if (!calendarApi) return;

    calendarApi.today();

    const today = new Date();

    onToday?.(today.toISOString().split("T")[0]);
  };

  return {
    calendarRef,
    month,
    setMonth,
    moveMonth,
    goToday,
  };
}
