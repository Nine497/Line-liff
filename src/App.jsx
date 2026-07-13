"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "./components/layout/Header";
import CalendarCard from "./components/calendar/CalendarCard";
import CalendarSidebar from "./components/calendar/CalendarSidebar";
import CreateTaskModal from "./components/modal/CreateTaskModal";
import EventDetailModal from "./components/modal/EventDetailModal";
import { cn } from "./lib/utils";
import { SpinnerEmpty } from "./components/ui/spinnerEmpty";
import { ConfigProvider, App as AntdApp, Form, theme as antdTheme, message } from "antd";
import "./styles/fullcalendar.css"
import { monthNames } from "./constants/calendar";
import { todayKey } from "./utils/date";
import { useInitApp } from "./hooks/useInitApp";
import { useTaskEvents } from "./hooks/useTaskEvents";
import { useCalendarNav } from "./hooks/useCalendarNav";
import { useDaySelection } from "./hooks/useDaySelection";
import { useExcelImport } from "./hooks/useExcelImport";
import { useCreateTask } from "./hooks/useCreateTask";
import { useMyEvents } from "./hooks/useMyEvents";
import { useSidebarTabItems } from "./components/calendar/SidebarTabs";
import InitialLoading from "./components/loading/InitialLoading";

const navyLight = {
  colorPrimary: "#0B3D6B",
  colorSuccess: "#147D53",
  colorWarning: "#0B3D6B",
  colorError: "#C0392B",
  colorInfo: "#0B3D6B",
  colorLink: "#0B3D6B",
  borderRadius: 12,
  fontFamily: '"IBM Plex Sans Thai", sans-serif',
  colorBgContainer: "#FFFFFF",
  colorBgElevated: "#FFFFFF",
  colorBgLayout: "#F5F7FB",
  colorBorder: "rgba(16, 27, 45, 0.16)",
  colorBorderSecondary: "rgba(16, 27, 45, 0.09)",
  colorText: "#101B2D",
  colorTextSecondary: "#5B6B84",
  colorTextTertiary: "#8592A6",
};

const navyDark = {
  colorPrimary: "#5B9BD5",
  colorSuccess: "#4FBE95",
  colorWarning: "#5B9BD5",
  colorError: "#E1786A",
  colorInfo: "#5B9BD5",
  colorLink: "#5B9BD5",
  borderRadius: 12,
  fontFamily: '"IBM Plex Sans Thai", sans-serif',
  colorBgContainer: "#10233A",
  colorBgElevated: "#132A45",
  colorBgLayout: "#0A1826",
  colorBorder: "rgba(232, 238, 246, 0.22)",
  colorBorderSecondary: "rgba(232, 238, 246, 0.10)",
  colorText: "#E8EEF6",
  colorTextSecondary: "#93A9C2",
  colorTextTertiary: "#6D84A0",
};

function App() {
  const [theme, setTheme] = useState("light");
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: isDark ? navyDark : navyLight,
      }}
    >
      <AntdApp>
        <AppShell setTheme={setTheme} isDark={isDark} />
      </AntdApp>
    </ConfigProvider>
  );
}

