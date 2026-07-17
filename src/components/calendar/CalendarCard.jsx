import { useLayoutEffect, useRef } from "react";
import { Card, Button, Select } from "antd";
import { Upload, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import dayjs from "dayjs";
import { monthNames } from "../../constants/calendar";
import { unwrap } from "../../utils/unwrap";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";

export default function CalendarCard({
    month,
    events,
    calendarRef,
    selectedDateRange,
    isUploading,
    moveMonth,
    goToday,
    onOpenImportWizard,
    setMonth,
    setSelectedDateRange,
    showMineOnly,
    isLoadingMine,
    onToggleMine,
    participants,
    selectedParticipantId,
    onSelectParticipant,
    onEventClick,
    onHeightChange,
}) {
    const cardRef = useRef(null);
    const participantOptions = unwrap(participants).map((p) => ({ value: p.id, label: p.name }));

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
        <Card
            ref={cardRef}
            className="flex flex-col overflow-hidden shadow-sm xl:h-full"
            styles={{ body: { padding: 0, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } }}
        >
            {/* Column on phones (each group stretches full-width via the
                default flex-col stretch, so wrapped controls inside get a
                real width to resolve against) — row on sm+ where everything
                fits inline. */}
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between xl:shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="เดือนก่อนหน้า"
                        onClick={() => moveMonth(-1)}
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-muted"
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
                        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-secondary text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={goToday}
                        className="flex h-11 items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 font-display text-xs font-semibold text-secondary-foreground transition-colors hover:border-primary/40 hover:bg-muted"
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
                        className={`flex h-11 items-center gap-1.5 rounded-lg border px-3 font-display text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${showMineOnly
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:bg-muted"
                            }`}
                    >
                        <UserRound className="h-3.5 w-3.5" />
                        {isLoadingMine ? "กำลังโหลด..." : "ของฉัน"}
                    </button>

                    {/* Same idea as "ของฉัน" but for anyone — filters the
                        already-loaded events by participant instead of the
                        current LINE user, so no extra request is needed.
                        Plain click-to-pick dropdown, not showSearch — a
                        typeable combobox left its search cursor/focus state
                        visible even after picking an option, which read as
                        broken. On phones it's pushed onto its own full-width
                        row below "วันนี้ / ของฉัน / นำเข้า Excel" via `order`
                        (DOM position is unchanged, so sm+ keeps the original
                        inline order — order-last only takes effect below the
                        sm breakpoint). The width lives on this wrapper, not
                        the Select itself — antd's own CSS beats a Tailwind
                        width class applied directly to .ant-select. */}
                    <div className="order-last w-full sm:order-none sm:w-40">
                        <Select
                            allowClear
                            placeholder="ดูตามคน"
                            style={{ height: 44, width: "100%" }}
                            value={selectedParticipantId ?? undefined}
                            onChange={(value) => onSelectParticipant?.(value ?? null)}
                            options={participantOptions}
                        />
                    </div>

                    <Button
                        type="primary"
                        style={{ height: 44 }}
                        icon={<Upload className="h-3.5 w-3.5" strokeWidth={2.25} />}
                        loading={isUploading}
                        onClick={onOpenImportWizard}
                    >
                        นำเข้า Excel
                    </Button>
                </div>
            </div>

            <div className="px-2 pb-2 pt-1 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={thLocale}
                    events={events}
                    displayEventTime={false}
                    headerToolbar={false}
                    height="auto"
                    // Let FullCalendar cap how many events a day cell shows and
                    // fold the rest behind a "+N" link, based on the cell's
                    // actual rendered height — otherwise a day with many tasks
                    // (e.g. 6) squeezes them together with no gap to fit the
                    // fixed row height instead of showing them all cleanly.
                    dayMaxEvents={false}
                    dayCellClassNames={(arg) => {
                        if (!selectedDateRange || selectedDateRange.length < 2) return "";
                        const cellDate = dayjs(arg.date).startOf("day");
                        const rangeStart = dayjs(selectedDateRange[0]).startOf("day");
                        const rangeEnd = dayjs(selectedDateRange[1]).startOf("day");
                        
                        return (cellDate.isAfter(rangeStart, "day") || cellDate.isSame(rangeStart, "day")) &&
                               (cellDate.isBefore(rangeEnd, "day") || cellDate.isSame(rangeEnd, "day")) 
                               ? "selected-day" : "";
                    }}
                    datesSet={(arg) => {
                        const date = arg.view.currentStart;
                        setMonth({
                            year: date.getFullYear(),
                            month: date.getMonth() + 1,
                        });
                    }}
                    selectable={true}
                    select={(info) => {
                        // FullCalendar's select gives an exclusive end date (info.endStr is the day after).
                        // We subtract 1 day to make our selectedDateRange inclusive.
                        const endDate = dayjs(info.endStr).subtract(1, "day").format("YYYY-MM-DD");
                        setSelectedDateRange([info.startStr, endDate]);
                    }}
                    dateClick={(info) => {
                        setSelectedDateRange([info.dateStr, info.dateStr]);
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
