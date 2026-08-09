import React from 'react';
import type { PaymentTransactionItem } from '../services/paymentsApi';

interface ReceiptModalProps {
  transaction: PaymentTransactionItem;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const rent = transaction.rentId;

  return (
    <div className="receipt-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(5px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="receipt-container" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '640px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px',
        position: 'relative'
      }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.5px' }}>NESTPAY</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>Official Payment Receipt</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '20px',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              fontWeight: 800,
              fontSize: '0.8rem',
              textTransform: 'uppercase'
            }}>
              PAID & VERIFIED
            </span>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginTop: '6px' }}>
              Receipt #: <span style={{ color: '#0f172a' }}>{transaction.receiptNo}</span>
            </div>
            <div style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              Date: {new Date(transaction.createdAt).toLocaleDateString()} {new Date(transaction.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Property & Unit</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {transaction.propertyId?.name || 'Property'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              Unit {transaction.unitId?.unitNumber || ''}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Tenant Details</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
              {transaction.tenantId?.name || 'Tenant'}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
              {transaction.tenantId?.email}
            </div>
          </div>
        </div>

        {/* Breakdown Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
              <th style={{ padding: '8px 0' }}>Description</th>
              <th style={{ padding: '8px 0', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 0', color: '#1e293b' }}>
                Rent for Period {rent?.billingPeriod || 'Billing Period'}
              </td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600 }}>
                ₹{(rent?.baseAmount || transaction.amount).toLocaleString('en-IN')}
              </td>
            </tr>
            {rent && rent.totalPayableAmount > rent.baseAmount && (
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 0', color: '#d97706' }}>
                  Carried Forward Balance
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                  + ₹{(rent.totalPayableAmount - rent.baseAmount).toLocaleString('en-IN')}
                </td>
              </tr>
            )}
            <tr style={{ borderBottom: '2px solid #0f172a', fontWeight: 800 }}>
              <td style={{ padding: '12px 0', fontSize: '1rem', color: '#0f172a' }}>
                Total Payment Received
              </td>
              <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '1.1rem', color: '#16a34a' }}>
                ₹{transaction.amount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Razorpay Metadata */}
        <div style={{ backgroundColor: '#eff6ff', padding: '14px', borderRadius: '10px', border: '1px solid #bfdbfe', marginBottom: '24px', fontSize: '0.8rem', color: '#1e40af' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Payment Gateway:</span>
            <strong style={{ textTransform: 'uppercase' }}>{transaction.paymentProvider} (Verified)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Razorpay Order ID:</span>
            <strong style={{ fontFamily: 'monospace' }}>{transaction.providerOrderId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Razorpay Payment ID:</span>
            <strong style={{ fontFamily: 'monospace' }}>{transaction.providerPaymentId || 'Verified'}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🖨️ Print / Save Receipt PDF
          </button>
        </div>
      </div>
    </div>
  );
};
