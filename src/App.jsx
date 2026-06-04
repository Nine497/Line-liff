import { useEffect, useMemo, useState } from "react";
import Calendar from "calendarjs";
import { CalendarDays, ChevronLeft, ChevronRight, Moon, Plus, Sun } from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { initLiff } from "./liff";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { cn } from "./lib/utils";

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

const seededEvents = {
  "2026-6-4": [
    {
      id: "2026-6-4-1",
      time: "09:30",
      title: "เริ่มต้นใช้งานลูกค้า",
      creator: {
        user_id: "U10001",
        display_name: "พี่เอ",
      },
      participants: [
        { user_id: "U10001", display_name: "พี่เอ", status: "going" },
        { user_id: "U10002", display_name: "น้องบี", status: "going" },
        { user_id: "U10003", display_name: "บอสชล", status: "pending" },
      ],
      team: "ทีม LINE OA",
      status: "ยืนยันแล้ว",
      type: "ประชุม",
      location: "ห้องประชุม A",
    },
    {
      id: "2026-6-4-2",
      time: "13:00",
      title: "รีวิวขั้นตอนจองคิว",
      creator: {
        user_id: "U10002",
        display_name: "น้องบี",
      },
      participants: [
        { user_id: "U10002", display_name: "น้องบี", status: "going" },
        { user_id: "U10004", display_name: "พี่ต้น", status: "pending" },
      ],
      team: "ทีมโปรดักต์",
      status: "รอตรวจ",
      type: "สรุปงาน",
      location: "ห้องประชุม B",
    },
    {
      id: "2026-6-4-3",
      time: "16:15",
      title: "เผยแพร่เวลาว่าง",
      creator: {
        user_id: "U10005",
        display_name: "คุณแอน",
      },
      participants: [
        { user_id: "U10005", display_name: "คุณแอน", status: "going" },
      ],
      team: "กลุ่มทดลอง SaaS",
      status: "พร้อม",
      type: "แชร์ทรัพยากร",
      location: "ออนไลน์",
    },
  ],
  "2026-6-6": [
    {
      id: "2026-6-6-1",
      time: "10:00",
      title: "ประชุมทีมปฏิบัติการ",
      creator: {
        user_id: "U10003",
        display_name: "บอสชล",
      },
      participants: [
        { user_id: "U10003", display_name: "บอสชล", status: "going" },
        { user_id: "U10006", display_name: "น้องแจน", status: "going" },
      ],
      team: "ฝ่ายซัพพอร์ต",
      status: "ยืนยันแล้ว",
      type: "ประชุมทีม",
      location: "ห้องประชุม C",
    },
  ],
  "2026-6-11": [
    {
      id: "2026-6-11-1",
      time: "11:30",
      title: "เชื่อมต่อ CalendarJS",
      creator: {
        user_id: "U10005",
        display_name: "คุณแอน",
      },
      participants: [
        { user_id: "U10005", display_name: "คุณแอน", status: "going" },
        { user_id: "U10002", display_name: "น้องบี", status: "pending" },
      ],
      team: "Frontend",
      status: "พร้อม",
      type: "เช็คอิน",
      location: "ออนไลน์",
    },
    {
      id: "2026-6-11-2",
      time: "15:00",
      title: "เดโมให้ลูกค้า",
      creator: {
        user_id: "U10003",
        display_name: "บอสชล",
      },
      participants: [
        { user_id: "U10003", display_name: "บอสชล", status: "going" },
        { user_id: "U10004", display_name: "พี่ต้น", status: "going" },
      ],
      team: "ฝ่ายขาย",
      status: "ยืนยันแล้ว",
      type: "เดโม",
      location: "ห้องประชุม D",
    },
  ],
};

const tabLabels = [
  ["calendar", "ปฏิทิน"],
  ["agenda", "รายการ"],
];

function dayKey(day) {
  return `${day.year}-${day.month}-${day.date}`;
}

