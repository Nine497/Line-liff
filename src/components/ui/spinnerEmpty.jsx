import { Empty, Button } from "antd";
import { PulseLoader } from "react-spinners";

export function SpinnerEmpty({
    title = "กำลังดำเนินการ",
    description = "กรุณารอสักครู่ อย่าปิดหน้าจอนี้",
    onCancel,
}) {
    return (
        <div className="flex flex-col items-center justify-center text-white">
            <Empty
                description={false}
                image={null}
            >
                <div className="flex flex-col items-center gap-3">
                    <PulseLoader size={12} color="#ffffff" />

                    <div className="text-center">
                        <p className="text-lg font-semibold">{title}</p>
                        <p className="text-sm text-white/70">{description}</p>
                    </div>

                    {onCancel && (
                        <Button
                            onClick={onCancel}
                            type="default"
                            className="border-white/30 text-white hover:bg-white/10"
                        >
                            ยกเลิก
                        </Button>
                    )}
                </div>
            </Empty>
        </div>
    );
}