import api from "@/services/api";

export interface UnitItem {
    _id: string;
    organizationId: string;
    propertyId: {
        _id: string;
        name: string;
        code: string;
        propertyType?: string;
    };
    unitNumber: string;
    unitType:
        | "FLAT"
        | "ROOM"
        | "SHOP"
        | "OFFICE"
        | "SUITE"
        | "VILLA"
        | "BLOCK"
        | "FLOOR"
        | "ONE_RK"
        | "ONE_BHK"
        | "TWO_BHK"
        | "THREE_BHK"
        | "SHARED_ROOM"
        | "BED_SPACE"
        | "LINE_UNIT";
    floor?: string;
    areaSqFt?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxCapacity?: number;
    sharingType?: "PRIVATE" | "DOUBLE_SHARING" | "TRIPLE_SHARING" | "MULTI_SHARING";
    rentAmount: number;
    depositAmount?: number;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
    createdAt?: string;
    updatedAt?: string;
}

export interface UnitStats {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    maintenanceUnits: number;
}

export async function getUnitsApi(orgId: string, propertyId?: string, status?: string, search?: string) {
    try {
        let url = `/organizations/${orgId}/units`;
        const params = new URLSearchParams();
        if (propertyId) params.append("propertyId", propertyId);
        if (status) params.append("status", status);
        if (search) params.append("search", search);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch units" };
    }
}

export async function createUnitApi(orgId: string, data: Partial<UnitItem>) {
    try {
        const response = await api.post(`/organizations/${orgId}/units`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to create unit" };
    }
}

export async function updateUnitApi(orgId: string, unitId: string, data: Partial<UnitItem>) {
    try {
        const response = await api.put(`/organizations/${orgId}/units/${unitId}`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update unit" };
    }
}

export async function deleteUnitApi(orgId: string, unitId: string) {
    try {
        const response = await api.delete(`/organizations/${orgId}/units/${unitId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to delete unit" };
    }
}

export async function assignUserToUnitApi(orgId: string, unitId: string, tenantData: { name: string; email: string; phone: string }) {
    try {
        const response = await api.post(`/organizations/${orgId}/units/${unitId}/assign-user`, tenantData);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to assign user to unit" };
    }
}

