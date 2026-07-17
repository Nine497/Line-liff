import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const loadMyEvents = useCallback(async (lineId) => {
    if (!lineId) return null;

    setIsLoadingMine(true);

    try {
      const result = await queryClient.fetchQuery({
        queryKey: ["myTasks", lineId],
        queryFn: () => fetchMyTasks(lineId),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      });
      const participant = result?.participant ?? null;

      setMyParticipant(participant);
      setMyTaskIds(new Set((result?.tasks || []).map((t) => t.id)));
      setHasFetchedMine(true);

      return participant;
    } finally {
      setIsLoadingMine(false);
    }
  }, [queryClient]);

  // Returns { turnedOn, participant, notReady } so the caller can react to
  // the fetch result (e.g. notify when no participant is linked to this
  // LINE account) without racing React's async state updates.
  const toggleMineOnly = useCallback(
    async (lineId) => {
      if (showMineOnly) {
        setShowMineOnly(false);
        return { turnedOn: false, participant: myParticipant };
      }

      if (!lineId) {
        // currentUser hasn't finished loading yet — distinct from a
        // genuinely unlinked LINE account, so the caller must not show
        // the "account not linked, contact admin" message for this case.
        return { turnedOn: false, participant: null, notReady: true };
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
    reloadMyEvents: (lineId) => {
      queryClient.invalidateQueries({ queryKey: ["myTasks", lineId] });
      return loadMyEvents(lineId);
    },
  };
}
