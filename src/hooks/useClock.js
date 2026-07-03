import { useEffect, useState } from "react";
import { monthNamesShort, weekdaysFull } from "../constants/calendar";

function pad(n) {
  return String(n).padStart(2, "0");
}

function format(now) {
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())} น.`;
  const date = `${weekdaysFull[now.getDay()]} ${now.getDate()} ${monthNamesShort[now.getMonth()]} ${now.getFullYear() + 543}`;

  return { time, date };
}

export function useClock() {
  const [readout, setReadout] = useState(() => format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setReadout(format(new Date())), 15000);
    return () => clearInterval(id);
  }, []);

  return readout;
}
