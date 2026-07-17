import { BarLoader } from "react-spinners";

function InitialLoading({ open, currentUser }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-md">
            <div className="flex min-w-[320px] flex-col items-center gap-4 rounded-2xl border border-border bg-card/95 p-7 text-center shadow-2xl">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {currentUser.picture_url ? (
                        <img
                            src={currentUser.picture_url}
                            alt={currentUser.display_name ?? "ผู้ใช้งานปัจจุบัน"}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="font-display text-3xl font-semibold text-primary">
                            {currentUser.display_name?.[0] ?? "ศ"}
                        </span>
                    )}
                </div>

                <div className="flex w-full flex-col items-center gap-5">
                    <BarLoader
                        width={150}
                        height={3}
                        color="#0B3D6B"
                    />

                    <p className="font-display text-lg font-semibold">
                        กำลังโหลดข้อมูล... กรุณารอสักครู่
                    </p>
                </div>
            </div>
        </div>
    );
}

export default InitialLoading;