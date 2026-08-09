import api from '@/services/api';

export interface RentItem {
  _id: string;
  organizationId: string;
  propertyId: { _id: string; name: string; address?: any };
  unitId: { _id: string; unitNumber: string; floor?: number };
  tenantId: { _id: string; name: string; email: string; phone?: string };
  billingPeriod: string;
  baseAmount: number;
  previousOutstandingAmount: number;
  totalPayableAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  dueDate: string;
  adjustmentNotes?: string;
  isCarryForwardApproved?: boolean;
  createdAt: string;
}

export interface PaymentTransactionItem {
  _id: string;
  organizationId: string;
  propertyId?: { _id: string; name: string };
  unitId?: { _id: string; unitNumber: string };
  tenantId?: { _id: string; name: string; email: string };
  rentId?: { _id: string; billingPeriod: string; baseAmount: number; totalPayableAmount: number };
  amount: number;
  currency: string;
  paymentProvider: string;
  providerOrderId: string;
  providerPaymentId?: string;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
  receiptNo: string;
  notes?: string;
  createdAt: string;
}

export async function fetchRentsApi(orgId: string, params?: { tenantId?: string; unitId?: string; status?: string }) {
  const response = await api.get(`/organizations/${orgId}/payments/rents`, { params });
  return response.data;
}

export async function createRentApi(orgId: string, data: {
  propertyId: string;
  unitId: string;
  tenantId: string;
  billingPeriod: string;
  baseAmount: number;
  dueDate: string;
  adjustmentNotes?: string;
}) {
  const response = await api.post(`/organizations/${orgId}/payments/rents`, data);
  return response.data;
}

export async function carryForwardRentApi(orgId: string, data: {
  rentId: string;
  nextBillingPeriod: string;
  dueDate: string;
}) {
  const response = await api.post(`/organizations/${orgId}/payments/rents/carry-forward`, data);
  return response.data;
}

export async function initiatePaymentOrderApi(data: { rentId: string; payAmount: number }) {
  const response = await api.post(`/payments/initiate`, data);
  return response.data;
}

export async function verifyPaymentSignatureApi(data: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const response = await api.post(`/payments/verify`, data);
  return response.data;
}

export async function fetchPaymentHistoryApi(orgId: string, params?: { tenantId?: string; rentId?: string }) {
  const response = await api.get(`/organizations/${orgId}/payments/history`, { params });
  return response.data;
}
