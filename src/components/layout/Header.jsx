import { ArrowLeft, Bell, BellOff } from "lucide-react";
import CompassMark from "./CompassMark";
import AddEventButton from "./AddEventButton";
import { useClock } from "../../hooks/useClock";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";

function Header({
    currentUser,
    onCreateTask,
    onBack,
    onOpenSettings,
}) {
    const { time, date } = useClock();
    const { settings } = useNotificationSettings();
    const isNotifEnabled = settings?.enabled ?? false;

    return (
        <nav className="flex items-center justify-between gap-3 pb-4">
            <div className="flex items-center gap-3">
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-xl)] border border-border bg-card text-foreground transition-all duration-200 hover:scale-105 hover:bg-muted active:scale-95 shadow-sm"
                        title="กลับสู่ระบบ Thai MECC"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                )}
                {(() => {
                    const avatarUrl = currentUser.picture_url || currentUser.pictureUrl || currentUser.line_picture_url || currentUser.avatar || null;
                    const displayName = currentUser.display_name || currentUser.line_display_name || currentUser.displayName || `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username || "ศรชล.";

                    return (
                        <a
                            className="flex items-center gap-3 transition-transform duration-200 hover:scale-105 active:scale-95"
                            href="#calendarjs"
                        >
                            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm shrink-0">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                                    />
                                ) : (
                                    <CompassMark className="h-6 w-6" />
                                )}
                            </span>

                            <span className="flex flex-col leading-tight">
                                <span className="font-display font-bold text-base text-foreground">
                                    {displayName}
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                    ศรชล.
                                </span>
                            </span>
                        </a>
                    );
                })()}
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end leading-tight font-display tabular-nums">
                    <span className="text-sm font-semibold text-foreground">{time}</span>
                    <span className="text-[10.5px] text-muted-foreground">{date}</span>
                </div>

                <button
                    type="button"
                    onClick={onOpenSettings}
                    className={`group relative flex h-10 shrink-0 items-center justify-center rounded-2xl bg-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm border px-2.5 gap-1.5 ${
                        isNotifEnabled 
                            ? "text-slate-700 border-slate-200 hover:border-slate-300" 
                            : "text-slate-400 border-slate-200 hover:text-slate-600"
                    }`}
                >
                    {isNotifEnabled ? (
                        <Bell className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                    ) : (
                        <BellOff className="h-4 w-4 transition-transform duration-300" />
                    )}
                    <span className="text-xs font-semibold pr-0.5">
                        {isNotifEnabled ? "เปิด" : "ปิด"}
                    </span>
                    
                    {/* Minimal Notification Dot (only when ON) */}
                    {isNotifEnabled && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500 border border-white"></span>
                        </span>
                    )}
                </button>

                <AddEventButton onClick={onCreateTask} />
            </div>
        </nav>
    );
}

export default Header;