function AppShell({ setTheme, isDark }) {
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [currentUser, setCurrentUser] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarHeight, setCalendarHeight] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [form] = Form.useForm();
  const [taskTypes, setTaskTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("events");

  const { events, fetchTaskEvents } = useTaskEvents();
  const { calendarRef, month, setMonth, moveMonth, goToday } = useCalendarNav();
  const { isUploading, handleUpload } = useExcelImport(fetchTaskEvents);
  const { isSubmitting, handleCreateTask } = useCreateTask(fetchTaskEvents);
  const {
    showMineOnly,
    myTaskIds,
    isLoadingMine,
    hasFetchedMine,
    toggleMineOnly,
    reloadMyEvents,
  } = useMyEvents();

  // Availability (busy/available tabs) must always reason about every task,
  // so useDaySelection stays on the full `events` list regardless of the
  // "My Events" filter — only what's *displayed* narrows down.
  const {
    selectedEvents,
    busyMap,
    availableParticipants,
    busyParticipants,
  } = useDaySelection(events, selectedKey, participants);

  const displayEvents = useMemo(() => {
    if (!showMineOnly) return events;
    return events.filter((e) => myTaskIds.has(e.id));
  }, [events, showMineOnly, myTaskIds]);

  const displaySelectedEvents = useMemo(() => {
    if (!showMineOnly) return selectedEvents;
    return selectedEvents.filter((e) => myTaskIds.has(e.id));
  }, [selectedEvents, showMineOnly, myTaskIds]);

  const tabItems = useSidebarTabItems({
    selectedEvents: displaySelectedEvents,
    availableParticipants,
    busyParticipants,
    busyMap,
    showMineOnly,
  });

  const onToggleMine = async () => {
    try {
      const { turnedOn, participant } = await toggleMineOnly(currentUser.line_id);

      if (turnedOn && !participant) {
        message.info("ไม่พบข้อมูลผู้เข้าร่วมที่ผูกกับบัญชี LINE นี้ กรุณาติดต่อผู้ดูแลระบบ");
      }
    } catch (err) {
      console.error("Load my events error:", err);
      message.error("โหลดกำหนดการของฉันไม่สำเร็จ");
    }
  };

  useEffect(() => {
    document.body.style.overflow = showCreateForm ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreateForm]);

  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedKey.split("-");
    return `${Number(day)} ${monthNames[Number(month) - 1]} ${Number(year) + 543}`;
  }, [selectedKey]);

  useInitApp({
    setCurrentUser,
    fetchTaskEvents,
    setIsInitializing,
    setParticipants,
    setTaskTypes,
  });

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    const userId = currentUser?.id ?? currentUser?.user_id;

    handleUpload(file, userId);

    e.target.value = "";
  };

  const onSubmitTask = (payload) =>
    handleCreateTask(payload, {
      onSuccess: () => {
        form.resetFields();
        setShowCreateForm(false);

        // Keep the "My Events" cache in sync in case the new task is
        // assigned to the current user.
        if (hasFetchedMine) {
          reloadMyEvents(currentUser.line_id);
        }
      },
    });

  return (
    <main className={cn("relative flex min-h-screen flex-col bg-background text-foreground", isDark && "dark")}>
      <InitialLoading
        open={isInitializing}
        currentUser={currentUser}
      />

      <div className="flex w-full flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
        <Header
          currentUser={currentUser}
          isDark={isDark}
          onToggleTheme={() =>
            setTheme(isDark ? "light" : "dark")
          }
          onCreateTask={() => setShowCreateForm(true)}
        />

        <div className="flex flex-1 flex-col gap-6">
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" id="calendarjs">

            <CalendarCard
              month={month}
              events={displayEvents}
              calendarRef={calendarRef}
              selectedKey={selectedKey}
              isUploading={isUploading}
              moveMonth={moveMonth}
              goToday={() => goToday(setSelectedKey)}
              handleUpload={onFileChange}
              setMonth={setMonth}
              setSelectedKey={setSelectedKey}
              showMineOnly={showMineOnly}
              isLoadingMine={isLoadingMine}
              onToggleMine={onToggleMine}
              onEventClick={setSelectedEvent}
              onHeightChange={setCalendarHeight}
            />

            <CalendarSidebar
              selectedDate={selectedDate}
              selectedEvents={selectedEvents}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabItems={tabItems}
              maxHeight={calendarHeight}
            />
          </section >
        </div >
      </div >

      < footer className="w-full border-t border-border bg-background py-4 mt-auto" >
        <div className="mx-auto flex flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <p className="font-display font-medium text-foreground">
            ศรชล.
          </p>
          <span>© {new Date().getFullYear() + 543}</span>
        </div>
      </footer >

      {isUploading && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />

          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-[380px] text-white">
              <SpinnerEmpty
                title="กำลังนำเข้าข้อมูลจาก Excel"
                description="ระบบกำลังนำเข้าข้อมูล กรุณารอสักครู่..."
              />
            </div>
          </div>
        </>
      )}

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <CreateTaskModal
        open={showCreateForm}
        form={form}
        taskTypes={taskTypes}
        participants={participants}
        isSubmitting={isSubmitting}
        onSubmit={onSubmitTask}
        onClose={() => {
          setShowCreateForm(false);
          form.resetFields();
        }}
      />
    </main >
  );
}

export default App;
