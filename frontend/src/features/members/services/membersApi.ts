import api from "@/services/api";

export interface WorkspaceMember {
    _id: string;
    organizationId: string;
    role: "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF" | "TENANT" | "MEMBER";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        fullName?: string;
        displayName?: string;
        photo?: string;
        phone?: string;
        status?: string;
    };
}

export interface PendingInvitation {
    _id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    invitedByUserId?: {
        name: string;
        email: string;
    };
}

export async function getMembersApi(orgId: string, search?: string, role?: string) {
    try {
        let url = `/organizations/${orgId}/members`;
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (role) params.append("role", role);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch workspace members" };
    }
}

export async function updateMemberRoleApi(orgId: string, membershipId: string, role: string) {
    try {
        const response = await api.put(`/organizations/${orgId}/members/${membershipId}/role`, { role });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update member role" };
    }
}

export async function updateMemberStatusApi(orgId: string, membershipId: string, status: string) {
    try {
        const response = await api.put(`/organizations/${orgId}/members/${membershipId}/status`, { status });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update member status" };
    }
}

export async function removeMemberApi(orgId: string, membershipId: string) {
    try {
        const response = await api.delete(`/organizations/${orgId}/members/${membershipId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to remove member" };
    }
}

export async function transferOwnershipApi(orgId: string, targetUserId: string) {
    try {
        const response = await api.post(`/organizations/${orgId}/members/transfer-ownership`, { targetUserId });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to transfer ownership" };
    }
}

export async function getPendingInvitationsApi(orgId: string) {
    try {
        const response = await api.get(`/organizations/${orgId}/members/invitations`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch pending invitations" };
    }
}

export async function cancelInvitationApi(orgId: string, invitationId: string) {
    try {
        const response = await api.delete(`/organizations/${orgId}/members/invitations/${invitationId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to cancel invitation" };
    }
}
