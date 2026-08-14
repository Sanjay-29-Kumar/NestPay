import api from "@/services/api";
import type { Membership, CreateOrgInput, NotificationItem } from "../types/organization.types";

export async function getUserMembershipsApi() {
    const response = await api.get<{ success: boolean; data: Membership[] }>("/organizations/memberships");
    return response.data;
}

export async function createOrganizationApi(data: CreateOrgInput) {
    const response = await api.post<{
        success: boolean;
        message: string;
        data: { organization: any; membership: Membership };
    }>("/organizations", data);
    return response.data;
}

export async function updateUserProfileApi(data: {
    fullName?: string;
    phone?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}) {
    const response = await api.put<{ success: boolean; message: string; data: any }>("/auth/profile", data);
    return response.data;
}

export async function getNotificationsApi() {
    const response = await api.get<{ success: boolean; data: NotificationItem[] }>("/notifications");
    return response.data;
}

export async function acceptInvitationApi(token: string) {
    const response = await api.post<{ success: boolean; message: string }>("/organizations/invitations/accept", { token });
    return response.data;
}
