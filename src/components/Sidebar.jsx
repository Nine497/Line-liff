export default function Sidebar() {

    return (
        <aside
            className="
                w-[320px]
                bg-white
                border-r
                p-4
                flex
                flex-col
                gap-4
            "
        >

            <div>

                <h1 className="text-2xl font-bold">
                    📅 Scheduler
                </h1>

                <p className="text-zinc-500 text-sm">
                    LINE LIFF Calendar
                </p>

            </div>

            <button
                className="
                    bg-black
                    text-white
                    rounded-xl
                    py-3
                    font-medium
                "
            >
                + Add Task
            </button>

            <div
                className="
                    bg-zinc-100
                    rounded-2xl
                    p-4
                "
            >

                <h2 className="font-semibold mb-2">
                    Today
                </h2>

                <div className="space-y-2">

                    <div
                        className="
                            bg-white
                            rounded-xl
                            p-3
                        "
                    >
                        ประชุมทีม
                    </div>

                    <div
                        className="
                            bg-white
                            rounded-xl
                            p-3
                        "
                    >
                        ส่งงานลูกค้า
                    </div>

                </div>

            </div>

        </aside>
    );
}