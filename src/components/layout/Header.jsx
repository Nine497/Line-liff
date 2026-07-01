import { Button } from "antd";
import { Moon, Sun } from "lucide-react";
import { PlusOutlined } from "@ant-design/icons";

function Header({
    currentUser,
    isDark,
    onToggleTheme,
    onCreateTask,
}) {
    return (
        <nav className="flex items-center justify-between gap-3 pb-4">
            <a
                className="flex items-center gap-3 font-semibold"
                href="#calendarjs"
            >
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

                <span>
                    {currentUser.display_name ?? "ศรชล. Scheduler"}
                </span>
            </a>

            <div className="flex items-center gap-2">
                <Button
                    aria-label={
                        isDark
                            ? "เปลี่ยนเป็นโหมดสว่าง"
                            : "เปลี่ยนเป็นโหมดมืด"
                    }
                    onClick={onToggleTheme}
                    size="icon"
                    type="button"
                    variant="outline"
                    disabled
                >
                    {isDark ? <Sun /> : <Moon />}
                </Button>

                <Button
                    type="primary"
                    size="sm"
                    icon={<PlusOutlined />}
                    onClick={onCreateTask}
                >
                    เพิ่มงาน
                </Button>
            </div>
        </nav>
    );
}

export default Header;