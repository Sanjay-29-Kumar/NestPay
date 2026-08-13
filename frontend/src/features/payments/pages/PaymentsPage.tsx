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
import api from '@/services/api';

interface UnitSummaryItem {
  _id: string;
  unitNumber: string;
  propertyName: string;
  status: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  rents: RentItem[];
  payments: PaymentTransactionItem[];
  totalExpected: number;
  totalPaid: number;
  totalOutstanding: number;
}

export function PaymentsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeMembership } = useSelector((state: RootState) => state.organization);

  const orgId = activeMembership?.organizationId?._id;
  const userRole = activeMembership?.role || 'MEMBER';
  const isOwner = userRole === 'OWNER';
  const isAdmin = userRole === 'ADMIN';
  const isOwnerOrAdmin = isOwner || isAdmin;

  const [rents, setRents] = useState<RentItem[]>([]);
  const [history, setHistory] = useState<PaymentTransactionItem[]>([]);
  const [unitSummaries, setUnitSummaries] = useState<UnitSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Owner payment bank account & QR state
  const [upiId, setUpiId] = useState(localStorage.getItem(`upi_${orgId}`) || 'owner@upi');
  const [accountNo, setAccountNo] = useState(localStorage.getItem(`acc_${orgId}`) || 'XXXXXXXX9876');
  const [ifscCode, setIfscCode] = useState(localStorage.getItem(`ifsc_${orgId}`) || 'SBIN0001234');
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Selected Unit Modal for Owner/Admin
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<UnitSummaryItem | null>(null);

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
      const [rentsRes, historyRes, unitsRes] = await Promise.all([
        fetchRentsApi(orgId!, rentFilter),
        fetchPaymentHistoryApi(orgId!, rentFilter),
        isOwnerOrAdmin ? api.get(`/organizations/${orgId}/units`) : Promise.resolve({ data: {} }),
      ]);

      const rawRents: RentItem[] = Array.isArray(rentsRes.rents)
        ? rentsRes.rents
        : Array.isArray(rentsRes.data?.rents)
        ? rentsRes.data.rents
        : Array.isArray(rentsRes.data)
        ? rentsRes.data
        : [];
      setRents(rawRents);

      const rawHistory: PaymentTransactionItem[] = Array.isArray(historyRes.history)
        ? historyRes.history
        : Array.isArray(historyRes.data?.history)
        ? historyRes.data.history
        : Array.isArray(historyRes.data)
        ? historyRes.data
        : [];
      setHistory(rawHistory);

      // Group by Unit for Owner / Admin view
      if (isOwnerOrAdmin) {
        const rawUnits = unitsRes.data?.units || unitsRes.data?.data?.units || unitsRes.data?.data || [];
        const summaries: UnitSummaryItem[] = rawUnits.map((u: any) => {
          const unitRents = rawRents.filter(
            (r) => r.unitId?._id === u._id || (r.unitId as any) === u._id
          );
          const unitPayments = rawHistory.filter(
            (h) => h.unitId?._id === u._id || (h.unitId as any) === u._id
          );

          const expected = unitRents.reduce((acc, r) => acc + r.totalPayableAmount, 0);
          const paid = unitRents.reduce((acc, r) => acc + r.paidAmount, 0);
          const outstanding = unitRents.reduce((acc, r) => acc + r.outstandingAmount, 0);

          return {
            _id: u._id,
            unitNumber: u.unitNumber,
            propertyName: u.propertyId?.name || 'Property',
            status: u.status || (unitRents.length > 0 ? 'OCCUPIED' : 'VACANT'),
            tenantName: u.tenantName || u.primaryTenantId?.name || (unitRents[0]?.tenantId?.name) || 'Vacant Unit',
            tenantPhone: u.tenantPhone || u.primaryTenantId?.phone || (unitRents[0]?.tenantId?.phone) || 'N/A',
            tenantEmail: u.tenantEmail || u.primaryTenantId?.email || (unitRents[0]?.tenantId?.email) || '',
            rents: unitRents,
            payments: unitPayments,
            totalExpected: expected,
            totalPaid: paid,
            totalOutstanding: outstanding,
          };
        });
        setUnitSummaries(summaries);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed loading payments data.');
      setRents([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      alert('Unauthorized: Only the Owner can set or update bank account details.');
      return;
    }
    localStorage.setItem(`upi_${orgId}`, upiId);
    localStorage.setItem(`acc_${orgId}`, accountNo);
    localStorage.setItem(`ifsc_${orgId}`, ifscCode);
    setIsEditingBank(false);
    alert('Owner bank account & UPI QR details updated successfully.');
  };

  const totalExpected = rents.reduce((acc, r) => acc + r.totalPayableAmount, 0);
  const totalPaid = rents.reduce((acc, r) => acc + r.paidAmount, 0);
  const totalOutstanding = rents.reduce((acc, r) => acc + r.outstandingAmount, 0);

  return (
    <MainLayout>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              {isOwnerOrAdmin ? 'Organization Payments & Units' : 'My Rent Payments'}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
              {isOwnerOrAdmin
                ? 'Select a unit to view payment records, issue rent obligations, or manage bank account'
                : 'Pay your monthly rent directly to the owner via Razorpay, UPI, or QR code'}
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
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL EXPECTED RENT</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              ₹{totalExpected.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL COLLECTED</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>OUTSTANDING BALANCE</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Owner Bank Account & Payment QR Details Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                🏦 Owner Payment Account & UPI QR Details
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                {isOwner
                  ? 'Decided solely by Owner. Admin & Tenants can view these payment details.'
                  : 'Rent payments are routed to the Owner payment details shown below'}
              </p>
            </div>

            {isOwner && !isEditingBank && (
              <button
                onClick={() => setIsEditingBank(true)}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
              >
                ✏️ Edit Bank Details (Owner Only)
              </button>
            )}
          </div>

          {isEditingBank && isOwner ? (
            <form onSubmit={handleSaveBankConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Owner UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Bank Account No</label>
                <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>IFSC Code</label>
                <input type="text" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsEditingBank(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Bank Details</button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>UPI ID / VPA</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>{upiId}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>BANK ACCOUNT NUMBER</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{accountNo}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>IFSC CODE</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{ifscCode}</div>
              </div>
            </div>
          )}
        </div>

        {/* OWNER / ADMIN VIEW — UNIT-WISE LIST */}
        {loading ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading payments data...
          </div>
        ) : isOwnerOrAdmin ? (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              Units Overview (Click Unit to View Rent Records & History)
            </h2>

            {unitSummaries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>No units created yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {unitSummaries.map((unit) => (
                  <div
                    key={unit._id}
                    onClick={() => setSelectedUnitDetails(unit)}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                        Unit {unit.unitNumber}
                      </span>
                      <span style={{ padding: "3px 10px", borderRadius: "10px", backgroundColor: unit.status === "OCCUPIED" ? "#dcfce7" : "#fef3c7", color: unit.status === "OCCUPIED" ? "#15803d" : "#b45309", fontWeight: 800, fontSize: "0.72rem" }}>
                        {unit.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                      Property: <strong>{unit.propertyName}</strong>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '12px' }}>
                      Tenant: <strong>{unit.tenantName}</strong>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: '#64748b' }}>Outstanding Due:</span>
                      <strong style={{ color: unit.totalOutstanding > 0 ? '#dc2626' : '#16a34a' }}>
                        ₹{unit.totalOutstanding.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.75rem', color: '#2563eb', fontWeight: 700 }}>
                      View Full Details →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TENANT VIEW — MY RENT OBLIGATIONS & PAY BUTTON */
          <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              My Rent Obligations
            </h2>

            {rents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                <p style={{ color: '#94a3b8', margin: 0 }}>No active rent obligations found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '12px' }}>Period</th>
                      <th style={{ padding: '12px' }}>Unit</th>
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
                        <td style={{ padding: '12px', fontWeight: 700 }}>{r.billingPeriod}</td>
                        <td style={{ padding: '12px' }}>Unit {r.unitId?.unitNumber || ''}</td>
                        <td style={{ padding: '12px' }}>₹{r.baseAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px', color: '#d97706' }}>+ ₹{r.previousOutstandingAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px', fontWeight: 700 }}>₹{r.totalPayableAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px', color: '#16a34a', fontWeight: 700 }}>₹{r.paidAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px', color: '#dc2626', fontWeight: 700 }}>₹{r.outstandingAmount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ padding: '4px 10px', borderRadius: '10px', backgroundColor: r.status === 'PAID' ? '#dcfce7' : r.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#fee2e2', color: r.status === 'PAID' ? '#15803d' : r.status === 'PARTIALLY_PAID' ? '#b45309' : '#b91c1c', fontWeight: 800, fontSize: '0.72rem' }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {r.outstandingAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedPayRent(r);
                                setIsPayModalOpen(true);
                              }}
                              style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Pay Rent via Razorpay
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transaction History Section */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Payment Transaction History
          </h2>
          {loading ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading transaction history...</p>
          ) : history.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No payment receipts recorded yet.</p>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* OWNER/ADMIN DETAILED UNIT DIALOG */}
      {selectedUnitDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', maxWidth: '750px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Unit {selectedUnitDetails.unitNumber} — Detailed Payment Records
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
                  Property: {selectedUnitDetails.propertyName} • Primary Tenant: {selectedUnitDetails.tenantName} ({selectedUnitDetails.tenantPhone})
                </p>
              </div>
              <button onClick={() => setSelectedUnitDetails(null)} style={{ border: 'none', background: 'transparent', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>Rent Obligations & Balances</h4>
            {selectedUnitDetails.rents.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No rent obligations issued for this unit.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Period</th>
                    <th style={{ padding: '8px' }}>Base Rent</th>
                    <th style={{ padding: '8px' }}>Carried</th>
                    <th style={{ padding: '8px' }}>Total Due</th>
                    <th style={{ padding: '8px' }}>Paid</th>
                    <th style={{ padding: '8px' }}>Outstanding</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUnitDetails.rents.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px', fontWeight: 700 }}>{r.billingPeriod}</td>
                      <td style={{ padding: '8px' }}>₹{r.baseAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px', color: '#d97706' }}>+ ₹{r.previousOutstandingAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px', fontWeight: 700 }}>₹{r.totalPayableAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px', color: '#16a34a' }}>₹{r.paidAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px', color: '#dc2626', fontWeight: 700 }}>₹{r.outstandingAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '8px', backgroundColor: r.status === 'PAID' ? '#dcfce7' : r.status === 'PARTIALLY_PAID' ? '#fef3c7' : '#fee2e2', color: r.status === 'PAID' ? '#15803d' : r.status === 'PARTIALLY_PAID' ? '#b45309' : '#b91c1c', fontWeight: 800, fontSize: '0.7rem' }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        {isOwnerOrAdmin && r.status === 'PARTIALLY_PAID' && r.outstandingAmount > 0 && !r.isCarryForwardApproved && (
                          <button
                            onClick={() => {
                              setSelectedCarryRent(r);
                              setIsCarryModalOpen(true);
                            }}
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #d97706', backgroundColor: '#fffbeb', color: '#b45309', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Carry Forward
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedUnitDetails(null)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPayRent && (
        <PayRentModal rent={selectedPayRent} isOpen={isPayModalOpen} onClose={() => { setIsPayModalOpen(false); setSelectedPayRent(null); }} onSuccess={loadData} />
      )}
      {isOwnerOrAdmin && orgId && (
        <CreateRentModal organizationId={orgId} isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSuccess={loadData} />
      )}
      {selectedCarryRent && isOwnerOrAdmin && orgId && (
        <CarryForwardModal rent={selectedCarryRent} organizationId={orgId} isOpen={isCarryModalOpen} onClose={() => { setIsCarryModalOpen(false); setSelectedCarryRent(null); }} onSuccess={loadData} />
      )}
      {selectedReceipt && (
        <ReceiptModal transaction={selectedReceipt} isOpen={isReceiptModalOpen} onClose={() => { setIsReceiptModalOpen(false); setSelectedReceipt(null); }} />
      )}
    </MainLayout>
  );
}

export default PaymentsPage;
