"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Header from "./components/layout/Header";
import CalendarCard from "./components/calendar/CalendarCard";
import CalendarSidebar from "./components/calendar/CalendarSidebar";
import CreateTaskModal from "./components/modal/CreateTaskModal";
import { cn } from "./lib/utils";
import { SpinnerEmpty } from "./components/ui/spinnerEmpty";
import {
  Form,
  Input,
  message, notification
} from "antd";
import dayjs from "dayjs";
import "./styles/fullcalendar.css"
import { monthNames } from "./constants/calendar";
import { apiUrl } from "./lib/api";
import { todayKey, dayKey } from "./utils/date";
import { fetchTasks } from "./api/tasks";
import { toCalendarEvent } from "./utils/taskMapper";
import { useInitApp } from "./hooks/useInitApp";
import EventCard from "./components/calendar/EventCard";
import ParticipantCard from "./components/calendar/ParticipantCard";
import InitialLoading from "./components/loading/InitialLoading";
import { importTasks } from "./services/taskImportService";
import { createTask } from "./services/taskService";
import { useTaskEvents } from "./hooks/useTaskEvents";

function App() {
  const [theme, setTheme] = useState("light");
  const [month, setMonth] = useState({ year: 2026, month: 6 });
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [currentUser, setCurrentUser] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [participants, setParticipants] = useState([]);
  const calendarRef = useRef(null);
  const { TextArea } = Input;
  const [form] = Form.useForm();
  const [taskTypes, setTaskTypes] = useState([]);
  const isDark = theme === "dark";
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("events");
  const {
    events,
    fetchTaskEvents,
  } = useTaskEvents();

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

  const moveMonth = (direction) => {
    const calendarApi =
      calendarRef.current?.getApi();

    if (!calendarApi) return;

    if (direction > 0) {
      calendarApi.next();
    } else {
      calendarApi.prev();
    }

    const currentDate =
      calendarApi.getDate();

    setMonth({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1,
    });
  };

  const goToday = () => {
    const calendarApi =
      calendarRef.current?.getApi();

    if (!calendarApi) return;

    calendarApi.today();

    const today = new Date();

    setSelectedKey(
      today.toISOString().split("T")[0]
    );
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError("");
    setFormSuccess("");

    try {
      const userId = currentUser?.id ?? currentUser?.user_id;

      const result = await importTasks(file, userId);

      await fetchTaskEvents();

      message.success(`นำเข้าสำเร็จ ${result.count} รายการ`);
      setFormSuccess(`นำเข้าสำเร็จ ${result.count} รายการ`);
    } catch (err) {
      message.error(err.message);
      setFormError(err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const selectedEvents = useMemo(() => {
    return events.filter((event) => {
      const selected = dayjs(selectedKey);

      const start = dayjs(event.start);
      const end = event.end
        ? dayjs(event.end).subtract(1, "day")
        : start;

      return (
        (selected.isAfter(start, "day") ||
          selected.isSame(start, "day")) &&
        (selected.isBefore(end, "day") ||
          selected.isSame(end, "day"))
      );
    });
  }, [events, selectedKey]);

  const busyMap = useMemo(() => {
    const map = new Map();

    for (const event of selectedEvents) {
      const participants =
        event?.extendedProps?.task
          ?.task_participants ?? [];

      for (const tp of participants) {
        const participant = tp?.participant;

        if (!participant?.id) continue;

        if (!map.has(participant.id)) {
          map.set(participant.id, []);
        }

        map.get(participant.id).push({
          id: event.id,
          title: event.title,
          start_time:
            event.extendedProps.task
              .start_time,
        });
      }
    }

    return map;
  }, [selectedEvents]);

  const availableParticipants = useMemo(() => {
    return participants.filter((p) => !busyMap.has(p.id));
  }, [participants, busyMap]);

  const busyParticipants = useMemo(() => {
    return participants.filter((p) => busyMap.has(p.id));
  }, [participants, busyMap]);

  const tabItems = useMemo(
    () => [
      {
        key: "events",
        label: (
          <span className="px-3 inline-flex items-center gap-1.5">
            กำหนดการ
            {selectedEvents.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-[#1677ff] rounded-full">
                {selectedEvents.length > 99 ? "99+" : selectedEvents.length}
              </span>
            )}
          </span>
        ), children: (
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
            {selectedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        ),
      },
      {
        key: "available",
        label: (
          <span className="px-3 inline-flex items-center gap-1.5">
            ว่าง
            {availableParticipants.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-emerald-500 rounded-full">
                {availableParticipants.length > 99 ? "99+" : availableParticipants.length}
              </span>
            )}
          </span>
        ),
        children: (
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
            {availableParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                busyMap={busyMap}
              />
            ))}
          </div>
        ),
      },
      {
        key: "busy",
        label: (
          <span className="px-3 inline-flex items-center gap-1.5">
            ไม่ว่าง
            {busyParticipants.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-medium text-white bg-red-500 rounded-full">
                {busyParticipants.length > 99 ? "99+" : busyParticipants.length}
              </span>
            )}
          </span>
        ),
        children: (
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-3">
            {busyParticipants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                busyMap={busyMap}
              />
            ))}
          </div>
        ),
      },
    ],
    [availableParticipants, busyParticipants, selectedEvents]
  );

  const handleCreateTask = async (payload) => {
    try {
      setIsSubmitting(true);
      setFormError("");

      await createTask(payload);

      message.success("เพิ่มงานสำเร็จ");

      form.resetFields();
      setShowCreateForm(false);

      await fetchTaskEvents();

    } catch (error) {
      console.error(error);

      if (error.status === 409) {
        notification.warning({
          message: "ไม่สามารถสร้างงานได้",
          description: (
            <div>
              {error.data?.conflicts?.map((c, i) => (
                <div key={i}>
                  • {c.participant_name} ติดงาน "{c.task_title}"
                </div>
              ))}
            </div>
          ),
        });
        return;
      }

      message.error(error.message || "เกิดข้อผิดพลาด");
      setFormError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={cn("relative flex min-h-screen flex-col bg-background text-foreground", isDark && "dark")}>
      <InitialLoading
        open={isInitializing}
        currentUser={currentUser}
      />

      <div className="flex w-full flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <Header
          currentUser={currentUser}
          isDark={isDark}
          onToggleTheme={() =>
            setTheme(isDark ? "light" : "dark")
          }
          onCreateTask={() => setShowCreateForm(true)}
        />

        <div className="flex flex-1 flex-col gap-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="calendarjs">

            <CalendarCard
              month={month}
              events={events}
              calendarRef={calendarRef}
              selectedKey={selectedKey}
              isUploading={isUploading}
              moveMonth={moveMonth}
              goToday={goToday}
              handleUpload={handleUpload}
              setMonth={setMonth}
              setSelectedKey={setSelectedKey}
            />

            <CalendarSidebar
              selectedDate={selectedDate}
              selectedEvents={selectedEvents}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              tabItems={tabItems}
            />
          </section >
        </div >
      </div >

      < footer className="w-full border-t bg-background py-4 mt-auto" >
        <div className="mx-auto flex flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            LINE LIFF Scheduler © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-2">
            <span>Powered by React • Supabase</span>
          </div>
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
      <CreateTaskModal
        open={showCreateForm}
        form={form}
        taskTypes={taskTypes}
        participants={participants}
        isSubmitting={isSubmitting}
        handleCreateTask={handleCreateTask}
        onClose={() => {
          setShowCreateForm(false);
          form.resetFields();
        }}
      />
    </main >
  );
}

export default App;
