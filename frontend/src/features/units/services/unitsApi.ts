import api from "@/services/api";

export interface UnitData {
    _id: string;
    organizationId: string;
    propertyId?: string;
    unitNumber: string;
    blockWing?: string;
    roomType?: string;
    unitType?: string;
    floor?: string;
    areaSqFt?: number;
    bedrooms?: number;
    bathrooms?: number;
    maxCapacity?: number;
    sharingType?: string;
    occupancyType?: string;
    rentAmount: number;
    depositAmount?: number;
    maintenanceCharge?: number;
    furnishingStatus?: string;
    amenities?: string[];
    photos?: string[];
    notes?: string;
    status: "VACANT" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
    createdAt?: string;
    updatedAt?: string;
}

export interface UnitApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export async function getUnitsApi(orgId: string): Promise<UnitApiResponse<{ units: UnitData[]; stats?: any }>> {
    try {
        const response = await api.get<UnitApiResponse<{ units: UnitData[]; stats?: any }>>(
            `/organizations/${orgId}/units`
        );
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: UnitApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch units." };
    }
}

export async function getUnitByIdApi(orgId: string, unitId: string): Promise<UnitApiResponse<UnitData>> {
    try {
        const response = await api.get<UnitApiResponse<UnitData>>(`/organizations/${orgId}/units/${unitId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: UnitApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch unit details." };
    }
}

export async function createUnitApi(orgId: string, payload: Partial<UnitData>): Promise<UnitApiResponse<UnitData>> {
    try {
        const response = await api.post<UnitApiResponse<UnitData>>(`/organizations/${orgId}/units`, payload);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: UnitApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to create unit." };
    }
}

export async function updateUnitApi(
    orgId: string,
    unitId: string,
    payload: Partial<UnitData>
): Promise<UnitApiResponse<UnitData>> {
    try {
        const response = await api.put<UnitApiResponse<UnitData>>(`/organizations/${orgId}/units/${unitId}`, payload);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: UnitApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update unit." };
    }
}

export async function addUserToUnitApi(
    orgId: string,
    unitId: string,
    payload: { name: string; email: string; phone: string; occupancyType: "Single" | "Family Head" | "Sharing" }
): Promise<UnitApiResponse> {
    try {
        const response = await api.post<UnitApiResponse>(`/organizations/${orgId}/customers/units/${unitId}/add-user`, payload);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: UnitApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to add user to unit." };
    }
}

export async function removeUserFromUnitApi(
    orgId: string,
    unitId: string,
    userIdentifier: string
): Promise<UnitApiResponse> {
    try {
        const response = await api.delete<UnitApiResponse>(
            `/organizations/${orgId}/units/${unitId}/users/${encodeURIComponent(userIdentifier)}`
        );
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: UnitApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to remove user from unit." };
    }
}

