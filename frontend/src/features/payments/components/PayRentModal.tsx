import React, { useState, useEffect } from 'react';
import type { RentItem } from '../services/paymentsApi';
import { initiatePaymentOrderApi, verifyPaymentSignatureApi } from '../services/paymentsApi';


import { loadRazorpayScript } from '../utils/loadRazorpayScript';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PayRentModalProps {
  rent: RentItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PayRentModal: React.FC<PayRentModalProps> = ({ rent, isOpen, onClose, onSuccess }) => {
  const [payAmount, setPayAmount] = useState<number>(rent.outstandingAmount);
  const [partialConfirmed, setPartialConfirmed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setPayAmount(rent.outstandingAmount);
    setPartialConfirmed(false);
    setErrorMsg('');
  }, [rent]);

  if (!isOpen) return null;

  const isPartialPayment = payAmount < rent.outstandingAmount && payAmount > 0;
  const isOverpayment = payAmount > rent.outstandingAmount;
  const remainingAfterPay = Math.max(0, rent.outstandingAmount - payAmount);

  const canPay = payAmount > 0 && !isOverpayment && (!isPartialPayment || partialConfirmed) && !loading;

  const handlePay = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        setErrorMsg('Failed to load Razorpay payment SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Step 1: Request Backend Order Creation (Validates rent record securely on backend)
      const orderRes = await initiatePaymentOrderApi({
        rentId: rent._id,
        payAmount,
      });

      if (!orderRes.success) {
        setErrorMsg(orderRes.message || 'Failed to initiate payment order.');
        setLoading(false);
        return;
      }

      // Step 2: Configure Razorpay Checkout Modal
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'NESTPAY Rent Collection',
        description: `Rent for ${rent.propertyId?.name || 'Property'} - Unit ${rent.unitId?.unitNumber || ''} (${rent.billingPeriod})`,
        order_id: orderRes.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            // Step 3: Verify Payment Signature on Backend
            const verifyRes = await verifyPaymentSignatureApi({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              onSuccess();
              onClose();
            } else {
              setErrorMsg(verifyRes.message || 'Payment verification failed.');
            }
          } catch (err: any) {
            setErrorMsg(err.response?.data?.message || err.message || 'Payment signature verification error.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: rent.tenantId?.name || '',
          email: rent.tenantId?.email || '',
          contact: rent.tenantId?.phone || '',
        },
        notes: {
          rentId: rent._id,
          billingPeriod: rent.billingPeriod,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        setErrorMsg(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error launching payment checkout.');
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
        maxWidth: '520px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '28px',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Rent Payment</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>
              {rent.propertyId?.name} — Unit {rent.unitId?.unitNumber} ({rent.billingPeriod})
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '8px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        {/* Rent Summary Card */}
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Base Rent:</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{rent.baseAmount.toLocaleString('en-IN')}</span>
          </div>
          {rent.previousOutstandingAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
              <span style={{ color: '#d97706' }}>Previous Balance Carried Forward:</span>
              <span style={{ fontWeight: 600, color: '#d97706' }}>+ ₹{rent.previousOutstandingAmount.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: '#64748b' }}>Total Rent Due:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>₹{rent.totalPayableAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.875rem' }}>
            <span style={{ color: '#16a34a' }}>Already Paid:</span>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>₹{rent.paidAmount.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '10px' }}>
            <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '1rem' }}>Remaining Outstanding:</span>
            <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '1.1rem' }}>₹{rent.outstandingAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Payment Input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
            Amount to Pay (₹)
          </label>
          <input
            type="number"
            value={payAmount}
            onChange={(e) => setPayAmount(Number(e.target.value))}
            min={1}
            max={rent.outstandingAmount}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: '10px',
              border: isOverpayment ? '2px solid #ef4444' : isPartialPayment ? '2px solid #f59e0b' : '2px solid #2563eb',
              outline: 'none',
              backgroundColor: '#ffffff'
            }}
          />
        </div>

        {/* Warning Callouts */}
        {isOverpayment && (
          <div style={{ padding: '12px 16px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', color: '#be123c', fontSize: '0.875rem', marginBottom: '20px' }}>
            <strong>⚠️ Overpayment Warning:</strong> You entered ₹{payAmount.toLocaleString('en-IN')}, which exceeds your current outstanding rent (₹{rent.outstandingAmount.toLocaleString('en-IN')}). Please enter an amount up to ₹{rent.outstandingAmount.toLocaleString('en-IN')}.
          </div>
        )}

        {isPartialPayment && (
          <div style={{ padding: '14px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', color: '#b45309', fontSize: '0.875rem', marginBottom: '20px' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
              ⚠️ Partial Payment Confirmation Required
            </p>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.825rem' }}>
              Your expected rent is <strong>₹{rent.outstandingAmount.toLocaleString('en-IN')}</strong>. You are paying <strong>₹{payAmount.toLocaleString('en-IN')}</strong>. 
              A balance of <strong style={{ color: '#dc2626' }}>₹{remainingAfterPay.toLocaleString('en-IN')}</strong> will remain outstanding and status will be set to PARTIALLY_PAID.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600, color: '#78350f' }}>
              <input
                type="checkbox"
                checked={partialConfirmed}
                onChange={(e) => setPartialConfirmed(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#d97706' }}
              />
              I confirm paying ₹{payAmount.toLocaleString('en-IN')} and carrying forward ₹{remainingAfterPay.toLocaleString('en-IN')} outstanding balance.
            </label>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: canPay ? '#2563eb' : '#94a3b8',
              color: '#ffffff',
              fontWeight: 700,
              cursor: canPay ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? 'Initiating Razorpay...' : `Pay ₹${payAmount.toLocaleString('en-IN')} via Razorpay / UPI / QR`}
          </button>
        </div>
      </div>
    </div>
  );
};
