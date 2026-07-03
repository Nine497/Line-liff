import { useCallback, useState } from "react";
import { fetchMyTasks } from "../api/tasks";

// Drives the "My Events" filter: resolves the participant linked to the
// current LIFF line_id via the backend, then exposes the set of task ids
// that belong to them so the rest of the app can filter its already-loaded
// events by membership instead of holding a second, parallel dataset.
export function useMyEvents() {
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [myParticipant, setMyParticipant] = useState(null);
  const [myTaskIds, setMyTaskIds] = useState(() => new Set());
  const [isLoadingMine, setIsLoadingMine] = useState(false);
  const [hasFetchedMine, setHasFetchedMine] = useState(false);

  const loadMyEvents = useCallback(async (lineId) => {
    if (!lineId) return null;

    setIsLoadingMine(true);

    try {
      const result = await fetchMyTasks(lineId);
      const participant = result?.participant ?? null;

      setMyParticipant(participant);
      setMyTaskIds(new Set((result?.tasks || []).map((t) => t.id)));
      setHasFetchedMine(true);

      return participant;
    } finally {
      setIsLoadingMine(false);
    }
  }, []);

  // Returns { turnedOn, participant } so the caller can react to the fetch
  // result (e.g. notify when no participant is linked to this LINE account)
  // without racing React's async state updates.
  const toggleMineOnly = useCallback(
    async (lineId) => {
      if (showMineOnly) {
        setShowMineOnly(false);
        return { turnedOn: false, participant: myParticipant };
      }

      const participant = hasFetchedMine ? myParticipant : await loadMyEvents(lineId);

      setShowMineOnly(true);
      return { turnedOn: true, participant };
    },
    [showMineOnly, hasFetchedMine, myParticipant, loadMyEvents]
  );

  return {
    showMineOnly,
    myParticipant,
    myTaskIds,
    isLoadingMine,
    hasFetchedMine,
    toggleMineOnly,
    reloadMyEvents: loadMyEvents,
  };
}
