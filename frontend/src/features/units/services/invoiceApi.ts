import api from "@/services/api";

export interface ReminderScheduleData {
    _id?: string;
    organizationId: string;
    unitId: string;
    primaryTenantDays: number[];
    allTenantsDays: number[];
    isCustom: boolean;
}

export interface InvoiceData {
    _id: string;
    organizationId: string;
    propertyId: string;
    unitId: string;
    billingPeriod: string;
    dueDate: string;
    defaultRentAmount: number;
    overrideAmount?: number;
    totalAmount: number;
    status: "UNPAID" | "PAID" | "OVERDUE" | "PARTIALLY_PAID";
    isEstablished?: boolean;
    paidAt?: string;
    paymentMode?: string;
    notes?: string;
}

export interface ReminderLogData {
    _id: string;
    sentAt: string;
    channels: string[];
    recipients: Array<{ name: string; phone: string; email: string; role?: string }>;
    dayRule: string;
    messageType: string;
    amount: number;
    dueDate: string;
    status: "SUCCESS" | "FAILED" | "PARTIAL";
    details?: string;
}

export interface PaymentConfirmationLogData {
    _id: string;
    sentAt: string;
    channels: string[];
    recipients: Array<{ name: string; phone: string; email: string; role?: string }>;
    amount: number;
    paymentMode: string;
    status: "SUCCESS" | "FAILED" | "PARTIAL";
    details?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export async function getReminderScheduleApi(orgId: string, unitId: string): Promise<ApiResponse<ReminderScheduleData>> {
    try {
        const response = await api.get<ApiResponse<ReminderScheduleData>>(`/organizations/${orgId}/units/${unitId}/invoice/settings`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to fetch reminder schedule settings." };
    }
}

export async function updateReminderScheduleApi(
    orgId: string,
    unitId: string,
    payload: { primaryTenantDays: number[]; allTenantsDays: number[] }
): Promise<ApiResponse<ReminderScheduleData>> {
    try {
        const response = await api.put<ApiResponse<ReminderScheduleData>>(`/organizations/${orgId}/units/${unitId}/invoice/settings`, payload);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to update reminder schedule." };
    }
}

export async function getCurrentInvoiceApi(orgId: string, unitId: string): Promise<ApiResponse<{ invoice: InvoiceData; schedule: ReminderScheduleData }>> {
    try {
        const response = await api.get<ApiResponse<{ invoice: InvoiceData; schedule: ReminderScheduleData }>>(`/organizations/${orgId}/units/${unitId}/invoice/current`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to fetch current invoice." };
    }
}

export async function updateInvoiceAmountApi(
    orgId: string,
    unitId: string,
    payload: { overrideAmount?: number; notes?: string }
): Promise<ApiResponse<InvoiceData>> {
    try {
        const response = await api.put<ApiResponse<InvoiceData>>(`/organizations/${orgId}/units/${unitId}/invoice/amount`, payload);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to update invoice amount." };
    }
}

export async function establishBillApi(
    orgId: string,
    unitId: string,
    payload: {
        utilitiesAmount?: number;
        totalAmount?: number;
        notes?: string;
        dueDate?: string;
        billingPeriod?: string;
    }
): Promise<ApiResponse<InvoiceData>> {
    try {
        const response = await api.post<ApiResponse<InvoiceData>>(`/organizations/${orgId}/units/${unitId}/invoice/establish-bill`, payload);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to establish bill & issue demand." };
    }
}

export async function issuePaymentDemandApi(orgId: string, unitId: string): Promise<ApiResponse> {
    try {
        const response = await api.post<ApiResponse>(`/organizations/${orgId}/units/${unitId}/invoice/issue-payment`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to issue payment demand." };
    }
}

export async function markInvoicePaidApi(
    orgId: string,
    unitId: string,
    payload: { amount?: number; paymentMode: string; notes?: string }
): Promise<ApiResponse> {
    try {
        const response = await api.post<ApiResponse>(`/organizations/${orgId}/units/${unitId}/invoice/mark-paid`, payload);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to mark invoice as paid." };
    }
}

export async function getReminderLogsApi(orgId: string, unitId: string): Promise<ApiResponse<ReminderLogData[]>> {
    try {
        const response = await api.get<ApiResponse<ReminderLogData[]>>(`/organizations/${orgId}/units/${unitId}/invoice/reminder-logs`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to fetch reminder logs." };
    }
}

export async function getConfirmationLogsApi(orgId: string, unitId: string): Promise<ApiResponse<PaymentConfirmationLogData[]>> {
    try {
        const response = await api.get<ApiResponse<PaymentConfirmationLogData[]>>(`/organizations/${orgId}/units/${unitId}/invoice/confirmation-logs`);
        return response.data;
    } catch (error: any) {
        return { success: false, message: error?.response?.data?.message || "Failed to fetch confirmation logs." };
    }
}
