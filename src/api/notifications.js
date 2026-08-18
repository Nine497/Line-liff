import { apiClient } from "./apiClient";

export async function getNotificationSettings() {
    return await apiClient("/notification_settings"); // Based on liff_api base path assumption, wait, the apiClient probably goes to /api/liff ? Let's check apiClient.
}

export async function updateNotificationSettings(payload) {
    return await apiClient("/notification_settings", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}
