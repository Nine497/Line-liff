"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "./components/layout/Header";
import CalendarCard from "./components/calendar/CalendarCard";
import CalendarSidebar from "./components/calendar/CalendarSidebar";
import React, { Suspense } from "react";
const CreateTaskModal = React.lazy(() => import("./components/modal/CreateTaskModal"));
const EventDetailModal = React.lazy(() => import("./components/modal/EventDetailModal"));
const ImportWizardModal = React.lazy(() => import("./components/calendar/ImportWizardModal"));
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
import { navyLight, navyDark } from "./theme/colors";

const THEME_STORAGE_KEY = "line-liff-theme";

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_STORAGE_KEY) || "light"
  );
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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
  const [selectedDateRange, setSelectedDateRange] = useState([todayKey, todayKey]);
  const [currentUser, setCurrentUser] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasOpenedCreate, setHasOpenedCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [hasOpenedDetail, setHasOpenedDetail] = useState(false);
  const [calendarHeight, setCalendarHeight] = useState(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [form] = Form.useForm();
  const [taskTypes, setTaskTypes] = useState([]);
  const [activeTab, setActiveTab] = useState("events");

  const { events, fetchTaskEvents } = useTaskEvents();
  const { calendarRef, month, setMonth, moveMonth, goToday } = useCalendarNav();
  const { isUploading, handleOpenWizard, mappingModalProps } = useExcelImport(fetchTaskEvents);
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
  } = useDaySelection(events, selectedDateRange, participants);

  // "ดูตามคน" reuses the task_participants already embedded on every loaded
  // event, so picking any participant filters instantly with no extra API
  // call — unlike "ของฉัน", which resolves the current LINE user server-side.
  const participantTaskIds = useMemo(() => {
    if (!selectedParticipantId) return null;

    const ids = new Set();
    events.forEach((e) => {
      const tps = e.extendedProps?.task?.task_participants ?? [];
      if (tps.some((tp) => tp.participant?.id === selectedParticipantId)) {
        ids.add(e.id);
      }
    });
    return ids;
  }, [events, selectedParticipantId]);

  const displayEvents = useMemo(() => {
    let list = events;
    if (showMineOnly) list = list.filter((e) => myTaskIds.has(e.id));
    if (participantTaskIds) list = list.filter((e) => participantTaskIds.has(e.id));
    return list;
  }, [events, showMineOnly, myTaskIds, participantTaskIds]);

  const displaySelectedEvents = useMemo(() => {
    let list = selectedEvents;
    if (showMineOnly) list = list.filter((e) => myTaskIds.has(e.id));
    if (participantTaskIds) list = list.filter((e) => participantTaskIds.has(e.id));
    return list;
  }, [selectedEvents, showMineOnly, myTaskIds, participantTaskIds]);

  const tabItems = useSidebarTabItems({
    selectedEvents: displaySelectedEvents,
    availableParticipants,
    busyParticipants,
    busyMap,
    isFiltered: showMineOnly || !!selectedParticipantId,
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

  // Note: selectedDate logic removed because we now pass selectedDateRange directly

  const { initError, retryInit } = useInitApp({
    setCurrentUser,
    fetchTaskEvents,
    setIsInitializing,
    setParticipants,
    setTaskTypes,
  });

  const onOpenWizardClick = () => {
    const userId = currentUser?.id ?? currentUser?.user_id;
    handleOpenWizard(userId);
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
    <main className={cn("relative flex min-h-screen flex-col bg-background text-foreground xl:h-screen xl:overflow-hidden", isDark && "dark")}>
      <InitialLoading
        open={isInitializing}
        currentUser={currentUser}
      />

      {!isInitializing && initError && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/95 p-6 text-center">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-7 shadow-xl">
            <p className="text-base font-semibold text-foreground">{initError}</p>
            <button
              type="button"
              onClick={retryInit}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              ลองใหม่
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8 xl:min-h-0 xl:overflow-hidden">
        <Header
          currentUser={currentUser}
          isDark={isDark}
          onToggleTheme={() =>
            setTheme(isDark ? "light" : "dark")
          }
          onCreateTask={() => {
            setHasOpenedCreate(true);
            setShowCreateForm(true);
          }}
        />

        <div className="flex flex-1 flex-col gap-6 xl:min-h-0">
          <section className="grid gap-6 xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_360px]" id="calendarjs">

            <CalendarCard
              month={month}
              events={displayEvents}
              calendarRef={calendarRef}
              selectedDateRange={selectedDateRange}
              isUploading={isUploading}
              moveMonth={moveMonth}
              goToday={() => {
                goToday();
                setSelectedDateRange([todayKey, todayKey]);
              }}
              onOpenImportWizard={onOpenWizardClick}
              isUploading={isUploading}
              setMonth={setMonth}
              setSelectedDateRange={setSelectedDateRange}
              showMineOnly={showMineOnly}
              isLoadingMine={isLoadingMine}
              onToggleMine={onToggleMine}
              participants={participants}
              selectedParticipantId={selectedParticipantId}
              onSelectParticipant={setSelectedParticipantId}
              onEventClick={(evt) => {
                setHasOpenedDetail(true);
                setSelectedEvent(evt);
              }}
              onHeightChange={setCalendarHeight}
            />

            <CalendarSidebar
              selectedDateRange={selectedDateRange}
              setSelectedDateRange={setSelectedDateRange}
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
        <div className="mx-auto text-center text-xs text-muted-foreground">
          <span className="font-display font-semibold text-foreground">ศูนย์ยุทธการ ศรชล.</span>
          {" · ระบบเวรและกำหนดการ · © "}
          {new Date().getFullYear() + 543}
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

      <Suspense fallback={null}>
        {hasOpenedDetail && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}

        {hasOpenedCreate && (
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
        )}

        {mappingModalProps && mappingModalProps.isOpen && (
          <ImportWizardModal {...mappingModalProps} />
        )}
      </Suspense>
    </main >
  );
}

export default App;
