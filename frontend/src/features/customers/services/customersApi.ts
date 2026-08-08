import api from "@/services/api";

export interface CustomerItem {
    _id: string;
    organizationId: string;
    propertyId?: {
        _id: string;
        name: string;
        code: string;
    };
    unitId?: {
        _id: string;
        unitNumber: string;
        unitType: string;
        rentAmount: number;
    };
    photo?: string;
    name: string;
    email: string;
    phone: string;
    emergencyContact?: {
        name?: string;
        phone?: string;
        relationship?: string;
    };
    occupation?: string;
    nationality?: string;
    governmentIds?: Array<{
        idType: string;
        idNumber: string;
        documentUrl?: string;
    }>;
    status: "ACTIVE" | "PAST" | "PENDING";
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerStats {
    totalCount: number;
    activeCount: number;
}

export async function getCustomersApi(orgId: string, search?: string, propertyId?: string, unitId?: string, status?: string) {
    try {
        let url = `/organizations/${orgId}/customers`;
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (propertyId) params.append("propertyId", propertyId);
        if (unitId) params.append("unitId", unitId);
        if (status) params.append("status", status);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch customers" };
    }
}

export async function createCustomerApi(orgId: string, data: Partial<CustomerItem>) {
    try {
        const response = await api.post(`/organizations/${orgId}/customers`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to create customer" };
    }
}

export async function assignCustomerUnitApi(orgId: string, customerId: string, propertyId: string, unitId: string) {
    try {
        const response = await api.post(`/organizations/${orgId}/customers/${customerId}/assign-unit`, { propertyId, unitId });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to assign unit" };
    }
}

export async function updateCustomerApi(orgId: string, customerId: string, data: Partial<CustomerItem>) {
    try {
        const response = await api.put(`/organizations/${orgId}/customers/${customerId}`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update customer" };
    }
}

export async function deleteCustomerApi(orgId: string, customerId: string) {
    try {
        const response = await api.delete(`/organizations/${orgId}/customers/${customerId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to delete customer" };
    }
}

export async function getMyResidenceApi(orgId: string) {
    try {
        const response = await api.get(`/organizations/${orgId}/customers/my-residence`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch residence info" };
    }
}
