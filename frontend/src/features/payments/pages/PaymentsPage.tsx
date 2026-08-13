import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import MainLayout from '@/components/layout/MainLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Drawer from '@/components/ui/Drawer';
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

  // Owner payment config state
  const [paymentConfigOpen, setPaymentConfigOpen] = useState(false);
  const [upiId, setUpiId] = useState(localStorage.getItem(`upi_${orgId}`) || 'owner@upi');
  const [accountNo, setAccountNo] = useState(localStorage.getItem(`acc_${orgId}`) || 'XXXXXXXX9876');

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
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load rent and payment records.');
      setRents([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaymentConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (orgId) {
      localStorage.setItem(`upi_${orgId}`, upiId);
      localStorage.setItem(`acc_${orgId}`, accountNo);
      setPaymentConfigOpen(false);
    }
  };

  // Compute stats
  const totalExpected = rents.reduce((acc, r) => acc + r.totalPayableAmount, 0);
  const totalPaid = rents.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalOutstanding = rents.reduce((acc, r) => acc + r.outstandingAmount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: '0.75rem' }}>PAID</span>;
      case 'PARTIALLY_PAID':
        return <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: '#fff7ed', color: '#c2410c', fontWeight: 800, fontSize: '0.75rem' }}>PARTIAL</span>;
      case 'UNPAID':
      default:
        return <span style={{ padding: '4px 12px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#991b1b', fontWeight: 800, fontSize: '0.75rem' }}>UNPAID</span>;
    }
  };

  return (
    <MainLayout title="Payments & Collection" subtitle="Owner payment setup, scanner, and unit-wise rent collection">
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isOwnerOrAdmin ? 'Owner Payment Setup & Ledger' : 'Pay Rent & Payment History'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {isOwnerOrAdmin && (
              <>
                <Button variant="outline" onClick={() => setPaymentConfigOpen(true)}>
                  ⚙️ Update Owner Payment Details
                </Button>
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  + Issue Rent Obligation
                </Button>
              </>
            )}
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Owner Payment Configuration & Scanner Display */}
        <Card title="Owner Payment Information & UPI Scanner" subtitle="Scan QR code or use UPI details below to process rent payment">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Owner UPI ID: </span>
                <strong style={{ fontSize: '1.05rem', color: '#2563eb' }}>{upiId}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Bank Account Number: </span>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{accountNo}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Accepted Gateway: </span>
                <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: "10px", fontSize: "0.78rem", fontWeight: 800 }}>
                  UPI / Razorpay / Net Banking
                </span>
              </div>
            </div>

            {/* QR Code Scanner Placeholder Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 900, fontSize: '0.8rem', textAlign: 'center' }}>
                UPI QR CODE
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>Scan to Pay Rent</strong>
                Use GPay, PhonePe, or Paytm to scan and pay directly to the property owner.
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <Card>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>Total Expected Rent</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
              ₹{totalExpected.toLocaleString('en-IN')}
            </div>
          </Card>

          <Card>
            <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>Total Collected</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: '4px' }}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
          </Card>

          <Card>
            <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>Outstanding Balance</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#dc2626', marginTop: '4px' }}>
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
          </Card>
        </div>

        {/* Rent Records Section */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            {isOwnerOrAdmin ? 'Unit-Wise Rent Records' : 'My Unit Rent Obligations'}
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
                    <th style={{ padding: '12px' }}>Carried</th>
                    <th style={{ padding: '12px' }}>Total Due</th>
                    <th style={{ padding: '12px' }}>Paid</th>
                    <th style={{ padding: '12px' }}>Outstanding</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rents.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#1e293b' }}>{r.billingPeriod}</td>
                      <td style={{ padding: '12px' }}>
                        <div>{r.propertyId?.name || 'Property'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 700 }}>Unit {r.unitId?.unitNumber || ''}</div>
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
                      <td style={{ padding: '12px', fontWeight: 800, color: '#0f172a' }}>₹{r.totalPayableAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: '#16a34a', fontWeight: 600 }}>₹{r.paidAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: '#dc2626', fontWeight: 800 }}>₹{r.outstandingAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(r.status)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {r.outstandingAmount > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedPayRent(r);
                                setIsPayModalOpen(true);
                              }}
                            >
                              Pay Rent / QR
                            </Button>
                          )}

                          {isOwnerOrAdmin && r.status === 'PARTIALLY_PAID' && r.outstandingAmount > 0 && !r.isCarryForwardApproved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCarryRent(r);
                                setIsCarryModalOpen(true);
                              }}
                            >
                              Carry Forward
                            </Button>
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
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #cbd5e1', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
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
                          style={{ border: 'none', background: 'transparent', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          {h.receiptNo}
                        </button>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', color: '#1e293b' }}>{h.tenantId?.name || 'Tenant'}</td>
                      <td style={{ padding: '12px', fontWeight: 800, color: '#16a34a' }}>₹{h.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textTransform: 'uppercase', color: '#475569' }}>{h.paymentProvider}</td>
                      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b' }}>{h.providerOrderId}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 800, fontSize: '0.75rem' }}>
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

      {/* Owner Payment Configuration Drawer */}
      <Drawer
        isOpen={paymentConfigOpen}
        onClose={() => setPaymentConfigOpen(false)}
        title="Owner Payment Details & QR Config"
        subtitle="Set up your UPI ID and Bank details to receive rent directly."
      >
        <form onSubmit={handleSavePaymentConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Owner UPI ID (VPA) *"
            name="upiId"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. owner@okicici"
            required
          />
          <Input
            label="Bank Account Number *"
            name="accountNo"
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            placeholder="e.g. 987654321012"
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="outline" type="button" onClick={() => setPaymentConfigOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Payment Details
            </Button>
          </div>
        </form>
      </Drawer>

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
