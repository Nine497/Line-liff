
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