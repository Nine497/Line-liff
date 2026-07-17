
import { useCallback, useEffect, useState } from "react";
import { initLiff } from "../liff";
import { authUser } from "../services/authService";
import { loadInitialData } from "../services/initDataService";

export const useInitApp = ({
  setCurrentUser,
  fetchTaskEvents,
  setIsInitializing,
  setParticipants,
  setTaskTypes,
}) => {
  const [initError, setInitError] = useState(null);

  const runInit = useCallback(async () => {
    try {
      const liff = await initLiff();
      if (!liff) return;

      const user = await authUser(liff);
      if (!user) return;

      setCurrentUser(user);

      const data = await loadInitialData();

      // ✅ ถูกต้องแล้ว
      setParticipants(data.participants || []);
      setTaskTypes(data.types || []);

      await fetchTaskEvents();

    } catch (error) {
      console.error("LIFF init failed:", error);
      setInitError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsInitializing(false);
    }
    // Setters are stable, and fetchTaskEvents is memoized via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Intentionally mount-only: LIFF login/init must run exactly once.
    // runInit is shared with retryInit (a plain event handler), so the
    // setState calls inside it are safe despite the static lint warning.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runInit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryInit = useCallback(() => {
    setIsInitializing(true);
    setInitError(null);
    runInit();
  }, [runInit, setIsInitializing]);

  return { initError, retryInit };
};