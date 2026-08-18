import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotificationSettings, updateNotificationSettings } from "../api/notifications";

export function useNotificationSettings() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["notificationSettings"],
        queryFn: async () => {
            const data = await getNotificationSettings();
            return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const mutation = useMutation({
        mutationFn: updateNotificationSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notificationSettings"] });
        },
    });

    return {
        settings: query.data,
        isLoading: query.isLoading,
        error: query.error,
        updateSettings: mutation.mutateAsync,
        isSaving: mutation.isPending,
    };
}
