import { formatEventSchedule } from "../../utils/date";

function ParticipantCard({
    participant,
    busyMap,
}) {
    const events = busyMap.get(participant.id) || [];
    const isBusy = events.length > 0;

    return (
        <div
            className={`flex items-start justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md
      ${isBusy
                    ? "border-destructive/25"
                    : "border-success/25"
                }`}
        >
            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`h-2 w-2 shrink-0 rounded-full ${isBusy ? "bg-destructive" : "bg-success"
                            }`}
                    />
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {participant.name}
                    </p>
                </div>

                {isBusy && (
                    <ul className="mt-2 min-w-0 space-y-1.5 pl-4">
                        {events.map((e) => {
                            const schedule = formatEventSchedule(e.start_time, e.end_time);

                            return (
                                <li key={e.id} className="min-w-0 text-xs text-muted-foreground">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="h-1 w-1 shrink-0 rounded-full bg-destructive/60" />
                                        <span className="min-w-0 flex-1 truncate">{e.title}</span>
                                    </div>
                                    {schedule && (
                                        <p className="truncate pl-3 text-[11px] text-muted-foreground/70">
                                            {schedule.isAllDay
                                                ? `ทั้งวัน · ${schedule.dateLabel}`
                                                : schedule.isMultiDay
                                                    ? schedule.label
                                                    : `${schedule.dateLabel} · ${schedule.label}`}
                                        </p>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isBusy
                        ? "bg-destructive-tint text-destructive"
                        : "bg-success-tint text-success"
                    }`}
            >
                {isBusy ? "ไม่ว่าง" : "ว่าง"}
            </span>
        </div>
    );
}

export default ParticipantCard;
