import { AlignLeft, Clock, Users } from "lucide-react";
import { hexToRgba } from "../../utils/color";
import { getEventColor } from "../../constants/eventColors";
import { formatEventSchedule } from "../../utils/date";

function EventCard({ event }) {
    const task = event?.extendedProps?.task;
    const participants = task?.task_participants ?? [];
    const type = task?.type;
    const typeName = type?.name;

    const hex = getEventColor(type)
    const bgColor = hexToRgba(hex, 0.06)
    const borderColor = hexToRgba(hex, 0.25)

    const schedule = formatEventSchedule(task?.start_time, task?.end_time);

    return (
        <div
            className="flex flex-col gap-3 rounded-xl p-4 transition-colors"
            style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className="mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: hex }}
                    />
                    <p className="text-sm font-medium text-foreground leading-snug">
                        {event.title}
                    </p>
                </div>

                {typeName && (
                    <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: hex }}
                        />
                        {typeName}
                    </span>
                )}
            </div>

            {schedule && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
                    {schedule.isAllDay ? (
                        <>
                            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                                ทั้งวัน
                            </span>
                            <span className="text-muted-foreground/70">{schedule.dateLabel}</span>
                        </>
                    ) : (
                        <span className="font-medium text-muted-foreground">
                            {schedule.isMultiDay ? schedule.label : `${schedule.dateLabel} · ${schedule.label}`}
                        </span>
                    )}
                </div>
            )}

            {task?.description && (
                <div className="flex items-start gap-1.5 text-xs">
                    <AlignLeft className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground/70" />
                    <p className="line-clamp-3 text-muted-foreground">{task.description}</p>
                </div>
            )}

            <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                    <Users className="h-3 w-3" />
                    ผู้เข้าร่วม
                </p>

                {participants.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {participants.map((tp, i) => (
                            <span
                                key={tp.id ?? tp.participant?.id ?? i}
                                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground"
                            >
                                {tp.participant?.name ?? "ไม่ทราบชื่อ"}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs italic text-muted-foreground/50">
                        ไม่มีผู้เข้าร่วม
                    </p>
                )}
            </div>
        </div>
    );
}

export default EventCard;
