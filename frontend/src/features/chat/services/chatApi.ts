import api from "@/services/api";

export interface ChatAttachment {
    url: string;
    fileName?: string;
    mimeType?: string;
}

export interface ChatMessageItem {
    _id: string;
    unitId: string;
    organizationId: string;
    senderId?: string;
    senderName: string;
    senderRole: "OWNER" | "ADMIN" | "MANAGER" | "TENANT" | "SYSTEM";
    messageType: "TEXT" | "IMAGE" | "SYSTEM";
    text: string;
    attachments: ChatAttachment[];
    readBy: string[];
    createdAt: string;
    updatedAt: string;
}

export async function getUnitMessagesApi(orgId: string, unitId: string) {
    const response = await api.get<{ success: boolean; data: ChatMessageItem[] }>(
        `/organizations/${orgId}/units/${unitId}/chat/messages`
    );
    return response.data;
}

export async function sendChatMessageApi(
    orgId: string,
    unitId: string,
    data: {
        text?: string;
        attachments?: ChatAttachment[];
        messageType?: "TEXT" | "IMAGE" | "SYSTEM";
    }
) {
    const response = await api.post<{ success: boolean; data: ChatMessageItem }>(
        `/organizations/${orgId}/units/${unitId}/chat/messages`,
        data
    );
    return response.data;
}

export async function uploadChatPhotoApi(orgId: string, unitId: string, file: File) {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await api.post<{
        success: boolean;
        message: string;
        data: { url: string; fileName: string; mimeType: string };
    }>(`/organizations/${orgId}/units/${unitId}/chat/upload`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
}

export async function markMessagesReadApi(orgId: string, unitId: string) {
    const response = await api.patch<{ success: boolean; message: string }>(
        `/organizations/${orgId}/units/${unitId}/chat/read`
    );
    return response.data;
}
