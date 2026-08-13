import React, { useState } from 'react';
import type { RentItem } from '@/features/payments/services/paymentsApi';
import MessengerDrawer from '@/components/layout/MessengerDrawer';

interface InvoiceModalProps {
  rent: RentItem;
  isOpen: boolean;
  onClose: () => void;
  onPayNow?: (rent: RentItem) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ rent, isOpen, onClose, onPayNow }) => {
  const [messengerOpen, setMessengerOpen] = useState(false);

  if (!isOpen || !rent) return null;

  const invoiceNo = `INV-${rent.billingPeriod}-${rent.unitId?.unitNumber || '101'}`;
  const tenantName = rent.tenantId?.name || 'Tenant';
  const tenantEmail = rent.tenantId?.email || '';
  const tenantPhone = (rent.tenantId as any)?.phone || '';

  const shareText = `Hi ${tenantName}, your rent invoice (${invoiceNo}) for Unit ${rent.unitId?.unitNumber || ''} is ₹${rent.totalPayableAmount.toLocaleString('en-IN')}. Due date: ${new Date(rent.dueDate).toLocaleDateString()}. Please complete payment. Thank you!`;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = tenantPhone.replace(/\D/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleEmailShare = () => {
    const subject = `NestPay Rent Invoice - ${invoiceNo}`;
    const mailtoUrl = `mailto:${tenantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <>
      <div style={{
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
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '32px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}>
          {/* Invoice Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e2e8f0', paddingBottom: '18px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#2563eb', letterSpacing: '-0.5px' }}>NESTPAY</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>RENT BILLING INVOICE</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '20px',
                backgroundColor: rent.status === 'PAID' ? '#ecfdf5' : rent.status === 'PARTIALLY_PAID' ? '#fff7ed' : '#fef2f2',
                color: rent.status === 'PAID' ? '#047857' : rent.status === 'PARTIALLY_PAID' ? '#c2410c' : '#991b1b',
                fontWeight: 800,
                fontSize: '0.8rem',
                textTransform: 'uppercase'
              }}>
                STATUS: {rent.status}
              </span>
              <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: 800, marginTop: '6px' }}>
                Invoice #: <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{invoiceNo}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                Due Date: <strong>{new Date(rent.dueDate).toLocaleDateString()}</strong>
              </div>
            </div>
          </div>

          {/* Billed To / Property Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>PROPERTY & UNIT</span>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {rent.propertyId?.name || 'Property'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700 }}>
                Unit {rent.unitId?.unitNumber || ''}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>BILLED TO TENANT</span>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {tenantName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                {tenantEmail}
              </div>
            </div>
          </div>

          {/* Multi-Channel Communication Buttons */}
          <div style={{ padding: '14px', backgroundColor: '#eef2ff', borderRadius: '12px', border: '1px solid #c7d2fe', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#3730a3', display: 'block', marginBottom: '8px' }}>
              SEND INVOICE TO TENANT:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setMessengerOpen(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #2563eb',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                💬 In-App Messenger
              </button>

              <button
                onClick={handleWhatsAppShare}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #16a34a',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📱 Send via WhatsApp
              </button>

              <button
                onClick={handleEmailShare}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ✉️ Send via Email
              </button>
            </div>
          </div>

          {/* Invoice Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #cbd5e1', color: '#475569', textAlign: 'left' }}>
                <th style={{ padding: '10px 0' }}>Item Description</th>
                <th style={{ padding: '10px 0', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 0', color: '#1e293b' }}>
                  Base Rent — Period <strong>{rent.billingPeriod}</strong>
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>
                  ₹{rent.baseAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              {rent.previousOutstandingAmount > 0 && (
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', color: '#d97706' }}>
                    Carried Forward Unpaid Balance from Prior Period
                  </td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#d97706' }}>
                    + ₹{rent.previousOutstandingAmount.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
              <tr style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#fafafa' }}>
                <td style={{ padding: '12px 10px', fontWeight: 700, color: '#0f172a' }}>
                  Total Invoice Payable
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  ₹{rent.totalPayableAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px 10px', color: '#16a34a' }}>
                  Amount Already Paid
                </td>
                <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                  - ₹{rent.paidAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid #0f172a', backgroundColor: '#eff6ff' }}>
                <td style={{ padding: '14px 10px', fontWeight: 800, color: '#2563eb', fontSize: '1.05rem' }}>
                  Outstanding Amount Due
                </td>
                <td style={{ padding: '14px 10px', textAlign: 'right', fontWeight: 900, color: '#2563eb', fontSize: '1.2rem' }}>
                  ₹{rent.outstandingAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bottom Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                color: '#1e293b',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🖨️ Print PDF
            </button>

            {rent.outstandingAmount > 0 && onPayNow && (
              <button
                onClick={() => {
                  onClose();
                  onPayNow(rent);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Pay Invoice via Razorpay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* In-App Messenger Drawer */}
      <MessengerDrawer
        isOpen={messengerOpen}
        onClose={() => setMessengerOpen(false)}
        initialMessage={shareText}
        recipientName={`Unit ${rent.unitId?.unitNumber || ''} (${tenantName})`}
        initialUnitId={rent.unitId?._id}
      />
    </>
  );
};
