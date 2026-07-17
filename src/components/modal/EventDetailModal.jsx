import { Modal, Divider } from "antd";
import { AlignLeft, Users, Tags, CalendarDays } from "lucide-react";
import { hexToRgba } from "../../utils/color";
import { getEventColor } from "../../constants/eventColors";
import { formatEventSchedule } from "../../utils/date";
import "./task-sheet.css";

// Deterministic avatar tint per participant so the same person always reads
// the same color across the app — pure cosmetic scan-aid, not semantic.
const AVATAR_PALETTE = ["#0B3D6B", "#0F766E", "#6D28D9", "#BE185D", "#92400E", "#475569"];
function avatarColor(key) {
    let hash = 0;
    const str = String(key ?? "");
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

// One endpoint ("เริ่ม"/"ถึง") of a multi-day span — kept as its own row so a
// long date+time pair never has to compete for space on the same line as
// its counterpart the way the old single concatenated string did.
function ScheduleEndpoint({ label, point, hex, showTime }) {
    return (
        <div className="flex items-center gap-3">
            <span
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: hexToRgba(hex, 0.16), color: hex }}
            >
                {label}
            </span>
            <div className="min-w-0">
                <p className="text-base font-bold leading-tight text-foreground tabular-nums">
                    {showTime ? `${point.time} น.` : point.date}
                </p>
                {showTime && <p className="text-sm text-muted-foreground">{point.date}</p>}
            </div>
        </div>
    );
}

function EventDetailModal({ event, onClose }) {
    const task = event?.extendedProps?.task;
    const participants = task?.task_participants ?? [];
    const type = task?.type;
    const typeName = type?.name;

    const hex = getEventColor(type);
    const schedule = formatEventSchedule(task?.start_time, task?.end_time);

    return (
        <Modal
            open={!!event}
            title={
                // pr-8 keeps long titles clear of antd's absolutely-positioned
                // close button; line-clamp-2 stops runaway titles from pushing
                // the header (and thus the close button) even taller.
                <span className="flex items-start gap-2 pr-8 font-display text-base font-bold leading-snug">
                    <span
                        className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: hex }}
                    />
                    <span className="break-words">{event?.title}</span>
                </span>
            }
            onCancel={onClose}
            footer={null}
            width={520}
            rootClassName="task-sheet"
            destroyOnHidden
        >
            <Divider className="!mt-3 !mb-5" />

            <div className="flex flex-col gap-5">
                {/* Date & time — the first thing anyone checking an event needs.
                    A multi-day span gets its own "เริ่ม/ถึง" row each so the two
                    dates+times never have to squeeze onto one line together. */}
                {schedule && (
                    <div
                        className="rounded-xl p-4"
                        style={{ background: hexToRgba(hex, 0.08), border: `1px solid ${hexToRgba(hex, 0.25)}` }}
                    >
                        {schedule.isMultiDay ? (
                            <div className="flex flex-col gap-3">
                                <ScheduleEndpoint
                                    label="เริ่ม"
                                    point={schedule.start}
                                    hex={hex}
                                    showTime={!schedule.isAllDay}
                                />
                                <div className="ml-4 h-3 w-px bg-border-strong" />
                                <ScheduleEndpoint
                                    label="ถึง"
                                    point={schedule.end}
                                    hex={hex}
                                    showTime={!schedule.isAllDay}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span
                                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                                    style={{ background: hexToRgba(hex, 0.16) }}
                                >
                                    <CalendarDays className="h-5 w-5" style={{ color: hex }} />
                                </span>
                                <div className="min-w-0">
                                    {schedule.isAllDay ? (
                                        <>
                                            <p className="text-base font-bold leading-tight text-foreground">ทั้งวัน</p>
                                            <p className="text-sm text-muted-foreground">{schedule.dateLabel}</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-lg font-bold leading-tight tabular-nums text-foreground">{schedule.label}</p>
                                            {schedule.dateLabel && (
                                                <p className="text-sm text-muted-foreground">{schedule.dateLabel}</p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Participants — the other primary thing this modal exists for. */}
                <div className="space-y-2.5">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        ผู้เข้าร่วม
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                            {participants.length}
                        </span>
                    </p>

                    {participants.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {participants.map((tp) => {
                                const name = tp.participant?.name ?? "ไม่ทราบชื่อ";
                                const key = tp.id ?? tp.participant?.id;
                                const color = avatarColor(tp.participant?.id ?? name);

                                return (
                                    <span
                                        key={key}
                                        className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm font-medium text-foreground shadow-sm"
                                    >
                                        <span
                                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                                            style={{ background: color }}
                                        >
                                            {name.charAt(0)}
                                        </span>
                                        {name}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm italic text-muted-foreground/60">ไม่มีผู้เข้าร่วม</p>
                    )}
                </div>

                {/* Secondary metadata — present, but visually quiet. */}
                {(typeName || task?.description) && (
                    <div className="space-y-2 border-t border-border pt-4">
                        {typeName && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Tags className="h-4 w-4 flex-shrink-0" />
                                <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: hex }} />
                                    {typeName}
                                </span>
                            </div>
                        )}

                        {task?.description && (
                            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <AlignLeft className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                <p className="whitespace-pre-line">{task.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default EventDetailModal;
