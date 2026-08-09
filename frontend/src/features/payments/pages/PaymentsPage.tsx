import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import MainLayout from '@/components/layout/MainLayout';
import type { RentItem, PaymentTransactionItem } from '../services/paymentsApi';
import { fetchRentsApi, fetchPaymentHistoryApi } from '../services/paymentsApi';

import { PayRentModal } from '../components/PayRentModal';
import { CreateRentModal } from '../components/CreateRentModal';
import { CarryForwardModal } from '../components/CarryForwardModal';
import { ReceiptModal } from '../components/ReceiptModal';

export function PaymentsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeMembership } = useSelector((state: RootState) => state.organization);

  const orgId = activeMembership?.organizationId?._id;
  const userRole = activeMembership?.role || 'MEMBER';
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';

  const [rents, setRents] = useState<RentItem[]>([]);
  const [history, setHistory] = useState<PaymentTransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Modals state
  const [selectedPayRent, setSelectedPayRent] = useState<RentItem | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [selectedCarryRent, setSelectedCarryRent] = useState<RentItem | null>(null);
  const [isCarryModalOpen, setIsCarryModalOpen] = useState<boolean>(false);

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransactionItem | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);


  useEffect(() => {
    if (orgId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const rentFilter = isOwnerOrAdmin ? {} : { tenantId: user?._id };
      const [rentsRes, historyRes] = await Promise.all([
        fetchRentsApi(orgId!, rentFilter),
        fetchPaymentHistoryApi(orgId!, rentFilter),
      ]);

      const rawRents = rentsRes.rents || rentsRes.data?.rents || rentsRes.data;
      setRents(Array.isArray(rawRents) ? rawRents : []);

      const rawHistory = historyRes.history || historyRes.data?.history || historyRes.data;
      setHistory(Array.isArray(rawHistory) ? rawHistory : []);
    } catch (err: any) {
      console.error('Error loading payments data:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load rent and payment records.');
      setRents([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }

  };

  // Compute stats
  const totalExpected = rents.reduce((acc, r) => acc + r.totalPayableAmount, 0);
  const totalPaid = rents.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalOutstanding = rents.reduce((acc, r) => acc + r.outstandingAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>PAID</span>;
      case 'PARTIALLY_PAID':
        return <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.75rem' }}>PARTIALLY PAID</span>;
      case 'UNPAID':
      default:
        return <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.75rem' }}>UNPAID</span>;
    }
  };

  return (
    <MainLayout>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Rent Collection & Payments
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
              Razorpay Multi-Tenant Rent Management System
            </p>
          </div>

          {isOwnerOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              + Issue Rent Obligation
            </button>
          )}
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL EXPECTED RENT</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              ₹{totalExpected.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL COLLECTED</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>OUTSTANDING BALANCE</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Rents Obligations Section */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            {isOwnerOrAdmin ? 'Organization Rent Records' : 'My Rent Obligations'}
          </h2>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading rent records...</div>
          ) : rents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No rent records found for this organization.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>Billing Period</th>
                    <th style={{ padding: '12px' }}>Property / Unit</th>
                    {isOwnerOrAdmin && <th style={{ padding: '12px' }}>Tenant</th>}
                    <th style={{ padding: '12px' }}>Base Rent</th>
                    <th style={{ padding: '12px' }}>Carried Balance</th>
                    <th style={{ padding: '12px' }}>Total Due</th>
                    <th style={{ padding: '12px' }}>Paid</th>
                    <th style={{ padding: '12px' }}>Outstanding</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rents.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>{r.billingPeriod}</td>
                      <td style={{ padding: '12px' }}>
                        <div>{r.propertyId?.name || 'Property'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unit {r.unitId?.unitNumber || ''}</div>
                      </td>
                      {isOwnerOrAdmin && (
                        <td style={{ padding: '12px' }}>
                          <div>{r.tenantId?.name || 'Tenant'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.tenantId?.email}</div>
                        </td>
                      )}
                      <td style={{ padding: '12px', color: '#334155' }}>₹{r.baseAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: r.previousOutstandingAmount > 0 ? '#d97706' : '#94a3b8' }}>
                        {r.previousOutstandingAmount > 0 ? `+ ₹${r.previousOutstandingAmount.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>₹{r.totalPayableAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 600 }}>₹{r.paidAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: '#dc2626', fontWeight: 700 }}>₹{r.outstandingAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(r.status)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {r.outstandingAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedPayRent(r);
                                setIsPayModalOpen(true);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Pay Now / QR
                            </button>
                          )}

                          {isOwnerOrAdmin && r.status === 'PARTIALLY_PAID' && r.outstandingAmount > 0 && !r.isCarryForwardApproved && (
                            <button
                              onClick={() => {
                                setSelectedCarryRent(r);
                                setIsCarryModalOpen(true);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid #d97706',
                                backgroundColor: '#fffbeb',
                                color: '#b45309',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer'
                              }}
                            >
                              Carry Forward
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment History Audit Logs */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Payment Transaction History
          </h2>

          {history.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No successful transactions recorded yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>Receipt #</th>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px' }}>Tenant</th>
                    <th style={{ padding: '12px' }}>Amount Paid</th>
                    <th style={{ padding: '12px' }}>Provider</th>
                    <th style={{ padding: '12px' }}>Order ID</th>
                    <th style={{ padding: '12px' }}>Payment ID</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => {
                            setSelectedReceipt(h);
                            setIsReceiptModalOpen(true);
                          }}
                          style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          {h.receiptNo}
                        </button>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', color: '#1e293b' }}>{h.tenantId?.name || 'Tenant'}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#16a34a' }}>₹{h.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textTransform: 'uppercase', color: '#475569' }}>{h.paymentProvider}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{h.providerOrderId}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{h.providerPaymentId || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem' }}>
                          SUCCESS
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Render Modals */}
      {selectedPayRent && (
        <PayRentModal
          rent={selectedPayRent}
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setSelectedPayRent(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {isOwnerOrAdmin && orgId && (
        <CreateRentModal
          organizationId={orgId}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {selectedCarryRent && isOwnerOrAdmin && orgId && (
        <CarryForwardModal
          rent={selectedCarryRent}
          organizationId={orgId}
          isOpen={isCarryModalOpen}
          onClose={() => {
            setIsCarryModalOpen(false);
            setSelectedCarryRent(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          transaction={selectedReceipt}
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setSelectedReceipt(null);
          }}
        />
      )}
    </MainLayout>
  );
}


export default PaymentsPage;
