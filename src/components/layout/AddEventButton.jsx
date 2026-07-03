import { Button } from "antd";
import { Plus } from "lucide-react";

// Single source of truth for the "add event" action. Renders as an inline
// pill in the desktop header and as a thumb-reachable floating button on
// mobile/tablet — never both at once (the breakpoints are complementary) —
// so there is exactly one component owning this action instead of two
// independently maintained buttons.
function AddEventButton({ onClick }) {
    return (
        <>
            {/* antd's injected component styles set their own `display` on
                .ant-btn with enough specificity to beat Tailwind's `hidden`
                utility applied directly to the Button — so the responsive
                class goes on a plain wrapper instead. */}
            <span className="hidden xl:inline-flex">
                <Button
                    type="primary"
                    icon={<Plus className="h-3.5 w-3.5" strokeWidth={2.5} />}
                    onClick={onClick}
                >
                    เพิ่มงาน
                </Button>
            </span>

            <button
                type="button"
                onClick={onClick}
                className="xl:hidden fixed bottom-5 right-5 z-40 flex cursor-pointer items-center gap-1.5 rounded-full bg-primary px-5 py-3.5 font-display text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
                <Plus className="h-4 w-4" strokeWidth={2.5} /> เพิ่มงาน
            </button>
        </>
    );
}

export default AddEventButton;
