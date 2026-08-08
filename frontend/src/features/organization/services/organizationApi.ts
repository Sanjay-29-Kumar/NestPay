import api from "@/services/api";

export interface Organization {
    _id: string;
    name: string;
    displayName?: string;
    slug: string;
    logo?: string;
    description?: string;
    organizationType?: "APARTMENT" | "RENTAL_PROPERTY" | "BUSINESS" | "SCHOOL" | "COMMUNITY" | "SMALL_ORGANIZATION" | "SERVICE_PROVIDER" | "OTHER";
    registrationNumber?: string;
    gstVat?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    currency?: string;
    timezone?: string;
    language?: string;
    ownerId: string;
    status: string;
    allowTenantRoommateVisibility?: boolean;
    createdAt?: string;
}

export interface Membership {
    _id: string;
    userId: string;
    organizationId: Organization;
    role: "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF" | "TENANT" | "MEMBER";
    status: string;
}

export interface InvitationDetails {
    _id: string;
    organizationId: { _id: string; name: string; slug: string };
    email: string;
    role: "OWNER" | "ADMIN" | "TENANT" | "MEMBER";
    invitedByUserId: { _id: string; name: string; email: string };
    token: string;
    expiresAt: string;
}

export async function createOrganizationApi(name: string, organizationType?: string) {
    try {
        const response = await api.post("/organizations", { name, organizationType });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to create organization" };
    }
}

export async function getOrganizationDetailsApi(orgId: string) {
    try {
        const response = await api.get(`/organizations/${orgId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch organization details" };
    }
}

export async function updateOrganizationApi(orgId: string, data: Partial<Organization>) {
    try {
        const response = await api.put(`/organizations/${orgId}`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update organization details" };
    }
}

export async function getUserMembershipsApi() {
    try {
        const response = await api.get("/organizations/memberships");
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch user memberships" };
    }
}

export async function inviteUserApi(orgId: string, email: string, role: string) {
    try {
        const response = await api.post(`/organizations/${orgId}/invite`, { email, role });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to send invitation" };
    }
}

export async function getInvitePreviewApi(token: string) {
    try {
        const response = await api.get(`/organizations/invitations/preview?token=${encodeURIComponent(token)}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch invitation details" };
    }
}

export async function acceptInviteApi(token: string) {
    try {
        const response = await api.post("/organizations/invitations/accept", { token });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to accept invitation" };
    }
}
