import { Card, Tabs } from "antd";

function CalendarSidebar({
    selectedDate,
    selectedEvents,
    activeTab,
    setActiveTab,
    tabItems,
}) {
    return (
        <aside className="grid gap-5 xl:content-start">
            <Card
                title={
                    <div>
                        <div className="text-xs text-gray-400">
                            วันที่เลือก
                        </div>
                        <div className="text-base font-semibold">
                            {selectedDate}
                        </div>
                    </div>
                }
            >
                {selectedEvents.length > 0 ? (
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                    />
                ) : (
                    <div className="rounded-lg border p-4 text-center text-gray-400">
                        ไม่มีงานในวันนี้
                    </div>
                )}
            </Card>
        </aside>
    );
}

export default CalendarSidebar;