function App() {
  const [view, setView] = useState("calendar");
  const [theme, setTheme] = useState("light");
  const [month, setMonth] = useState({ year: 2026, month: 6 });
  const [selectedKey, setSelectedKey] = useState("2026-6-4");
  const [showMine, setShowMine] = useState(false);
  const [events, setEvents] = useState(seededEvents);
  const [currentUser, setCurrentUser] = useState({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    start_time: "",
    team: "",
    type: "ประชุม",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const isDark = theme === "dark";

  const weeks = useMemo(() => {
    const calendar = new Calendar(month.year, month.month);
    return calendar.generate({ withStaticLength: true });
  }, [month]);

  const selectedEvents = events[selectedKey] ?? [];
  const filteredEvents = selectedEvents.filter((event) =>
    showMine
      ? event.participants.some((participant) => participant.user_id === currentUser.user_id)
      : true,
  );

  const totalParticipants = filteredEvents.reduce(
    (sum, event) => sum + event.participants.filter((participant) => participant.status === "going").length,
    0,
  );

  const selectedDate = useMemo(() => {
    const [, selectedMonth, selectedDay] = selectedKey.split("-");
    return `${Number(selectedDay)} ${monthNames[Number(selectedMonth) - 1]}`;
  }, [selectedKey]);

  useEffect(() => {
    const initApp = async () => {
      setIsInitializing(true);
      try {
        const liff = await initLiff();
        if (!liff) {
          setIsInitializing(false);
          return;
        }

        const profile = await liff.getProfile();

        if (!profile?.userId) {
          throw new Error("LIFF profile missing userId");
        }

        const userObj = {
          user_id: profile.userId,
          display_name: profile.displayName,
          picture_url: profile.pictureUrl ?? null,
        };

        try {
          const response = await fetch(`${apiUrl}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userObj),
          });

          const result = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(result.error?.message || result.error || response.statusText);
          }

          setCurrentUser(result.user ?? userObj);
        } catch (err) {
          console.error("Failed to upsert user to backend", err);
          setCurrentUser(userObj);
        }
      } catch (error) {
        console.error("LIFF init failed", error);
      }

      await fetchTaskEvents();
      setIsInitializing(false);
    };

    initApp();
  }, []);

  async function fetchTaskEvents() {
    try {
      const response = await fetch(`${apiUrl}/tasks`);
      if (!response.ok) throw new Error("Failed to load tasks from backend");

      const tasks = await response.json();
      const tasksWithParticipants = await Promise.all(
        tasks.map(async (task) => {
          let participants = [];
          try {
            const partResponse = await fetch(`${apiUrl}/tasks/${task.id}/participants`);
            if (partResponse.ok) {
              participants = await partResponse.json();
            }
          } catch (error) {
            console.error(`Failed to load participants for task ${task.id}`, error);
          }

          return {
            ...task,
            participants,
          };
        }),
      );

      const grouped = tasksWithParticipants.reduce((acc, task) => {
        const date = new Date(task.start_time);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        acc[key] = acc[key] ?? [];
        acc[key].push(task);
        return acc;
      }, {});

      setEvents(grouped);
    } catch (error) {
      console.error(error);
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
        creator_name: currentUser.display_name || "Unknown",
        location: formData.location.trim() || null,
        team: formData.team.trim() || null,
        type: formData.type || "ประชุม",
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
          team: "",
          type: "ประชุม",
          description: "",
        });
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

  return (
    <main className={cn("min-h-svh bg-background text-foreground", isDark && "dark")}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        {isInitializing ? (
          <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
            กำลังโหลดข้อมูลผู้ใช้และงานจากระบบ...
          </div>
        ) : null}
        <nav className="flex items-center justify-between gap-3">
          <a className="flex items-center gap-3 font-semibold" href="#calendarjs">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              L
            </span>
            <span>ศรชล. Scheduler</span>
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

        <header className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card className="border-none bg-card/70 shadow-none">
            <CardHeader className="gap-3">
              <Badge className="w-fit" variant="secondary">
                LIFF scheduler SaaS
              </Badge>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-3xl leading-tight sm:text-4xl">
                  จัดตารางนัดหมายสำหรับทีมที่ทำงานผ่าน LINE
                </CardTitle>
                <CardDescription className="max-w-2xl text-base leading-7">
                  ปฏิทินจาก CalendarJS พร้อมรายการนัดหมาย เวลาว่าง และ UI ที่เหมาะกับทั้งมือถือใน LIFF และหน้าจอ PC
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={showMine ? "outline" : "secondary"}
                onClick={() => setShowMine(false)}
              >
                งานทั้งหมด
              </Button>
              <Button
                size="sm"
                variant={showMine ? "secondary" : "outline"}
                onClick={() => setShowMine(true)}
              >
                งานของฉัน
              </Button>
            </div>
          </div>
        </header>

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
              <Tabs>
                <TabsList className="w-fit">
                  {tabLabels.map(([item, label]) => (
                    <TabsTrigger
                      active={view === item}
                      key={item}
                      onClick={() => setView(item)}
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent>
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <aside className="grid gap-5 xl:content-start">
            <Card>
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardDescription>วันที่เลือก</CardDescription>
                  <CardTitle>{selectedDate}</CardTitle>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["งานที่แสดง", filteredEvents.length],
                    ["ผู้เข้าร่วม", totalParticipants],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg bg-muted p-4 text-center"
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {filteredEvents.length ? (
                  filteredEvents.map((event) => {
                    const attendees = event.participants.filter((participant) => participant.status === "going");

                    return (
                      <div
                        className="flex flex-col gap-4 rounded-lg border bg-background p-4"
                        key={event.id}
                      >
                        <div className="flex items-start gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              <time className="font-semibold">{event.time}</time>
                              <span>•</span>
                              <span>{event.team}</span>
                            </div>
                            <p className="mt-2 text-lg font-semibold">{event.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              โดย {event.creator.display_name} • {event.type} • {event.location}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {attendees.map((participant) => (
                            <span
                              key={participant.user_id}
                              className="rounded-full border border-input px-2 py-1 text-xs"
                            >
                              {participant.display_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed p-4">
                    <p className="font-medium">ยังไม่มีนัดหมาย</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      เพิ่มช่วงเวลาสำหรับลูกค้า walk-in หรือประชุมทีมได้เลย
                    </p>
                  </div>
                )}
                <Button className="w-full" onClick={() => setShowCreateForm(true)}>
                  <Plus data-icon="inline-start" />
                  เพิ่มช่วงเวลา
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>เวลาว่าง</CardDescription>
                <CardTitle>72%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-20 items-end gap-2" aria-hidden="true">
                  <span className="h-8 flex-1 rounded-md bg-primary/50" />
                  <span className="h-12 flex-1 rounded-md bg-primary/70" />
                  <span className="h-16 flex-1 rounded-md bg-primary" />
                  <span className="h-10 flex-1 rounded-md bg-primary/60" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>เพิ่มงานใหม่</CardTitle>
              <CardDescription>กรอกข้อมูลงานใหม่ของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              {formSuccess && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  ✓ {formSuccess}
                </div>
              )}
              {formError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400 whitespace-pre-line">
                  ✕ {formError}
                </div>
              )}

              <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium">ชื่องาน *</label>
                  <input
                    type="text"
                    className={cn(
                      "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors",
                      "border-input focus:border-primary focus:outline-none",
                      formError.includes("ชื่องาน") && "border-red-500"
                    )}
                    placeholder="เช่น ประชุมทีม"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      setFormError("");
                    }}
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.title.length}/100 ตัวอักษร
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium">เวลา *</label>
                  <input
                    type="datetime-local"
                    className={cn(
                      "mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors",
                      "border-input focus:border-primary focus:outline-none",
                      formError.includes("เวลา") && "border-red-500"
                    )}
                    value={formData.start_time}
                    onChange={(e) => {
                      setFormData({ ...formData, start_time: e.target.value });
                      setFormError("");
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">สถานที่</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    placeholder="เช่น ห้องประชุม A"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">ทีม</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    placeholder="เช่น ทีม LINE OA"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    disabled={isSubmitting}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">ประเภท</label>
                  <select
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option>ประชุม</option>
                    <option>เดโม</option>
                    <option>สรุปงาน</option>
                    <option>แชร์ทรัพยากร</option>
                    <option>เช็คอิน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">รายละเอียด</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none resize-none"
                    placeholder="รายละเอียดเพิ่มเติม (ไม่จำเป็น)"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formData.description.length}/500 ตัวอักษร
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    className="flex-1"
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
                    className="flex-1"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormError("");
                      setFormSuccess("");
                    }}
                    disabled={isSubmitting}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

export default App;
