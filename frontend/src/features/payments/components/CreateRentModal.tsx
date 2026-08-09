import React, { useState, useEffect } from 'react';
import { createRentApi } from '../services/paymentsApi';
import api from '@/services/api';

interface CreateRentModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateRentModal: React.FC<CreateRentModalProps> = ({ organizationId, isOpen, onClose, onSuccess }) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [propertyId, setPropertyId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<string>(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [baseAmount, setBaseAmount] = useState<number>(12000);
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && organizationId) {
      loadFormData();
    }
  }, [isOpen, organizationId]);

  const loadFormData = async () => {
    try {
      const [propsRes, membersRes] = await Promise.all([
        api.get(`/organizations/${organizationId}/properties`),
        api.get(`/organizations/${organizationId}/members`),
      ]);

      const rawProps = propsRes.data?.data?.properties || propsRes.data?.properties || propsRes.data?.data;
      setProperties(Array.isArray(rawProps) ? rawProps : []);

      const rawMembers = membersRes.data?.members || membersRes.data?.data?.members || membersRes.data?.data;
      setMembers(Array.isArray(rawMembers) ? rawMembers : []);
    } catch (err: any) {
      console.error('Failed loading property data for rent creation:', err);
      setProperties([]);
      setMembers([]);
    }
  };

  const handlePropertyChange = async (selectedPropId: string) => {
    setPropertyId(selectedPropId);
    setUnitId('');
    if (!selectedPropId) {
      setUnits([]);
      return;
    }
    try {
      const unitsRes = await api.get(`/organizations/${organizationId}/units`, {
        params: { propertyId: selectedPropId },
      });
      const rawUnits = unitsRes.data?.units || unitsRes.data?.data?.units || unitsRes.data?.data;
      setUnits(Array.isArray(rawUnits) ? rawUnits : []);
    } catch (err: any) {
      console.error('Failed loading units:', err);
      setUnits([]);
    }
  };


  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !unitId || !tenantId || !billingPeriod || baseAmount <= 0) {
      setErrorMsg('Please fill in all required fields properly.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      await createRentApi(organizationId, {
        propertyId,
        unitId,
        tenantId,
        billingPeriod,
        baseAmount,
        dueDate,
        adjustmentNotes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create rent obligation.');
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
        maxWidth: '560px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Issue Rent Obligation</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0 0' }}>Assign monthly rent to a tenant unit</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Property *
              </label>
              <select
                value={propertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select Property</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Unit *
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                required
                disabled={!propertyId}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select Unit</option>
                {units.map((u) => (
                  <option key={u._id} value={u._id}>Unit {u.unitNumber}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Tenant User *
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="">Select Tenant</option>
              {members.map((m) => (
                <option key={m.userId?._id || m.userId} value={m.userId?._id || m.userId}>
                  {m.userId?.name || m.userId?.email || 'User'} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Billing Period *
              </label>
              <input
                type="month"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Base Rent (₹) *
              </label>
              <input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(Number(e.target.value))}
                min={100}
                required
                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Adjustment / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Standard monthly rent obligation"
              value={adjustmentNotes}
              onChange={(e) => setAdjustmentNotes(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#475569', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Creating...' : 'Issue Rent Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
