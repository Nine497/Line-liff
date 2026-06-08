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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "./lib/utils";
import { SpinnerEmpty } from "./components/ui/spinnerEmpty";
import { BarLoader } from "react-spinners";
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
  const [view, setView] = useState("calendar");
  const [theme, setTheme] = useState("light");
  const [viewMode, setViewMode] = useState("available");
  const [month, setMonth] = useState({ year: 2026, month: 6 });
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [showMine, setShowMine] = useState(false);
  const [events, setEvents] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [abortController, setAbortController] = useState(null);
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
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const isDark = theme === "dark";
  const [isUploading, setIsUploading] = useState(false);
  const [loadingTab, setLoadingTab] = useState("available");
  const [activeTab, setActiveTab] = useState("available");
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

  const selectedEvents = events[selectedKey] ?? [];
  const filteredEvents = selectedEvents.filter((event) =>
    showMine
      ? event.task_participants.some((participant) => participant.user_id === currentUser.user_id)
      : true,
  );

  const totalParticipants = filteredEvents.reduce(
    (sum, event) => sum + event.task_participants.filter((participant) => participant.status === "going").length,
    0,
  );

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

        console.log("Backend result:", result);
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
        console.log("LIFF initialization completed", participants);
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
        console.log(result);
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

  function validateForm() {
    const errors = [];
    if (!formData.title.trim()) errors.push("ชื่องานห้ามว่าง");
    if (formData.title.trim().length < 3) errors.push("ชื่องานต้องมีอย่างน้อย 3 ตัวอักษร");
    if (!formData.start_time) errors.push("เวลาห้ามว่าง");

    const selectedTime = new Date(formData.start_time);
    const now = new Date();
    if (selectedTime < now) errors.push("ไม่สามารถสร้างงานในอดีตได้");

    return errors;
  }

  async function handleCreateTask(e) {
    e.preventDefault();
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

      console.log(result);

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

  const busyMap = new Map();

  filteredEvents.forEach((event) => {
    const title = event?.title;

    (event.task_participants ?? []).forEach((tp) => {
      const id = tp.participant?.id;
      if (!id) return;

      if (!busyMap.has(id)) {
        busyMap.set(id, []);
      }

      busyMap.get(id).push(title);
    });
  });

  const availableParticipants = participants.filter(
    (p) => !busyMap.has(p.id)
  );

  const busyParticipants = participants.filter(
    (p) => busyMap.has(p.id)
  );

  const filteredParticipants =
    viewMode === "available"
      ? availableParticipants
      : viewMode === "busy"
        ? busyParticipants
        : participants;

  const renderParticipant = (participant) => {
    console.log("Rendering participant:", participant);

    if (!participant) {
      return (
        <div className="flex items-center justify-between rounded-lg border bg-background p-4">
          ไม่มีข้อมูล
        </div>
      );
    }

    const tasks = busyMap.get(participant.id) || [];
    const isBusy = tasks.length > 0;

    return (
      <div
        key={participant.id}
        className="flex items-center justify-between rounded-lg border bg-background p-4"
      >
        <div>
          <p className="font-medium">{participant.name}</p>

          <p className="text-sm text-muted-foreground">
            {isBusy
              ? `มีงาน: ${tasks.join(", ")}`
              : "ไม่มีงานในวันนี้"}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${isBusy
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
            }`}
        >
          {isBusy ? "ไม่ว่าง" : "ว่าง"}
        </span>
      </div>
    );
  };

  return (
    <main className={cn("relative min-h-svh bg-background text-foreground", isDark && "dark")}>
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
            <div className="flex w-full flex-col items-center gap-3">
              <BarLoader
                width={220}
                height={6}
                color="#22c55e"
              />

              <p className="text-lg font-semibold">
                กำลังเรียกข้อมูลผู้ใช้จาก LINE LIFF และฐานข้อมูล
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3">
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
        <main className="flex flex-1 flex-col gap-5">

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

            <aside className="grid gap-5 max-h-[300px] xl:content-start">
              <Card>
                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardDescription>วันที่เลือก</CardDescription>
                    <CardTitle>{selectedDate}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Tabs
                    defaultValue="available"
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="available">ว่าง</TabsTrigger>
                      <TabsTrigger value="busy">ไม่ว่าง</TabsTrigger>
                      <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
                    </TabsList>

                    <TabsContent value="available">
                      <div className="max-h-[500px] overflow-y-auto pr-2">
                        <div className="flex flex-col gap-3">
                          {availableParticipants.length > 0 ? (
                            availableParticipants.map(renderParticipant)
                          ) : (
                            <div className="text-center text-muted-foreground p-4 border rounded-lg">
                              ไม่มีคนว่าง
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="busy">
                      <div className="max-h-[500px] overflow-y-auto pr-2">

                        <div className="flex flex-col gap-3">
                          {busyParticipants.length > 0 ? (
                            busyParticipants.map(renderParticipant)
                          ) : (
                            <div className="text-center text-muted-foreground p-4 border rounded-lg">
                              ทุกคนว่าง
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>


                    <TabsContent value="all">
                      <div className="max-h-[500px] overflow-y-auto pr-2">
                        <div className="flex flex-col gap-3">
                          {participants.length > 0 ? (
                            participants.map(renderParticipant)
                          ) : (
                            <div className="text-center text-muted-foreground p-4 border rounded-lg">
                              ไม่มีข้อมูลผู้ใช้งาน
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                  </Tabs>
                </CardContent>
              </Card>
            </aside>
          </section>
        </main >
        <footer className="border-t bg-background">
          <div className="mx-auto flex flex-col items-center justify-center gap-2 px-2 pt-2 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              LINE LIFF Scheduler © {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-2">
              <span>
                Powered by React •
                Supabase
              </span>
            </div>
          </div>
        </footer>
        {isUploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
            <div className="w-[380px]">
              <SpinnerEmpty
                title="กำลัง Import Excel"
                description="ระบบกำลังนำเข้าข้อมูล กรุณารอสักครู่..."
              />
            </div>
          </div>
        )}
      </div>

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
                      <FormLabel htmlFor="start_time">เวลา *</FormLabel>
                      <Input
                        id="start_time"
                        type="datetime-local"
                        className={formError.includes("เวลา") ? "border-red-500" : ""}
                        value={formData.start_time}
                        onChange={(e) => {
                          setFormData({ ...formData, start_time: e.target.value });
                          setFormError("");
                        }}
                        disabled={isSubmitting}
                      />
                    </FormField>

                    <FormField>
                      <FormLabel htmlFor="location">สถานที่</FormLabel>
                      <Input
                        id="location"
                        type="text"
                        placeholder="เช่น ห้องประชุม A"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        disabled={isSubmitting}
                        maxLength={100}
                      />
                    </FormField>

                    <FormField>
                      <FormLabel htmlFor="type">ประเภท</FormLabel>
                      <Select
                        id="type"
                        value={taskTypes.length ? formData.type_id ?? "" : formData.type}
                        onChange={(e) => {
                          if (taskTypes.length) {
                            const selected = taskTypes.find((item) => String(item.id) === e.target.value);
                            setFormData({
                              ...formData,
                              type_id: selected?.id ?? null,
                              type: selected?.name ?? formData.type,
                            });
                          } else {
                            setFormData({
                              ...formData,
                              type: e.target.value,
                            });
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        {taskTypes.length ? (
                          taskTypes.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))
                        ) : (
                          [
                            "ประชุม",
                            "เดโม",
                            "สรุปงาน",
                            "แชร์ทรัพยากร",
                            "เช็คอิน",
                          ].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))
                        )}
                      </Select>
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
