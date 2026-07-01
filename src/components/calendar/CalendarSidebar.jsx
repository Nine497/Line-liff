import {
    Card,
    CardHeader,
    CardContent,
    CardTitle,
    CardDescription,
    Tabs,
} from "antd"; // หรือ import ตามที่คุณใช้

function CalendarSidebar({
    selectedDate,
    selectedEvents,
    activeTab,
    setActiveTab,
    tabItems,
}) {
    return (
        <aside className="grid gap-5 xl:content-start">
            <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardDescription>วันที่เลือก</CardDescription>
                        <CardTitle>{selectedDate}</CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                    {selectedEvents.length > 0 ? (
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={tabItems}
                        />
                    ) : (
                        <div className="rounded-lg border p-4 text-center text-muted-foreground">
                            ไม่มีงานในวันนี้
                        </div>
                    )}
                </CardContent>
            </Card>
        </aside>
    );
}

export default CalendarSidebar;