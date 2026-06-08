"use client";
import { useEffect, useMemo, useState } from "react";
import Calendar from "calendarjs";
import { CalendarDays, ChevronLeft, ChevronRight, Moon, Plus, Sun, X } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { initLiff } from "./liff";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Select } from "./components/ui/select";
import { Textarea } from "./components/ui/textarea";
import { ComboboxChips } from "./components/ui/combobox";
import { Form, FormDescription, FormField, FormLabel } from "./components/ui/form";
import { cn } from "./lib/utils";
import { SpinnerEmpty } from "./components/ui/spinnerEmpty";
import { BarLoader } from "react-spinners";
import { DatePicker, Tabs } from "antd";
import dayjs from "dayjs";
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

const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

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
  const [events, setEvents] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [participants, setParticipants] = useState([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState({
    title: "",
    start_time: "",
    end_time: "",
  }); const [formSuccess, setFormSuccess] = useState("");
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
    const [, selectedMonth, selectedDay] = selectedKey.split("-");
    return `${Number(selectedDay)} ${monthNames[Number(selectedMonth) - 1]}`;
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

      const tasks =
        await response.json();

      if (tasks.length !== 0) {
        console.log(
          "Loaded tasks:",
          tasks
        );
      }

      const grouped =
        tasks.reduce((acc, task) => {
          const date = new Date(
            task.start_time
          );

          const key = `${date.getFullYear()}-${date.getMonth() + 1
            }-${date.getDate()}`;

          acc[key] =
            acc[key] ?? [];

          acc[key].push(task);

          return acc;
        }, {});

      setEvents(grouped);
    } catch (error) {
      console.error(error);
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

  function moveMonth(direction) {
    setMonth((current) => {
      const nextMonth = current.month + direction;
      if (nextMonth < 1) return { year: current.year - 1, month: 12 };
      if (nextMonth > 12) return { year: current.year + 1, month: 1 };
      return { ...current, month: nextMonth };
    });
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    if (!validateForm()) {
      return;
      setFormError("");
      setFormSuccess("");

      const errors = validateForm();
      if (errors.length > 0) {
        setFormError(errors.join("\n"));
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          start_time: new Date(formData.start_time).toISOString(),
          creator_id: currentUser.id ?? currentUser.user_id ?? null,
          location: formData.location.trim() || null,
          type_id: formData.type_id,
          participant_ids: selectedParticipantIds,
        };

        const response = await fetch(`${apiUrl}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "ไม่สามารถเพิ่มงานได้");
        }

        setFormSuccess("เพิ่มงานสำเร็จ!");
        setTimeout(() => {
          setFormData({
            title: "",
            location: "",
            start_time: "",
            type_id: taskTypes.length ? taskTypes[0].id : null,
            type: taskTypes.length ? taskTypes[0].name : "ประชุม",
            description: "",
          });
          setSelectedParticipantIds([]);
          setFormError("");
          setFormSuccess("");
          setShowCreateForm(false);
        }, 500);

        await fetchTaskEvents();
      } catch (error) {
        console.error("Error creating task:", error);
        setFormError(error.message || "เกิดข้อผิดพลาดในการเพิ่มงาน");
      } finally {
        setIsSubmitting(false);
      }
    }
  }
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();

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


      if (!response.ok) {
        throw new Error(result.error || "Import failed");
      }

      await fetchTaskEvents();
    } catch (error) {
      console.error(error);
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

    setFormError(errors);

    return Object.keys(errors).length === 0;
  };

  // =========================
  // available / busy
  // =========================

  const selectedEvents = useMemo(() => {
    return Array.isArray(events?.[selectedKey])
      ? events[selectedKey]
      : [];
  }, [events, selectedKey]);

  const busyMap = useMemo(() => {
    const map = new Map();

    for (const event of selectedEvents) {
      const participants = Array.isArray(event?.task_participants)
        ? event.task_participants
        : [];

      for (const tp of participants) {
        const participant = tp?.participant;
        if (!participant?.id) continue;

        if (!map.has(participant.id)) {
          map.set(participant.id, []);
        }

        map.get(participant.id).push({
          id: event.id,
          title: event.title,
          start_time: event.start_time,
          location: event.location,
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
    const participants = event?.task_participants ?? [];

    return (
      <div
        key={event.id}
        className="flex flex-col gap-2 rounded-xl border border-border/40 bg-background p-4 transition-colors hover:border-border/70"
      >
        <p className="text-sm font-semibold text-foreground">{event.title}</p>

        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
            <Users className="h-3 w-3" />
            ผู้เข้าร่วม
          </p>

          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {participants.map((tp) => (
                <span
                  key={tp.id ?? tp.participant?.id}
                  className="rounded-full border border-border/40 bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tp.participant?.name ?? "ไม่ทราบชื่อ"}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground/60">ไม่มีผู้เข้าร่วม</p>
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
                <li key={e.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-red-400" />
                  {e.title}
                </li>
              ))}
            </ul>
          )}
        </div>

        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide
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
        label: "Event",
        children: selectedEvents.map(renderEvent),
      },
      {
        key: "available",
        label: "ว่าง",
        children: availableParticipants.map(renderParticipant),
      },
      {
        key: "busy",
        label: "ไม่ว่าง",
        children: busyParticipants.map(renderParticipant),
      },
    ],
    [availableParticipants, busyParticipants, selectedEvents]
  );

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
            >
              {isDark ? <Sun /> : <Moon />}
            </Button>
            <Button size="sm" onClick={() => setShowCreateForm(true)}>
              <Plus data-icon="inline-start" />
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
                      {monthNames[month.month - 1]} {month.year}
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

                  <label htmlFor="excel-upload">
                    <Button
                      asChild
                      variant="outline"
                      disabled={isUploading}
                    >
                      <span>
                        {isUploading
                          ? "กำลัง Import..."
                          : "Import Excel"}
                      </span>
                    </Button>
                  </label>

                  <Button
                    aria-label="เดือนก่อนหน้า"
                    onClick={() => moveMonth(-1)}
                    size="icon"
                    variant="outline"
                  >
                    <ChevronLeft />
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
                  <div className="grid grid-cols-7 bg-muted text-center text-xs font-medium text-muted-foreground">
                    {weekdays.map((weekday) => (
                      <div className="px-2 py-3" key={weekday}>
                        {weekday}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {weeks.flat().map((day) => {
                      const key = dayKey(day);
                      const isCurrentMonth = day.month === month.month;
                      const isSelected = key === selectedKey;
                      const hasEvents = Boolean(events[key]);

                      return (
                        <button
                          className={cn(
                            "flex min-h-20 flex-col items-start gap-2 border-r border-t p-2 text-left transition-colors last:border-r-0 sm:min-h-28 sm:p-3 lg:min-h-32",
                            !isCurrentMonth && "bg-muted/40 text-muted-foreground",
                            isSelected && "bg-accent",
                          )}
                          key={key}
                          onClick={() => setSelectedKey(key)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "grid size-7 place-items-center rounded-md text-sm font-medium",
                              isSelected && "bg-primary text-primary-foreground",
                            )}
                          >
                            {day.date}
                          </span>
                          {hasEvents ? (
                            <span className="h-1.5 w-10 rounded-full bg-primary" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
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
      {
        isUploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
            <div className="w-[380px]">
              <SpinnerEmpty
                title="กำลัง Import Excel"
                description="ระบบกำลังนำเข้าข้อมูล กรุณารอสักครู่..."
              />
            </div>
          </div>
        )
      }

      {
        showCreateForm && (
          <Dialog open={showCreateForm} className="overflow-y-auto" onClick={() => setShowCreateForm(false)}>
            <DialogContent className="w-full max-w-2xl" onClick={(event) => event.stopPropagation()}>
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b px-6 pt-6 pb-4">
                  <div className="flex flex-col">
                    <CardTitle>เพิ่มงานใหม่</CardTitle>
                    <CardDescription>กรอกข้อมูลงานใหม่ของคุณ</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    type="button"
                    className="h-10 w-10 p-0"
                    onClick={() => setShowCreateForm(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>

                <CardContent className="grid gap-4 px-4 pb-4 pt-4">
                  {formSuccess && (
                    <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      ✓ {formSuccess}
                    </div>
                  )}
                  {formError && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400 whitespace-pre-line">
                      ✕ {formError}
                    </div>
                  )}

                  <Form onSubmit={handleCreateTask}>
                    <FormField>
                      <FormLabel htmlFor="title">ชื่องาน *</FormLabel>
                      <Input
                        id="title"
                        type="text"
                        className={formError.includes("ชื่องาน") ? "border-red-500" : ""}
                        placeholder="เช่น ประชุมทีม"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          setFormError("");
                        }}
                        disabled={isSubmitting}
                        maxLength={100}
                      />
                      <FormDescription>{formData.title.length}/100 ตัวอักษร</FormDescription>
                    </FormField>

                    <FormField>
                      <FormLabel>ช่วงเวลา *</FormLabel>

                      <RangePicker
                        showTime={{
                          format: "HH:mm",
                        }}
                        format="DD/MM/YYYY HH:mm"
                        className={`w-full ${formError.dateRange
                          ? "!border-red-500"
                          : ""
                          }`}
                        placeholder={[
                          "เวลาเริ่ม",
                          "เวลาสิ้นสุด",
                        ]}
                        value={
                          formData.start_time &&
                            formData.end_time
                            ? [
                              dayjs(formData.start_time),
                              dayjs(formData.end_time),
                            ]
                            : null
                        }
                        onChange={(values) => {

                          if (!values) {

                            setFormData({
                              ...formData,
                              start_time: "",
                              end_time: "",
                            });

                            return;
                          }

                          setFormData({
                            ...formData,

                            start_time:
                              values[0].toISOString(),

                            end_time:
                              values[1].toISOString(),
                          });

                          setFormError((prev) => ({
                            ...prev,
                            dateRange: "",
                          }));
                        }}
                        disabled={isSubmitting}
                        disabledDate={(current) =>
                          current &&
                          current < dayjs().startOf("day")
                        }
                      />

                      {formError.dateRange && (
                        <p className="mt-1 text-sm text-red-500">
                          {formError.dateRange}
                        </p>
                      )}
                    </FormField>

                    <FormField>
                      <FormLabel htmlFor="participants">
                        กำหนดผู้เข้าร่วม
                      </FormLabel>

                      <ComboboxChips
                        options={participants
                          .filter(Boolean)
                          .map((participant) => ({
                            value: participant?.id,
                            label:
                              participant?.name ||
                              `Participant ${participant?.id ?? "?"}`,
                          }))}

                        selectedValues={
                          selectedParticipantIds
                        }

                        onValueChange={(values) =>
                          setSelectedParticipantIds(
                            values
                          )
                        }

                        placeholder={
                          participants.length
                            ? "เลือกผู้เข้าร่วม"
                            : "กำลังโหลดผู้เข้าร่วม..."
                        }

                        disabled={isSubmitting}
                      />

                      <FormDescription>
                        เลือกผู้เข้าร่วมโดยพิมพ์เพื่อค้นหา
                      </FormDescription>
                    </FormField>

                    <FormField>
                      <FormLabel htmlFor="description">รายละเอียด</FormLabel>
                      <Textarea
                        id="description"
                        placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)"
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={isSubmitting}
                        maxLength={500}
                      />
                      <FormDescription>{formData.description.length}/500 ตัวอักษร</FormDescription>
                    </FormField>

                    <CardFooter className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                      <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                            กำลังบันทึก...
                          </span>
                        ) : (
                          "บันทึก"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setShowCreateForm(false);
                          setFormError("");
                          setFormSuccess("");
                        }}
                        disabled={isSubmitting}
                      >
                        ยกเลิก
                      </Button>
                    </CardFooter>
                  </Form>
                </CardContent>
              </Card>
            </DialogContent>
          </Dialog>
        )
      }
    </main >
  );
}

export default App;
