import api from "@/services/api";

export interface FamilyRequestData {
    _id: string;
    organizationId: string;
    unitId: {
        _id: string;
        unitNumber: string;
        blockWing?: string;
    };
    familyHeadUserId: {
        _id: string;
        name: string;
        email: string;
        phone: string;
    };
    name: string;
    email: string;
    phone: string;
    relationship: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason?: string;
    createdAt: string;
}

export async function createFamilyRequestApi(
    orgId: string,
    payload: { unitId?: string; name: string; email: string; phone: string; relationship: string }
) {
    try {
        const response = await api.post(`/organizations/${orgId}/customers/family-requests`, payload);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to submit request." };
    }
}

export async function getFamilyRequestsApi(orgId: string) {
    try {
        const response = await api.get(`/organizations/${orgId}/customers/family-requests`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to fetch requests." };
    }
}

export async function approveFamilyRequestApi(orgId: string, requestId: string) {
    try {
        const response = await api.post(`/organizations/${orgId}/customers/family-requests/${requestId}/approve`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to approve request." };
    }
}

export async function rejectFamilyRequestApi(orgId: string, requestId: string, reason?: string) {
    try {
        const response = await api.post(`/organizations/${orgId}/customers/family-requests/${requestId}/reject`, { reason });
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to reject request." };
    }
}

export async function getUsersGroupedByUnitApi(orgId: string) {
    try {
        const response = await api.get(`/organizations/${orgId}/customers/grouped-by-unit`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Failed to fetch grouped users." };
    }
}
