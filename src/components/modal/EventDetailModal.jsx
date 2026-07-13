import { Modal, Divider } from "antd";
import { Clock, AlignLeft, Users, Tags } from "lucide-react";
import { hexToRgba } from "../../utils/color";
import { getEventColor } from "../../constants/eventColors";
import { formatEventSchedule } from "../../utils/date";

function EventDetailModal({ event, onClose }) {
    const task = event?.extendedProps?.task;
    const participants = task?.task_participants ?? [];
    const type = task?.type;
    const typeName = type?.name;

    const hex = getEventColor(type);
    const bgColor = hexToRgba(hex, 0.06);
    const borderColor = hexToRgba(hex, 0.25);

    const schedule = formatEventSchedule(task?.start_time, task?.end_time);

    return (
        <Modal
            open={!!event}
            title={
                <span className="flex items-center gap-2 font-display text-base font-bold">
                    <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: hex }}
                    />
                    {event?.title}
                </span>
            }
            onCancel={onClose}
            footer={null}
            width={520}
            destroyOnHidden
        >
            <Divider className="!mt-3 !mb-5" />

            <div
                className="flex flex-col gap-4 rounded-xl p-4"
                style={{ background: bgColor, border: `1px solid ${borderColor}` }}
            >
                {typeName && (
                    <div className="flex items-center gap-1.5 text-xs">
                        <Tags className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/70" />
                        <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 font-medium text-secondary-foreground">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                            {typeName}
                        </span>
                    </div>
                )}

                {schedule && (
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                        {schedule.isAllDay ? (
                            <>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                    ทั้งวัน
                                </span>
                                <span className="text-muted-foreground/70">{schedule.dateLabel}</span>
                            </>
                        ) : (
                            <span className="font-medium text-muted-foreground">{schedule.label}</span>
                        )}
                    </div>
                )}

                {task?.description && (
                    <div className="flex items-start gap-1.5 text-sm">
                        <AlignLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                        <p className="whitespace-pre-line text-muted-foreground">{task.description}</p>
                    </div>
                )}

                <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/70">
                        <Users className="h-3.5 w-3.5" />
                        ผู้เข้าร่วม
                    </p>

                    {participants.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {participants.map((tp) => (
                                <span
                                    key={tp.id ?? tp.participant?.id}
                                    className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-medium text-foreground"
                                >
                                    {tp.participant?.name ?? "ไม่ทราบชื่อ"}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs italic text-muted-foreground/50">ไม่มีผู้เข้าร่วม</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

export default EventDetailModal;
