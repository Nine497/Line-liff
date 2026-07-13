
import { useEffect} from "react";
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
  useEffect(() => {
    const initApp = async () => {
      try {
        // TEMP-DEV-STUB: bypass LIFF/auth for local UI testing only.
        setCurrentUser({ id: 1, line_id: "test", name: "Tester" });
        setParticipants([{ id: 1, name: "สมชาย ใจดี" }, { id: 2, name: "สมหญิง รักงาน" }]);
        setTaskTypes([{ id: 1, name: "ประชุม" }]);
        await fetchTaskEvents();
        return;
        // eslint-disable-next-line no-unreachable
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
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
    // Intentionally mount-only: LIFF login/init must run exactly once.
    // The setters are stable, and fetchTaskEvents is memoized via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};