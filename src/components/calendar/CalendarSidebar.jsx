import { Card, Tabs } from "antd";
import "./sidebar-tabs.css";
import { monthNames } from "../../constants/calendar";

function formatSidebarDate(dateRange) {
    if (!dateRange || dateRange.length < 2) return "";
    const start = dateRange[0];
    const end = dateRange[1];
    
    const [sYear, sMonth, sDay] = start.split("-");
    const startStr = `${Number(sDay)} ${monthNames[Number(sMonth) - 1]} ${Number(sYear) + 543}`;
    
    if (start === end) return startStr;
    
    const [eYear, eMonth, eDay] = end.split("-");
    
    // If same year and month, show "1 - 5 มกราคม 2569"
    if (sYear === eYear && sMonth === eMonth) {
        return `${Number(sDay)} - ${Number(eDay)} ${monthNames[Number(sMonth) - 1]} ${Number(sYear) + 543}`;
    }
    // If same year but different month, show "1 มกราคม - 5 กุมภาพันธ์ 2569"
    if (sYear === eYear) {
        return `${Number(sDay)} ${monthNames[Number(sMonth) - 1]} - ${Number(eDay)} ${monthNames[Number(eMonth) - 1]} ${Number(sYear) + 543}`;
    }
    // Different year
    const endStr = `${Number(eDay)} ${monthNames[Number(eMonth) - 1]} ${Number(eYear) + 543}`;
    return `${startStr} - ${endStr}`;
}

function CalendarSidebar({
    selectedDateRange,
    selectedEvents,
    activeTab,
    setActiveTab,
    tabItems,
    maxHeight,
}) {
    const dateDisplay = formatSidebarDate(selectedDateRange);

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
                    <div className="flex items-baseline justify-between gap-2 py-1">
                        <h2 className="font-display text-[15px] font-bold text-foreground">
                            {dateDisplay}
                        </h2>
                        <span className="font-display text-[11px] text-muted-foreground whitespace-nowrap">
                            ช่วงวันที่เลือก
                        </span>
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
                    <div className="flex flex-1 flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-border-strong bg-muted/40 p-8 text-center">
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
