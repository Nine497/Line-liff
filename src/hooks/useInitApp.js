
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
      let user = null;

      const liff = await initLiff();
      if (liff && liff.isLoggedIn?.()) {
        user = await authUser(liff);
      }

      if (!user) {
        setInitError("กรุณาล็อกอินเข้าสู่ระบบก่อนใช้งาน");
        return;
      }

      setCurrentUser(user);

      const data = await loadInitialData();

      setParticipants(data.participants || []);
      setTaskTypes(data.types || []);

      await fetchTaskEvents();

    } catch (error) {
      console.error("LIFF init failed:", error);
      setInitError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    runInit();
  }, [runInit]);

  const retryInit = useCallback(() => {
    setIsInitializing(true);
    setInitError(null);
    runInit();
  }, [runInit, setIsInitializing]);

  return { initError, retryInit };
};
