import api from "@/services/api";

export interface InitiatePaymentParams {
    orgId: string;
    unitId: string;
    amount: number;
    billingMonth?: string;
}

export interface VerifyPaymentParams {
    orgId: string;
    orderId: string;
    paymentId: string;
    signature: string;
}

export interface MarkManualParams {
    orgId: string;
    unitId: string;
    tenantId?: string;
    amount: number;
    billingMonth?: string;
    manualPaymentType: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
    manualNote?: string;
    paidDate?: string;
}

/**
 * Tenant initiates Razorpay Order
 */
export async function initiateRazorpayOrderApi(params: InitiatePaymentParams) {
    const response = await api.post("/payments/initiate", params);
    return response.data;
}

/**
 * Tenant verifies Razorpay signature after checkout
 */
export async function verifyRazorpayPaymentApi(params: VerifyPaymentParams) {
    const response = await api.post("/payments/verify", params);
    return response.data;
}

/**
 * Owner / Admin marks payment manually
 */
export async function markManualPaymentApi(params: MarkManualParams) {
    const response = await api.post("/payments/manual-mark", params);
    return response.data;
}

/**
 * Owner / Admin undoes manual payment
 */
export async function undoManualPaymentApi(paymentId: string, orgId: string) {
    const response = await api.post("/payments/manual-undo", { paymentId, orgId });
    return response.data;
}

/**
 * Get payment history for organization / unit
 */
export async function getPaymentHistoryApi(orgId: string, unitId?: string) {
    const query = unitId ? `?unitId=${unitId}` : "";
    const response = await api.get(`/payments/history${query}`, {
        params: { orgId },
    });
    return response.data;
}

/**
 * Update Owner Razorpay credentials
 */
export async function updateOwnerRazorpayConfigApi(orgId: string, keyId: string, keySecret: string) {
    const response = await api.post(`/payments/config`, { orgId, keyId, keySecret });
    return response.data;
}
