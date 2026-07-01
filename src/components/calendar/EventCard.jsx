import { Users } from "lucide-react";

function EventCard({ event }) {
    const participants =
        event?.extendedProps?.task?.task_participants ?? [];
    const color = event?.extendedProps?.task?.type?.color;
    const typeName = event?.extendedProps?.task?.type?.name;

    const hex = color ?? '#2563eb'
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const bgColor = `rgba(${r},${g},${b},0.06)`
    const borderColor = `rgba(${r},${g},${b},0.25)`

    return (
        <div
            key={event.id}
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
                    <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0"
                        style={{
                            background: `rgba(${r},${g},${b},0.12)`,
                            color: hex,
                        }}
                    >
                        {typeName}
                    </span>
                )}
            </div>

            <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                    <Users className="h-3 w-3" />
                    ผู้เข้าร่วม
                </p>

                {participants.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {participants.map((tp) => (
                            <span
                                key={tp.id ?? tp.participant?.id}
                                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                    background: `rgba(${r},${g},${b},0.08)`,
                                    color: hex,
                                    border: `1px solid rgba(${r},${g},${b},0.2)`,
                                }}
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