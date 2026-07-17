import { useMemo } from "react";
import EventCard from "./EventCard";
import ParticipantCard from "./ParticipantCard";
import TabCount from "./TabCount";

export function useSidebarTabItems({
  selectedEvents,
  availableParticipants,
  busyParticipants,
  busyMap,
  isFiltered,
}) {
  return useMemo(() => [
    {
      key: "events",
      label: (
        <span className="px-3 inline-flex items-center gap-1.5">
          กำหนดการ
          <TabCount count={selectedEvents.length} tone="primary" />
        </span>
      ),
      children: selectedEvents.length > 0 ? (
        <div className="h-full min-w-0 space-y-3 overflow-x-hidden overflow-y-auto pr-1">
          {selectedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {isFiltered ? "ไม่มีกำหนดการที่ตรงกับตัวกรองในวันนี้" : "ยังไม่มีกำหนดการในวันนี้"}
          </p>
        </div>
      ),
    },
    {
      key: "available",
      label: (
        <span className="px-3 inline-flex items-center gap-1.5">
          ว่าง
          <TabCount count={availableParticipants.length} tone="success" />
        </span>
      ),
      children: availableParticipants.length > 0 ? (
        <div className="h-full min-w-0 space-y-3 overflow-x-hidden overflow-y-auto pr-1">
          {availableParticipants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              busyMap={busyMap}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {isFiltered ? "ไม่มีผู้ที่ว่างตรงกับตัวกรองในวันนี้" : "ไม่มีผู้ที่ว่างในวันนี้"}
          </p>
        </div>
      ),
    },
    {
      key: "busy",
      label: (
        <span className="px-3 inline-flex items-center gap-1.5">
          ไม่ว่าง
          <TabCount count={busyParticipants.length} tone="destructive" />
        </span>
      ),
      children: busyParticipants.length > 0 ? (
        <div className="h-full min-w-0 space-y-3 overflow-x-hidden overflow-y-auto pr-1">
          {busyParticipants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              busyMap={busyMap}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border-strong bg-muted/40 p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            {isFiltered ? "ไม่มีผู้ที่ไม่ว่างตรงกับตัวกรองในวันนี้" : "ไม่มีผู้ที่ไม่ว่างในวันนี้"}
          </p>
        </div>
      ),
    },
  ], [selectedEvents, availableParticipants, busyParticipants, busyMap, isFiltered]);
}
