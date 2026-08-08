import api from "@/services/api";

export interface DocumentItem {
    _id: string;
    organizationId: string;
    title: string;
    documentType:
        | "RENTAL_AGREEMENT"
        | "PAN"
        | "AADHAAR"
        | "PASSPORT"
        | "DRIVING_LICENSE"
        | "INSURANCE"
        | "PROPERTY_DOCUMENT"
        | "OTHER";
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
    relatedPropertyId?: { _id: string; name: string; code: string };
    relatedUnitId?: { _id: string; unitNumber: string };
    relatedCustomerId?: { _id: string; name: string; email: string };
    uploadedByUserId?: { _id: string; name: string; email: string };
    createdAt?: string;
}

export async function getDocumentsApi(orgId: string, search?: string, type?: string) {
    try {
        let url = `/organizations/${orgId}/documents`;
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (type) params.append("type", type);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await api.get(url);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to fetch documents" };
    }
}

export async function createDocumentApi(orgId: string, data: Partial<DocumentItem>) {
    try {
        const response = await api.post(`/organizations/${orgId}/documents`, data);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to upload document" };
    }
}

export async function deleteDocumentApi(orgId: string, docId: string) {
    try {
        const response = await api.delete(`/organizations/${orgId}/documents/${docId}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: { success: boolean; message: string } } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to delete document" };
    }
}
