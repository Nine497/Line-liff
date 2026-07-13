import { useLayoutEffect, useRef } from "react";
import { Card, Button } from "antd";
import { Upload, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import dayjs from "dayjs";
import { monthNames } from "../../constants/calendar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";

export default function CalendarCard({
    month,
    events,
    calendarRef,
    selectedKey,
    isUploading,
    moveMonth,
    goToday,
    handleUpload,
    setMonth,
    setSelectedKey,
    showMineOnly,
    isLoadingMine,
    onToggleMine,
    onEventClick,
    onHeightChange,
}) {
    const fileInputRef = useRef(null);
    const cardRef = useRef(null);

    useLayoutEffect(() => {
        const node = cardRef.current;
        if (!node || !onHeightChange) return;

        // Read synchronously (not just via ResizeObserver) so the height is
        // available on the very first paint instead of one frame later —
        // ResizeObserver's callback is tied to the rendering pipeline, which
        // browsers can throttle for backgrounded/inactive tabs.
        onHeightChange(node.getBoundingClientRect().height);

        const observer = new ResizeObserver(([entry]) => {
            onHeightChange(entry.contentRect.height);
        });
        observer.observe(node);

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, month]);

    return (
        <Card ref={cardRef} className="overflow-hidden shadow-sm" styles={{ body: { padding: 0 } }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="เดือนก่อนหน้า"
                        onClick={() => moveMonth(-1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="font-display text-[15px] font-semibold text-foreground">
                        {monthNames[month.month - 1]} {month.year + 543}
                    </span>
                    <button
                        type="button"
                        aria-label="เดือนถัดไป"
                        onClick={() => moveMonth(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={goToday}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 font-display text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        วันนี้
                    </button>

                    <button
                        type="button"
                        onClick={onToggleMine}
                        disabled={isLoadingMine}
                        aria-pressed={showMineOnly}
                        title="แสดงเฉพาะกำหนดการของฉัน"
                        className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 font-display text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${showMineOnly
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary"
                            }`}
                    >
                        <UserRound className="h-3.5 w-3.5" />
                        {isLoadingMine ? "กำลังโหลด..." : "ของฉัน"}
                    </button>

                    <Button
                        type="primary"
                        icon={<Upload className="h-3.5 w-3.5" strokeWidth={2.25} />}
                        loading={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        นำเข้า Excel
                    </Button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleUpload}
                        className="hidden"
                    />
                </div>
            </div>

            <div className="px-2 pb-2 pt-1">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={thLocale}
                    events={events}
                    displayEventTime={false}
                    headerToolbar={false}
                    height="auto"
                    dayCellClassNames={(arg) =>
                        dayjs(arg.date).format("YYYY-MM-DD") === selectedKey ? "selected-day" : ""
                    }
                    datesSet={(arg) => {
                        const date = arg.view.currentStart;
                        setMonth({
                            year: date.getFullYear(),
                            month: date.getMonth() + 1,
                        });
                    }}
                    dateClick={(info) => {
                        setSelectedKey(info.dateStr);
                    }}
                    eventClick={(info) => {
                        info.jsEvent.stopPropagation();
                        onEventClick?.(info.event);
                    }}
                />
            </div>
        </Card>
    );
}
