import { Card, Tabs } from "antd";

function CalendarSidebar({
    selectedDate,
    selectedEvents,
    activeTab,
    setActiveTab,
    tabItems,
}) {
    return (
        <aside className="grid min-w-0 gap-5 xl:content-start">
            <Card
                className="min-w-0 shadow-sm"
                title={
                    <div className="flex items-baseline justify-between gap-2 py-1">
                        <h2 className="font-display text-base font-bold text-foreground">
                            {selectedDate}
                        </h2>
                        <span className="font-display text-[11px] text-muted-foreground">
                            รายการวันที่เลือก
                        </span>
                    </div>
                }
            >
                {selectedEvents.length > 0 ? (
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        tabBarGutter={8}
                    />
                ) : (
                    <div className="rounded-xl border border-dashed border-border-strong bg-muted/40 p-8 text-center">
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
