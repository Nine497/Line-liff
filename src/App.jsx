"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Calendar from "calendarjs";
import { CalendarDays, ChevronLeft, ChevronRight, Moon, Plus, Sun, X } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { initLiff } from "./liff";
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Users } from "lucide-react"
import { Dialog, DialogContent } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { ComboboxChips } from "./components/ui/combobox";
import { cn } from "./lib/utils";
import { SpinnerEmpty } from "./components/ui/spinnerEmpty";
import { BarLoader } from "react-spinners";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Alert,
  Tabs,
  message
} from "antd";
import dayjs from "dayjs";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import thLocale from "@fullcalendar/core/locales/th";
import "./styles/fullcalendar.css"
const weekdays = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const apiUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const todayKey = dayjs().format(
  "YYYY-MM-DD"
);
// const tabLabels = [
//   ["calendar", "ปฏิทิน"],
//   ["agenda", "รายการ"],
// ];

function dayKey(day) {
  return `${day.year}-${day.month}-${day.date}`;
}

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
  const { RangePicker } = DatePicker;
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    start_time: "",
    team: "",
    type_id: null,
    type: "ประชุม",
    description: "",
  });
  const [taskTypes, setTaskTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState([]);
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

  const weeks = useMemo(() => {
    const calendar = new Calendar(month.year, month.month);
    return calendar.generate({ withStaticLength: true });
  }, [month]);

  const selectedDate = useMemo(() => {
    const [year, month, day] = selectedKey.split("-");
    return `${Number(day)} ${monthNames[Number(month) - 1]} ${Number(year) + 543}`;
  }, [selectedKey]);

  useEffect(() => {
    const initApp = async () => {
      try {
        const liff = await initLiff();

        if (!liff) {
          return;
        }

        const idToken = liff.getIDToken();

        if (!idToken) {
          throw new Error(
            "Missing LIFF ID Token (openid scope missing)"
          );
        }

        const response = await fetch(`${apiUrl}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_token: idToken,
          }),
        });

        const result = await response.json();

        if (response.status === 401) {
          liff.logout();
          liff.login();
          return;
        }
        if (!response.ok) {
          throw new Error(
            result.error || "Failed to sync user"
          );
        }

        setCurrentUser(result.user);

        await Promise.all([
          fetchTaskEvents(),
          fetchTaskTypes(),
          fetchUsers(),
          fetchParticipants(),
        ]);
      } catch (error) {
        console.error("LIFF init failed:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  async function fetchTaskEvents() {
    try {
      const response = await fetch(
        `${apiUrl}/tasks`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load tasks from backend"
        );
      }

      const tasks = await response.json();

      const calendarEvents = tasks.map((task) => {
        const color = task.type?.color ?? '#6c5ce7'
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)

        return {
          id: task.id,
          title: task.title,
          start: dayjs(task.start_time).format("YYYY-MM-DD"),
          end: dayjs(task.end_time).add(1, "day").format("YYYY-MM-DD"),
          allDay: true,
          backgroundColor: `rgba(${r},${g},${b},0.15)`,
          borderColor: 'transparent',
          textColor: color,
          extendedProps: {
            task,
            participants: task.task_participants,
          },
        }
      })

      setEvents(calendarEvents);
      console.log("Fetched tasks:", calendarEvents);
    } catch (error) {
      console.error(
        "Fetch tasks error:",
        error
      );
    }
  }

  const fetchParticipants =
    async () => {
      setLoading(true);
      try {
        const response =
          await fetch(
            `${apiUrl}/tasks/participants`
          );

        const result =
          await response.json();

        setParticipants(
          result || []
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  async function fetchTaskTypes() {
    try {
      const response = await fetch(`${apiUrl}/tasks/types`);
      if (!response.ok) throw new Error("Failed to load task types");

      const types = await response.json();
      if (Array.isArray(types) && types.length > 0) {
        setTaskTypes(types);
        setFormData((prev) => {
          const matched = types.find((item) => item.name === prev.type || item.id === prev.type_id);
          return {
            ...prev,
            type_id: matched?.id ?? types[0].id,
            type: matched?.name ?? types[0].name,
          };
        });
      }
    } catch (error) {
      console.error("Failed to load task types from backend", error);
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch(`${apiUrl}/users`);
      if (!response.ok) throw new Error("Failed to load users");

      const userList = await response.json();
      if (Array.isArray(userList)) {
        setUsers(userList);
      }
    } catch (error) {
      console.error("Failed to load users from backend", error);
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

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = "กรุณากรอกชื่องาน";
    }

    if (!formData.start_time || !formData.end_time) {
      errors.dateRange = "กรุณาเลือกช่วงเวลา";
    }

    setFormError(error?.message || "เกิดข้อผิดพลาด");

    return Object.keys(errors).length === 0;
  };

  // =========================
  // available / busy
  // =========================

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

  const renderEvent = (event) => {
    const participants =
      event?.extendedProps?.task?.task_participants ?? [];
    const color = event?.extendedProps?.task?.type?.color;
    const typeName = event?.extendedProps?.task?.type?.name;

    const hex = color ?? '#2563eb'
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const bgColor = `rgba(${r},${g},${b},0.06)`
    const borderColor = `rgba(${r},${g},${b},0.25)`

    return (
      <div
        key={event.id}
        className="flex flex-col gap-3 rounded-xl p-4 transition-colors"
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ background: hex }}
            />
            <p className="text-sm font-medium text-foreground leading-snug">
              {event.title}
            </p>
          </div>

          {typeName && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0"
              style={{
                background: `rgba(${r},${g},${b},0.12)`,
                color: hex,
              }}
            >
              {typeName}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            <Users className="h-3 w-3" />
            ผู้เข้าร่วม
          </p>

          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {participants.map((tp) => (
                <span
                  key={tp.id ?? tp.participant?.id}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    background: `rgba(${r},${g},${b},0.08)`,
                    color: hex,
                    border: `1px solid rgba(${r},${g},${b},0.2)`,
                  }}
                >
                  {tp.participant?.name ?? "ไม่ทราบชื่อ"}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground/50">
              ไม่มีผู้เข้าร่วม
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderParticipant = (participant) => {
    const events = busyMap.get(participant.id) || [];
    const isBusy = events.length > 0;

    return (
      <div
        key={participant.id}
        className={`flex items-start justify-between gap-3 rounded-xl border-y border-r bg-background p-4 transition-colors hover:border-border/70
        ${isBusy
            ? "border-l-[3px] border-l-red-500 border-border/40"
            : "border-l-[3px] border-l-emerald-500 border-border/40"
          }`}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{participant.name}</p>

          {isBusy && (
            <ul className="space-y-1">
              {events.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-red-400" />
                  {e.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-sm font-semibold tracking-wide
          ${isBusy
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            }`}
        >
          {isBusy ? "ไม่ว่าง" : "ว่าง"}
        </span>
      </div>
    );
  };

  const tabItems = useMemo(
    () => [
      {
        key: "events",
        label: "กำหนดการ",
        children: (
          <div className="space-y-3">
            {selectedEvents.map(renderEvent)}
          </div>
        ),
      },
      {
        key: "available",
        label: "ไม่ติดภารกิจ",
        children: (
          <div className="space-y-3">
            {availableParticipants.map(renderParticipant)}
          </div>
        ),
      },
      {
        key: "busy",
        label: "ติดภารกิจ",
        children: (
          <div className="space-y-3">
            {busyParticipants.map(renderParticipant)}
          </div>
        ),
      },
    ],
    [availableParticipants, busyParticipants, selectedEvents]
  );

  const handleCreateTask =
    async (payload) => {
      try {
        setIsSubmitting(true);

        const response = await fetch(
          `${apiUrl}/tasks`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              payload
            ),
          }
        );

        if (!response.ok) {
          throw new Error(
            "ไม่สามารถบันทึกข้อมูลได้"
          );
        }

        setFormSuccess(
          "บันทึกข้อมูลสำเร็จ"
        );

        form.resetFields();

        setTimeout(() => {
          setShowCreateForm(false);
        }, 1000);

        fetchTaskEvents();
      } catch (error) {
        setFormError(
          error.message ||
          "เกิดข้อผิดพลาด"
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

      {/* ส่วนโครงสร้างหลักกึ่งกลาง */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3 pb-4">
          <a className="flex items-center gap-3 font-semibold" href="#calendarjs">
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm">
              {currentUser.picture_url ? (
                <img
                  src={currentUser.picture_url}
                  alt={currentUser.display_name ?? "Current user"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold">
                  {currentUser.display_name?.[0] ?? "L"}
                </span>
              )}
            </span>
            <span>{currentUser.display_name ? currentUser.display_name : "ศรชล. Scheduler"}</span>
          </a>

          <div className="flex items-center gap-2">
            <Button
              aria-label={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              size="icon"
              type="button"
              variant="outline"
              disabled
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Button type="primary" size="sm" icon={<PlusOutlined />} onClick={() => setShowCreateForm(true)}>
              เพิ่มงาน
            </Button>
          </div>
        </nav>

        {/* เปลี่ยนจาก <main> เป็น <div> เพื่อไม่ให้ Tag ซ้ำซ้อน และใช้ flex-1 เพื่อดัน Footer */}
        <div className="flex flex-1 flex-col gap-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]" id="calendarjs">
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
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
                  ) : (
                    <div className="rounded-lg border p-4 text-center text-muted-foreground">
                      ไม่มีงานในวันนี้
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </section >
        </div >
      </div >

      {/* ย้าย Footer ออกมาด้านนอกสุด และเพิ่ม padding เพื่อความสวยงาม */}
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

      {/* ส่วนของ Dialog ต่างๆ (คงเดิม) */}
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

      <Modal
        open={showCreateForm}
        title="เพิ่มกำหนดการใหม่"
        onCancel={() => {
          setShowCreateForm(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            const payload = {
              title: values.title.trim(),
              type_id: values.type_id,
              description: values.description?.trim() || "",
              start_time:
                values.dateRange[0].toISOString(),
              end_time:
                values.dateRange[1].toISOString(),
              participant_ids:
                values.participants || [],
            };

            await handleCreateTask(payload);
          }}
          initialValues={{
            title: "",
            description: "",
            participants: [],
          }}
        >
          <Form.Item
            label="ชื่องาน"
            name="title"
            rules={[
              {
                required: true,
                message: "กรุณากรอกชื่องาน",
              },
              {
                max: 100,
                message:
                  "ชื่องานต้องไม่เกิน 100 ตัวอักษร",
              },
              {
                validator: (_, value) => {
                  if (
                    !value ||
                    value.trim().length > 0
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "ชื่องานต้องไม่เป็นค่าว่าง"
                    )
                  );
                },
              },
            ]}
          >
            <Input
              placeholder="เช่น ประชุมทีม"
              maxLength={100}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="ประเภทงาน"
            name="type_id"
            rules={[
              {
                required: true,
                message: "กรุณาเลือกประเภทงาน",
              },
            ]}
          >
            <Select
              showSearch
              placeholder="เลือกประเภทงาน"
              optionFilterProp="label"
              options={taskTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="ช่วงเวลา"
            name="dateRange"
            rules={[
              {
                required: true,
                message:
                  "กรุณาเลือกวันและเวลา",
              },
              {
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }

                  const [start, end] =
                    value;

                  if (
                    end.isAfter(start)
                  ) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error(
                      "วันสิ้นสุดต้องมากกว่าวันเริ่มต้น"
                    )
                  );
                },
              },
            ]}
          >
            <RangePicker
              className="w-full"
              showTime={{
                format: "HH:mm",
              }}
              format="DD/MM/YYYY HH:mm"
              placeholder={[
                "วันเริ่มต้น",
                "วันสิ้นสุด",
              ]}
              disabledDate={(current) =>
                current &&
                current <
                dayjs().startOf("day")
              }
            />
          </Form.Item>

          <Form.Item
            label="ผู้เข้าร่วม"
            name="participants"
          >
            <Select
              mode="multiple"
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="เลือกผู้เข้าร่วม"
              options={participants.map(
                (participant) => ({
                  value: participant.id,
                  label: participant.name,
                })
              )}
            />
          </Form.Item>

          <Form.Item
            label="รายละเอียด"
            name="description"
            rules={[
              {
                max: 500,
                message:
                  "รายละเอียดต้องไม่เกิน 500 ตัวอักษร",
              },
            ]}
          >
            <TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                form.resetFields();
              }}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
            >
              บันทึก
            </Button>
          </div>
        </Form>
      </Modal>
    </main >
  );
}

export default App;
