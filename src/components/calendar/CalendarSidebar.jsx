import { Card, Tabs, DatePicker } from "antd";
import dayjs from "dayjs";
import "./sidebar-tabs.css";

function CalendarSidebar({
    selectedDateRange,
    setSelectedDateRange,
    selectedEvents,
    activeTab,
    setActiveTab,
    tabItems,
    maxHeight,
}) {
    return (
        <aside className="grid min-w-0 gap-5">
            <Card
                className="calendar-sidebar-card flex min-w-0 flex-col shadow-sm"
                style={maxHeight ? { "--sidebar-max-h": `${maxHeight}px` } : undefined}
                styles={{
                    body: {
                        flex: 1,
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    },
                }}
                title={
                    <div className="flex flex-col gap-2 py-2">
                        <div className="flex items-baseline justify-between">
                            <h2 className="font-display text-[15px] font-bold text-foreground">
                                ค้นหาวันว่าง
                            </h2>
                            <span className="font-display text-[11px] text-muted-foreground">
                                กำหนดช่วงวันเพื่อดูคิวงาน
                            </span>
                        </div>
                        <DatePicker.RangePicker
                            format="D MMM YYYY"
                            value={selectedDateRange ? [dayjs(selectedDateRange[0]), dayjs(selectedDateRange[1])] : null}
                            onChange={(dates) => {
                                if (dates && dates.length === 2) {
                                    setSelectedDateRange([dates[0].format("YYYY-MM-DD"), dates[1].format("YYYY-MM-DD")]);
                                }
                            }}
                            style={{ width: "100%" }}
                            allowClear={false}
                        />
                    </div>
                }
            >
                {selectedEvents.length > 0 ? (
                    <Tabs
                        className="sidebar-tabs"
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        tabBarGutter={8}
                    />
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-muted/40 p-8 text-center">
                        <p className="text-sm font-medium text-foreground">
                            ยังไม่มีกำหนดการในวันนี้
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            แตะ "เพิ่มงาน" เพื่อบันทึกกำหนดการแรกของวันนี้
                        </p>
                    </div>
                )}
            </Card>
        </aside>
    );
}

export default CalendarSidebar;
