import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import MainLayout from '@/components/layout/MainLayout';
import type { RentItem } from '@/features/payments/services/paymentsApi';
import { fetchRentsApi } from '@/features/payments/services/paymentsApi';

import { InvoiceModal } from '../components/InvoiceModal';
import { PayRentModal } from '@/features/payments/components/PayRentModal';

export function InvoicesPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeMembership } = useSelector((state: RootState) => state.organization);

  const orgId = activeMembership?.organizationId?._id;
  const userRole = activeMembership?.role || 'MEMBER';
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';

  const [rents, setRents] = useState<RentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [selectedInvoiceRent, setSelectedInvoiceRent] = useState<RentItem | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  const [selectedPayRent, setSelectedPayRent] = useState<RentItem | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);

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
      const rentsRes = await fetchRentsApi(orgId!, rentFilter);

      const rawRents = rentsRes.rents || rentsRes.data?.rents || rentsRes.data;
      setRents(Array.isArray(rawRents) ? rawRents : []);
    } catch (err: any) {
      console.error('Error loading invoice data:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to load invoices.');
      setRents([]);
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalInvoiced = rents.reduce((sum, r) => sum + r.totalPayableAmount, 0);
  const totalPaid = rents.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalUnpaid = rents.reduce((sum, r) => sum + r.outstandingAmount, 0);

  // Filter rents
  const filteredRents = rents.filter((r) => {
    const matchesSearch =
      (r.propertyId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unitId?.unitNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.tenantId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.tenantId?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.billingPeriod || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Rent Invoices & Billing
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '4px 0 0 0' }}>
              View, print, and track monthly rent tax invoices and outstanding dues
            </p>
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL INVOICED</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              ₹{totalInvoiced.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#16a34a', fontSize: '0.85rem', fontWeight: 600 }}>TOTAL PAID</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>
              ₹{totalPaid.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <span style={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>OUTSTANDING BALANCE</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', marginTop: '6px' }}>
              ₹{totalUnpaid.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <input
            type="text"
            placeholder="Search by tenant, property, unit, period..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '240px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem'
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="UNPAID">UNPAID</option>
          </select>
        </div>

        {/* Invoices Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
            Tax Invoices ({filteredRents.length})
          </h2>

          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Loading invoices...</div>
          ) : filteredRents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
              <p style={{ color: '#94a3b8', margin: 0 }}>No invoices matching criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px' }}>Invoice #</th>
                    <th style={{ padding: '12px' }}>Due Date</th>
                    <th style={{ padding: '12px' }}>Period</th>
                    <th style={{ padding: '12px' }}>Property / Unit</th>
                    <th style={{ padding: '12px' }}>Tenant</th>
                    <th style={{ padding: '12px' }}>Base Rent</th>
                    <th style={{ padding: '12px' }}>Carried Bal.</th>
                    <th style={{ padding: '12px' }}>Total Invoiced</th>
                    <th style={{ padding: '12px' }}>Due Amount</th>
                    <th style={{ padding: '12px' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRents.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                        INV-{r.billingPeriod}-{r.unitId?.unitNumber || '101'}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{r.billingPeriod}</td>
                      <td style={{ padding: '12px' }}>
                        <div>{r.propertyId?.name || 'Property'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Unit {r.unitId?.unitNumber}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>{r.tenantId?.name || 'Tenant'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.tenantId?.email}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#334155' }}>₹{r.baseAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', color: r.previousOutstandingAmount > 0 ? '#d97706' : '#94a3b8' }}>
                        {r.previousOutstandingAmount > 0 ? `+ ₹${r.previousOutstandingAmount.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: '#0f172a' }}>₹{r.totalPayableAmount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', fontWeight: 700, color: r.outstandingAmount > 0 ? '#dc2626' : '#16a34a' }}>
                        ₹{r.outstandingAmount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(r.status)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedInvoiceRent(r);
                            setIsInvoiceModalOpen(true);
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: '1px solid #2563eb',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          📄 View Tax Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedInvoiceRent && (
        <InvoiceModal
          rent={selectedInvoiceRent}
          isOpen={isInvoiceModalOpen}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setSelectedInvoiceRent(null);
          }}
          onPayNow={(rentToPay) => {
            setSelectedPayRent(rentToPay);
            setIsPayModalOpen(true);
          }}
        />
      )}

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
    </MainLayout>
  );
}

export default InvoicesPage;
