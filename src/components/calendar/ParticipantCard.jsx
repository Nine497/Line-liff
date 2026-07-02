function ParticipantCard({
    participant,
    busyMap,
}) {
    const events = busyMap.get(participant.id) || [];
    const isBusy = events.length > 0;

    return (
        <div
            className={`flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-sm
      ${isBusy
                    ? "border-l-4 border-l-red-500"
                    : "border-l-4 border-l-emerald-500"
                }`}
        >
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                        {participant.name}
                    </p>

                    <span
                        className={`h-2.5 w-2.5 rounded-full ${isBusy ? "bg-red-500" : "bg-emerald-500"
                            }`}
                    />
                </div>

                {isBusy && (
                    <ul className="mt-2 space-y-1">
                        {events.map((e) => (
                            <li
                                key={e.id}
                                className="flex items-center gap-2 text-xs text-gray-500"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                                {e.title}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${isBusy
                        ? "bg-red-100 text-red-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
            >
                {isBusy ? "ไม่ว่าง" : "ว่าง"}
            </span>
        </div>
    );
}

export default ParticipantCard;