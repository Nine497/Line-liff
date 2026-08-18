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

  const loadMyEvents = useCallback(async (userParam, fallbackParticipants = []) => {
    const lineId = typeof userParam === "object" ? userParam?.line_id : userParam;
    const userId = typeof userParam === "object" ? (userParam?.id ?? userParam?.user_id) : null;

    if (!lineId && !userId) return null;

    setIsLoadingMine(true);

    try {
      const cacheKey = `${lineId || ""}_${userId || ""}`;
      const result = await queryClient.fetchQuery({
        queryKey: ["myTasks", cacheKey],
        queryFn: () => fetchMyTasks(lineId, userId),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      });
      let participant = result?.participant ?? null;

      if (!participant && Array.isArray(fallbackParticipants) && fallbackParticipants.length > 0) {
        participant = fallbackParticipants.find((p) => {
          const pLineId = p.line_id ? String(p.line_id) : null;
          const pUserId = p.user_id ? String(p.user_id) : null;
          const pId = p.id ? String(p.id) : null;

          if (lineId && pLineId && pLineId === String(lineId)) return true;
          if (userId && pUserId && pUserId === String(userId)) return true;
          if (lineId && pUserId && pUserId === String(lineId)) return true;
          if (userId && pId && pId === String(userId)) return true;
          return false;
        }) || null;
      }

      setMyParticipant(participant);
      setMyTaskIds(new Set((result?.tasks || []).map((t) => t.id)));
      setHasFetchedMine(true);

      return participant;
    } catch (err) {
      if (err?.status === 401) {
        console.warn("[LIFF] My tasks requires LINE authentication (401)");
        setMyParticipant(null);
        setHasFetchedMine(true);
        return null;
      }
      throw err;
    } finally {
      setIsLoadingMine(false);
    }
  }, [queryClient]);

  // Returns { turnedOn, participant, notReady } so the caller can react to
  // the fetch result (e.g. notify when no participant is linked to this
  // LINE account) without racing React's async state updates.
  const toggleMineOnly = useCallback(
    async (userParam, fallbackParticipants = []) => {
      if (showMineOnly) {
        setShowMineOnly(false);
        return { turnedOn: false, participant: myParticipant };
      }

      const lineId = typeof userParam === "object" ? userParam?.line_id : userParam;
      const userId = typeof userParam === "object" ? (userParam?.id ?? userParam?.user_id) : null;

      if (!lineId && !userId) {
        // currentUser hasn't finished loading yet
        return { turnedOn: false, participant: null, notReady: true };
      }

      const participant = hasFetchedMine ? myParticipant : await loadMyEvents(userParam, fallbackParticipants);

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
