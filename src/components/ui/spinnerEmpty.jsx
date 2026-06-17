import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

import { PulseLoader } from "react-spinners";
import { Button } from "antd";

export function SpinnerEmpty({
    title = "กำลังดำเนินการ",
    description = "กรุณารอสักครู่ อย่าปิดหน้าจอนี้",
    onCancel,
}) {
    return (
        <Empty className="w-full text-white">
            <EmptyHeader className="text-white">
                <EmptyMedia variant="icon">
                    <PulseLoader size={20} color="#ffffff" />
                </EmptyMedia>

                <EmptyTitle className="text-white">
                    {title}
                </EmptyTitle>

                <EmptyDescription className="text-white">
                    {description}
                </EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="text-white border-white/30 hover:bg-white/10"
                >
                    ยกเลิก
                </Button>
            </EmptyContent>
        </Empty>
    );
}