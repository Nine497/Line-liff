import { useState } from "react";
import { message, notification } from "antd";
import { createTask } from "../api/tasks";

export function useCreateTask(fetchTaskEvents) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTask = async (payload, { onSuccess } = {}) => {
    try {
      setIsSubmitting(true);

      await createTask(payload);

      message.success("เพิ่มงานสำเร็จ");

      onSuccess?.();

      await fetchTaskEvents();
    } catch (error) {
      console.error(error);

      if (error.status === 409) {
        notification.warning({
          message: "ไม่สามารถสร้างงานได้",
          description: (
            <div>
              {error.data?.conflicts?.map((c, i) => (
                <div key={i}>
                  • {c.participant_name} ติดงาน "{c.task_title}"
                </div>
              ))}
            </div>
          ),
        });
        return;
      }

      message.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleCreateTask,
  };
}
