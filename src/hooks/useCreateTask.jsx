import { App } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "../api/tasks";

export function useCreateTask(fetchTaskEvents) {
  const { message, notification } = App.useApp();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      message.success("เพิ่มงานสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (fetchTaskEvents) {
        fetchTaskEvents();
      }
    },
    onError: (error) => {
      console.error(error);

      if (error.status === 409) {
        notification.warning({
          message: "ไม่สามารถสร้างงานได้",
          description: (
            <div>
              {error.extra?.map((c, i) => (
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
    },
  });

  const handleCreateTask = (payload, { onSuccess } = {}) => {
    mutation.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return {
    isSubmitting: mutation.isPending,
    handleCreateTask,
  };
}
