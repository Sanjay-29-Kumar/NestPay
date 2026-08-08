import api from "@/services/api";

export interface PropertyItem {
    _id: string;
    organizationId: string;
    name: string;
    code: string;
    propertyType:
        | "APARTMENT"
        | "BUILDING"
        | "VILLA"
        | "HOUSE"
        | "COMMERCIAL"
        | "WAREHOUSE"
        | "OFFICE"
        | "LAND"
        | "LINE_HOUSE"
        | "ROW_HOUSE"
        | "CHAWL"
        | "PG_HOSTEL"
        | "CO_LIVING";
    description?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    geoLocation?: {
        latitude?: number;
        longitude?: number;
    };
    images?: string[];
    documents?: string[];
    status: "ACTIVE" | "INACTIVE" | "UNDER_MAINTENANCE";
    createdAt?: string;
    updatedAt?: string;
}

export interface PropertyStats {
    totalCount: number;
    activeCount: number;
    maintenanceCount: number;
}

export async function getPropertiesApi(orgId: string, search?: string, type?: string, status?: string) {
    try {
        let url = `/organizations/${orgId}/properties`;
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (status) params.append("status", status);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch properties" };
    }
}

export async function createPropertyApi(orgId: string, data: Partial<PropertyItem>) {
    try {
        const response = await api.post(`/organizations/${orgId}/properties`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to create property" };
    }
}

export async function updatePropertyApi(orgId: string, propertyId: string, data: Partial<PropertyItem>) {
    try {
        const response = await api.put(`/organizations/${orgId}/properties/${propertyId}`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update property" };
    }
}

export async function deletePropertyApi(orgId: string, propertyId: string) {
    try {
        const response = await api.delete(`/organizations/${orgId}/properties/${propertyId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to delete property" };
    }
}
