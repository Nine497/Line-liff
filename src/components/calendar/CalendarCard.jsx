import { Card, Button } from "antd";
import { monthNames } from "../../constants/calendar";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";
import dayjs from "dayjs";

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
}) {
    return (
        <Card title="ปฏิทิน" className="overflow-hidden">
            <div className="flex flex-col gap-4">
                {/* header */}
                {/* header */}
                <div className="flex items-center justify-between">
                    <div className="text-base font-semibold text-gray-800">
                        {monthNames[month.month - 1]} {month.year + 543}
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => moveMonth(-1)}>
                            ◀
                        </Button>

                        <Button onClick={goToday}>
                            วันนี้
                        </Button>

                        <Button onClick={() => moveMonth(1)}>
                            ▶
                        </Button>
                    </div>
                </div>

                {/* calendar */}
                <div className="overflow-hidden rounded-lg border">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={thLocale}
                        events={events}
                        displayEventTime={false}
                        headerToolbar={false}
                        height="auto"
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
                    />
                </div>
            </div>
        </Card>
    );
}