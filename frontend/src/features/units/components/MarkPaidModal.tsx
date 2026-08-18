import React, { useState } from "react";
import { markInvoicePaidApi } from "../services/invoiceApi";

interface MarkPaidModalProps {
    orgId: string;
    unitId: string;
    currentAmount: number;
    billingPeriod: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const MarkPaidModal: React.FC<MarkPaidModalProps> = ({
    orgId,
    unitId,
    currentAmount,
    billingPeriod,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [paymentMode, setPaymentMode] = useState<string>("Cash");
    const [amount, setAmount] = useState<number>(currentAmount);
    const [notes, setNotes] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await markInvoicePaidApi(orgId, unitId, {
                amount: Number(amount) || currentAmount,
                paymentMode,
                notes,
            });

            if (res.success) {
                onSuccess();
                onClose();
            } else {
                setError(res.message || "Failed to mark payment as paid.");
            }
        } catch {
            setError("Server error while recording payment.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.6)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "16px",
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    maxWidth: "480px",
                    width: "100%",
                    padding: "28px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                            Mark Invoice as Paid
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.825rem", color: "#64748b" }}>
                            Manual Payment Recording ({billingPeriod})
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.25rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div
                        style={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#991b1b",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            marginBottom: "16px",
                            fontSize: "0.85rem",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Payment Mode Selector */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Payment Mode (Method Received) *
                        </label>
                        <select
                            value={paymentMode}
                            onChange={(e) => setPaymentMode(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: "#0f172a",
                                backgroundColor: "#f8fafc",
                            }}
                        >
                            <option value="Cash">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="Google Pay">Google Pay (GPay)</option>
                            <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                            <option value="Other">Other Mode</option>
                        </select>
                    </div>

                    {/* Amount Received */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Amount Received (₹) *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={amount || ""}
                            onChange={(e) => setAmount(Number(e.target.value) || 0)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.95rem",
                                fontWeight: 800,
                                color: "#0f172a",
                            }}
                        />
                    </div>

                    {/* Notes / Reference */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Payment Notes / UTR Reference
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            placeholder="e.g. Received via Cash in office / UTR Ref #98726312"
                            onChange={(e) => setNotes(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                            }}
                        />
                    </div>

                    {/* Notice Callout */}
                    <div
                        style={{
                            backgroundColor: "#eef2ff",
                            border: "1px solid #c7d2fe",
                            borderRadius: "10px",
                            padding: "12px",
                            fontSize: "0.775rem",
                            color: "#3730a3",
                            lineHeight: 1.4,
                        }}
                    >
                        ⚡ Submitting will mark invoice <strong>PAID</strong>, auto-stop scheduled reminders for this cycle, send a multi-channel payment confirmation to tenant(s), and log the transaction in the Payment Confirmation Log.
                    </div>

                    {/* Modal Controls */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "10px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#f8fafc",
                                color: "#475569",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "10px",
                                border: "none",
                                backgroundColor: "#059669",
                                color: "#ffffff",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                                cursor: submitting ? "not-allowed" : "pointer",
                                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.25)",
                            }}
                        >
                            {submitting ? "Processing..." : "Confirm & Send Receipt"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MarkPaidModal;
