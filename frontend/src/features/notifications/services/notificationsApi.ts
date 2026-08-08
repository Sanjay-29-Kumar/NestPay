import api from "@/services/api";

export interface WhatsAppTestPayload {
    recipientNumber: string;
    message?: string;
    templateName?: string;
    organizationId?: string;
}

export interface WhatsAppRentReminderPayload {
    organizationId?: string;
    tenantPhone: string;
    tenantName: string;
    rentAmount: number | string;
    unitNumber: string;
    dueDate: string;
    reminderEvent?: string;
}

export async function sendWhatsAppTestApi(payload: WhatsAppTestPayload) {
    try {
        const response = await api.post("/notifications/whatsapp/test", payload);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string; details?: any } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to send WhatsApp test message." };
    }
}

export async function sendWhatsAppRentReminderApi(payload: WhatsAppRentReminderPayload) {
    try {
        const response = await api.post("/notifications/whatsapp/send-rent-reminder", payload);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string; details?: any } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to send WhatsApp rent reminder." };
    }
}

export async function triggerCronRemindersApi() {
    try {
        const response = await api.post("/notifications/whatsapp/trigger-cron-now");
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string; details?: any } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to trigger automated WhatsApp cron job." };
    }
}

