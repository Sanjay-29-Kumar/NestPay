import React, { useState } from 'react';
import type { RentItem } from '../services/paymentsApi';
import { carryForwardRentApi } from '../services/paymentsApi';



interface CarryForwardModalProps {
  rent: RentItem;
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CarryForwardModal: React.FC<CarryForwardModalProps> = ({
  rent,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [nextBillingPeriod, setNextBillingPeriod] = useState<string>(() => {
    // Default to next month "YYYY-MM"
    const [year, month] = rent.billingPeriod.split('-').map(Number);
    const date = new Date(year, month, 1); // Next month
    return date.toISOString().slice(0, 7);
  });
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleCarryForward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      await carryForwardRentApi(organizationId, {
        rentId: rent._id,
        nextBillingPeriod,
        dueDate,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to carry forward outstanding balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Carry Forward Outstanding Balance</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Unit {rent.unitId?.unitNumber} — {rent.tenantId?.name}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '14px', borderRadius: '10px', color: '#92400e', fontSize: '0.875rem', marginBottom: '20px' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
            Outstanding Balance: ₹{rent.outstandingAmount.toLocaleString('en-IN')}
          </p>
          <p style={{ margin: 0, fontSize: '0.825rem' }}>
            This will carry forward <strong>₹{rent.outstandingAmount.toLocaleString('en-IN')}</strong> from period <strong>{rent.billingPeriod}</strong> to <strong>{nextBillingPeriod}</strong> as a separate line item.
          </p>
        </div>

        <form onSubmit={handleCarryForward} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Target Billing Period *
            </label>
            <input
              type="month"
              value={nextBillingPeriod}
              onChange={(e) => setNextBillingPeriod(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              New Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#d97706', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Processing...' : 'Approve Carry Forward'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
