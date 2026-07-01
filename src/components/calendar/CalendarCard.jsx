<Card className="overflow-hidden">
    <CardHeader className="flex flex-col gap-4 border-b bg-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                <CalendarDays />
            </span>

            <div className="flex flex-col gap-1">
                <CardDescription>ปฏิทิน</CardDescription>

                <CardTitle>
                    {monthNames[month.month - 1]} {month.year + 543}
                </CardTitle>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleUpload}
                className="hidden"
            />

            <Button
                variant="outline"
                icon={<DownloadOutlined />}
                onClick={() =>
                    document
                        .getElementById("excel-upload")
                        .click()
                }
                loading={isUploading}
            >
                {isUploading ? "กำลังนำเข้าข้อมูล..." : "นำเข้า Excel"}
            </Button>

            <Button
                aria-label="เดือนก่อนหน้า"
                onClick={() => moveMonth(-1)}
                size="icon"
                variant="outline"
            >
                <ChevronLeft />
            </Button>

            <Button
                onClick={goToday}
                variant="outline"
            >
                วันนี้
            </Button>

            <Button
                aria-label="เดือนถัดไป"
                onClick={() => moveMonth(1)}
                size="icon"
                variant="outline"
            >
                <ChevronRight />
            </Button>
        </div>
    </CardHeader>

    <CardContent className="flex flex-col gap-5 p-4 pt-4 sm:p-5">
        <div className="overflow-hidden rounded-lg border">
            <FullCalendar
                ref={calendarRef}
                plugins={[
                    dayGridPlugin,
                    interactionPlugin,
                ]}
                initialView="dayGridMonth"
                locale={thLocale}
                events={events}
                displayEventTime={false}
                moreLinkClick="popover"
                expandRows={true}
                height="auto"
                headerToolbar={false}
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
                dayCellClassNames={(arg) => {
                    const key =
                        dayjs(arg.date).format(
                            "YYYY-MM-DD"
                        );

                    return key === selectedKey
                        ? ["selected-day"]
                        : [];
                }}
            />
        </div>
    </CardContent>
</Card>