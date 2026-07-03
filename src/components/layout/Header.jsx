import { Sun, Moon } from "lucide-react";
import CompassMark from "./CompassMark";
import AddEventButton from "./AddEventButton";
import { useClock } from "../../hooks/useClock";

function Header({
    currentUser,
    isDark,
    onToggleTheme,
    onCreateTask,
}) {
    const { time, date } = useClock();

    return (
        <nav className="flex items-center justify-between gap-3 pb-4">
            <a
                className="flex items-center gap-3"
                href="#calendarjs"
            >
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground shadow-sm shrink-0">
                    {currentUser.picture_url ? (
                        <img
                            src={currentUser.picture_url}
                            alt={currentUser.display_name ?? "Current user"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <CompassMark className="h-6 w-6" />
                    )}
                </span>

                <span className="flex flex-col leading-tight">
                    <span className="font-display font-bold text-base text-foreground">
                        {currentUser.display_name ?? "ศรชล."}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                        ศรชล.
                    </span>
                </span>
            </a>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end leading-tight font-display tabular-nums">
                    <span className="text-sm font-semibold text-foreground">{time}</span>
                    <span className="text-[10.5px] text-muted-foreground">{date}</span>
                </div>

                <button
                    type="button"
                    role="switch"
                    aria-checked={isDark}
                    aria-label={
                        isDark
                            ? "เปลี่ยนเป็นโหมดสว่าง"
                            : "เปลี่ยนเป็นโหมดมืด"
                    }
                    onClick={onToggleTheme}
                    className="relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full border border-border bg-secondary transition-colors"
                >
                    <span
                        className={`absolute top-[1px] left-[1px] flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform ${isDark ? "translate-x-4" : "translate-x-0"
                            }`}
                    >
                        {isDark ? <Moon className="h-2.5 w-2.5" /> : <Sun className="h-2.5 w-2.5" />}
                    </span>
                </button>

                <AddEventButton onClick={onCreateTask} />
            </div>
        </nav>
    );
}

export default Header;
