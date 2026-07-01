"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Header from "./components/layout/Header";
import CalendarCard from "./components/calendar/CalendarCard";
import CalendarSidebar from "./components/calendar/CalendarSidebar";
import CreateTaskModal from "./components/modal/CreateTaskModal";
import { initLiff } from "./liff";
import { Users } from "lucide-react"
import { cn } from "./lib/utils";
import { SpinnerEmpty } from "./components/ui/spinnerEmpty";
import { BarLoader } from "react-spinners";
import {
  Form,
  Input,
  Badge,
  message, notification
} from "antd";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";
import "./styles/fullcalendar.css"
import { weekdays, monthNames } from "./constants/calendar";
import { apiUrl } from "./lib/api";
import { todayKey, dayKey } from "./utils/date";
import { hexToRgba } from "./utils/color";
import { fetchTasks, fetchParticipants, fetchTaskTypes } from "./api/tasks";
import { toCalendarEvent } from "./utils/taskMapper";
import { useInitApp } from "./hooks/useInitApp";
import EventCard from "./components/calendar/EventCard";
import ParticipantCard from "./components/calendar/ParticipantCard";

function App() {
  const [theme, setTheme] = useState("light");
  const [month, setMonth] = useState({ year: 2026, month: 6 });
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [events, setEvents] = useState([]);
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
  const [loading, setLoading] = useState(false);

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


  async function fetchTaskEvents() {
    try {
      const tasks = await fetchTasks();
      const calendarEvents = tasks.map(toCalendarEvent);

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Fetch tasks error:", error);
    }
  }

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

    const formData = new FormData();

    try {
      const userId = currentUser?.id ?? currentUser?.user_id;

      if (userId) {
        formData.append("user_id", userId);
      }

      formData.append("file", file);

      const response = await fetch(`${apiUrl}/tasks/import`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      // ❌ ต้องเช็คก่อน ไม่งั้น throw แล้ว code ด้านล่างไม่ทำงาน
      if (!response.ok) {
        message.error(`เกิดข้อผิดพลาด ${result?.error || "ไม่สามารถนำเข้าข้อมูลได้"}`);

        throw new Error(result?.error || "Import failed");
      }

      // ✅ refresh data only
      await fetchTaskEvents();

      // ✅ success notification
      message.success(`นำเข้าข้อมูลสำเร็จ ${result?.count ?? 0} รายการ`,);

      setFormSuccess(`นำเข้าสำเร็จ ${result?.count ?? 0} รายการ`);
    } catch (error) {
      console.error(error);
      message.error(`เกิดข้อผิดพลาด ${error?.message || "ไม่สามารถนำเข้าข้อมูลได้"}`);

      setFormError(error.message);
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

  // const renderParticipant = (participant) => {
  //   const events = busyMap.get(participant.id) || [];
  //   const isBusy = events.length > 0;

  //   return (
  //     <div
  //       key={participant.id}
  //       className={`flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-sm
  //     ${isBusy
  //           ? "border-l-4 border-l-red-500"
  //           : "border-l-4 border-l-emerald-500"
  //         }`}
  //     >
  //       <div className="min-w-0 flex-1">
  //         <div className="flex items-center gap-2">
  //           <p className="truncate text-sm font-semibold">
  //             {participant.name}
  //           </p>

  //           <span
  //             className={`h-2.5 w-2.5 rounded-full ${isBusy ? "bg-red-500" : "bg-emerald-500"
  //               }`}
  //           />
  //         </div>

  //         {isBusy && (
  //           <ul className="mt-2 space-y-1">
  //             {events.map((e) => (
  //               <li
  //                 key={e.id}
  //                 className="flex items-center gap-2 text-xs text-gray-500"
  //               >
  //                 <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
  //                 {e.title}
  //               </li>
  //             ))}
  //           </ul>
  //         )}
  //       </div>

  //       <span
  //         className={`rounded-full px-3 py-1 text-xs font-medium
  //       ${isBusy
  //             ? "bg-red-100 text-red-600"
  //             : "bg-emerald-100 text-emerald-600"
  //           }`}
  //       >
  //         {isBusy ? "ไม่ว่าง" : "ว่าง"}
  //       </span>
  //     </div>
  //   );
  // };

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

      const response = await fetch(
        `${apiUrl}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      // =========================
      // มีคนติดงาน
      // =========================
      if (response.status === 409) {
        notification.warning({
          message: "ไม่สามารถสร้างงานได้",
          placement: "topRight",
          duration: 6,
          description: (
            <div className="space-y-1">
              {result?.conflicts?.map((c, index) => {
                const taskTitle =
                  c.task_title?.length > 20
                    ? `${c.task_title.slice(0, 20)}...`
                    : c.task_title;

                return (
                  <div key={index}>
                    • {c.participant_name} ติดงาน "{taskTitle}"
                  </div>
                );
              })}
            </div>
          ),
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          result?.error || "ไม่สามารถบันทึกข้อมูลได้"
        );
      }

      message.success("เพิ่มงานสำเร็จ");

      form.resetFields();
      setShowCreateForm(false);

      await fetchTaskEvents();
    } catch (error) {
      console.error(error);

      message.error(
        error.message || "ไม่สามารถบันทึกข้อมูลได้"
      );

      setFormError(
        error.message || "เกิดข้อผิดพลาด"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className={cn("relative flex min-h-screen flex-col bg-background text-foreground", isDark && "dark")}>
      {isInitializing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-md">
          <div className="flex min-w-[320px] flex-col items-center gap-4 rounded-3xl border border-border bg-card/95 p-6 text-center shadow-2xl">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted">
              {currentUser.picture_url ? (
                <img
                  src={currentUser.picture_url}
                  alt={currentUser.display_name ?? "Current user"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-primary">
                  {currentUser.display_name?.[0] ?? "U"}
                </span>
              )}
            </div>
            <div className="flex w-full flex-col items-center gap-5">
              <BarLoader
                width={150}
                height={3}
                color="#22c55e"
              />

              <p className="text-lg font-semibold">
                กำลังเรียกข้อมูลผู้ใช้จาก LINE LIFF และฐานข้อมูล
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
