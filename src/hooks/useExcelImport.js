import { useState } from "react";
import { message } from "antd";
import { importTasks } from "../api/tasks";

export function useExcelImport(fetchTaskEvents) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (file, userId) => {
    if (!file) return;

    setIsUploading(true);

    try {
      const result = await importTasks(file, userId);

      await fetchTaskEvents();

      message.success(`นำเข้าสำเร็จ ${result.count} รายการ`);
    } catch (err) {
      message.error(err.message || "เกิดข้อผิดพลาดในการนำเข้าไฟล์");
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    handleUpload,
  };
}
