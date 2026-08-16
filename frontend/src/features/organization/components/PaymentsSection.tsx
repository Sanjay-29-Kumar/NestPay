import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "@/store";
import { getOrganizationApi, updateOrganizationApi } from "../services/organizationApi";
import { getUsersGroupedByUnitApi } from "../services/familyRequestsApi";
import {
    initiateRazorpayOrderApi,
    verifyRazorpayPaymentApi,
    markManualPaymentApi,
    undoManualPaymentApi,
    getPaymentHistoryApi,
    updateOwnerRazorpayConfigApi,
} from "../services/paymentsApi";

interface PaymentsSectionProps {
    orgId: string;
    isOwnerOrAdmin: boolean;
    onGoToUnit?: (unitId: string) => void;
}

interface PaymentRecord {
    _id: string;
    unitId: string;
    amount: number;
    paymentMode: "APP" | "MANUAL";
    paymentStatus: "PENDING" | "PAID_APP" | "PAID_MANUAL" | "SUCCESS" | "FAILED" | "CANCELLED";
    providerPaymentId?: string;
    providerOrderId?: string;
    manualPaymentType?: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
    manualNote?: string;
    markedBy?: { name?: string; email?: string };
    paidDate?: string;
    createdAt?: string;
    receiptNo?: string;
    invoiceMonth?: string;
}

export const PaymentsSection: React.FC<PaymentsSectionProps> = ({
    orgId,
    isOwnerOrAdmin,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { currentUnitId } = useSelector((state: RootState) => state.organization);
    const [searchParams] = useSearchParams();
    const urlUnitId = searchParams.get("unitId");
    const activeContextUnitId = urlUnitId || currentUnitId;

    const [activeSubTab, setActiveSubTab] = useState<"settings" | "history">("history");
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Owner Settings State
    const [upiId, setUpiId] = useState<string>("");
    const [accountHolderName, setAccountHolderName] = useState<string>("");
    const [accountNumber, setAccountNumber] = useState<string>("");
    const [ifscCode, setIfscCode] = useState<string>("");
    const [bankName, setBankName] = useState<string>("");
    const [rzpKeyId, setRzpKeyId] = useState<string>("");
    const [rzpKeySecret, setRzpKeySecret] = useState<string>("");
    const [rzpIsConfigured, setRzpIsConfigured] = useState<boolean>(false);

    // Unit Records & Payments State
    const [unitList, setUnitList] = useState<any[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [paymentsHistory, setPaymentsHistory] = useState<PaymentRecord[]>([]);

    // Tenant Razorpay Flow state
    const [rzpProcessing, setRzpProcessing] = useState<boolean>(false);

    // Manual Payment Modal state (Owner/Admin)
    const [isMarkModalOpen, setIsMarkModalOpen] = useState<boolean>(false);
    const [markUnitId, setMarkUnitId] = useState<string>("");
    const [markAmount, setMarkAmount] = useState<number>(8500);
    const [markMode, setMarkMode] = useState<"CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE">("CASH");
    const [markDate, setMarkDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [markNote, setMarkNote] = useState<string>("");
    const [markingSubmitting, setMarkingSubmitting] = useState<boolean>(false);

    // Copy notification
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const isOwner = user?.role === "OWNER";

    useEffect(() => {
        loadData();
    }, [orgId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [orgRes, groupedRes, historyRes] = await Promise.allSettled([
                getOrganizationApi(orgId),
                getUsersGroupedByUnitApi(orgId),
                getPaymentHistoryApi(orgId),
            ]);

            if (orgRes.status === "fulfilled" && orgRes.value.success && orgRes.value.data?.organization) {
                const org = orgRes.value.data.organization;
                if (org.bankDetails) {
                    setUpiId(org.bankDetails.upiId || "");
                    setAccountHolderName(org.bankDetails.accountHolderName || "");
                    setAccountNumber(org.bankDetails.accountNumber || "");
                    setIfscCode(org.bankDetails.ifscCode || "");
                    setBankName(org.bankDetails.bankName || "");
                }
                if (org.razorpayConfig) {
                    setRzpKeyId(org.razorpayConfig.keyId || "");
                    setRzpKeySecret(org.razorpayConfig.keySecret || "");
                    setRzpIsConfigured(Boolean(org.razorpayConfig.isConfigured));
                }
            }

            let rawUnits: any[] = [];
            if (groupedRes.status === "fulfilled" && groupedRes.value.success && groupedRes.value.data) {
                rawUnits = groupedRes.value.data.units || groupedRes.value.data.unitsWithOccupants || [];
                
                // For Tenants: Filter for assigned unit or matching urlUnitId
                if (!isOwnerOrAdmin) {
                    if (urlUnitId) {
                        const target = rawUnits.find((uObj: any) => {
                            const u = uObj.unit || uObj;
                            return String(u._id || u.id) === String(urlUnitId);
                        });
                        if (target) rawUnits = [target];
                    } else if (user) {
                        const uEmail = user.email?.toLowerCase();
                        const uPhone = user.phone;
                        const assigned = rawUnits.filter((uObj: any) => {
                            const occs = uObj.occupants || [];
                            return occs.some((occ: any) => {
                                const e = occ.email?.toLowerCase();
                                const p = occ.phone;
                                return (uEmail && e === uEmail) || (uPhone && p === uPhone);
                            });
                        });
                        if (assigned.length > 0) rawUnits = assigned;
                    }
                }

                setUnitList(rawUnits);
                if (urlUnitId) {
                    setSelectedUnitId(String(urlUnitId));
                } else if (rawUnits.length > 0) {
                    const firstU = rawUnits[0].unit || rawUnits[0];
                    setSelectedUnitId(String(firstU._id || firstU.id));
                }
            }

            if (historyRes.status === "fulfilled" && historyRes.value?.success) {
                const historyList = historyRes.value.history || [];
                setPaymentsHistory(historyList);
            }
        } catch {
            // fallback
        } finally {
            setLoading(false);
        }
    };

    const handleSaveOwnerSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwner) return;

        setSaving(true);
        setMsg(null);
        try {
            const [bankRes, rzpRes] = await Promise.allSettled([
                updateOrganizationApi(orgId, {
                    bankDetails: {
                        upiId: upiId.trim(),
                        accountHolderName: accountHolderName.trim(),
                        accountNumber: accountNumber.trim(),
                        ifscCode: ifscCode.trim(),
                        bankName: bankName.trim(),
                    },
                }),
                updateOwnerRazorpayConfigApi(orgId, rzpKeyId.trim(), rzpKeySecret.trim()),
            ]);

            let success = true;
            if (bankRes.status === "fulfilled" && !bankRes.value.success) success = false;
            if (rzpRes.status === "fulfilled" && !rzpRes.value.success) success = false;

            if (success) {
                setMsg({ type: "success", text: "Owner payment settings & Razorpay credentials saved successfully!" });
                setRzpIsConfigured(Boolean(rzpKeyId && rzpKeySecret));
            } else {
                setMsg({ type: "error", text: "Failed to update payment settings." });
            }
        } catch {
            setMsg({ type: "error", text: "Error saving settings." });
        } finally {
            setSaving(false);
        }
    };

    // Dynamically load Razorpay Checkout SDK
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if ((window as any).Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Tenant In-App Razorpay Checkout Flow
    const handleRazorpayPayNow = async (targetUnitId: string, amount: number) => {
        setRzpProcessing(true);
        setMsg(null);
        try {
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                setMsg({ type: "error", text: "Failed to load Razorpay Checkout SDK. Please check connection." });
                setRzpProcessing(false);
                return;
            }

            // 1. Create Razorpay order on backend
            const orderRes = await initiateRazorpayOrderApi({
                orgId,
                unitId: targetUnitId,
                amount,
                billingMonth: "August 2026",
            });

            if (!orderRes.success || !orderRes.data) {
                throw new Error(orderRes.message || "Failed to create Razorpay Order.");
            }

            const { orderId, amount: amountPaise, currency, keyId } = orderRes.data;

            // 2. Open Razorpay Checkout modal
            const options = {
                key: keyId || "rzp_test_nestpaydemo",
                amount: amountPaise,
                currency: currency || "INR",
                name: "NestPay Rent Payment",
                description: "Monthly Rent Checkout",
                order_id: orderId,
                prefill: {
                    name: user?.name || "Tenant",
                    email: user?.email || "tenant@example.com",
                    contact: user?.phone || "9876543210",
                },
                theme: {
                    color: "#4f46e5",
                },
                handler: async (response: any) => {
                    // 3. Server-side HMAC Verification
                    try {
                        const verifyRes = await verifyRazorpayPaymentApi({
                            orgId,
                            orderId: response.razorpay_order_id,
                            paymentId: response.razorpay_payment_id,
                            signature: response.razorpay_signature,
                        });

                        if (verifyRes.success) {
                            setMsg({ type: "success", text: "Payment verified successfully via Razorpay!" });
                            loadData();
                        } else {
                            setMsg({ type: "error", text: verifyRes.message || "Payment signature verification failed." });
                        }
                    } catch (vErr: any) {
                        setMsg({ type: "error", text: vErr.message || "Error verifying payment on server." });
                    }
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err: any) {
            setMsg({ type: "error", text: err.message || "Razorpay initiation error." });
        } finally {
            setRzpProcessing(false);
        }
    };

    // Instant Sample Test Payment Handler (Bypasses external popup for instant test)
    const handleInstantSampleTestPayment = async (targetUnitId: string, amount: number) => {
        setRzpProcessing(true);
        setMsg(null);
        try {
            const orderRes = await initiateRazorpayOrderApi({
                orgId,
                unitId: targetUnitId,
                amount,
                billingMonth: "August 2026",
            });

            const orderId = orderRes?.data?.orderId || `order_test_${Date.now()}`;
            const mockPayId = `pay_sample_test_${Math.random().toString(36).substring(2, 9)}`;

            const verifyRes = await verifyRazorpayPaymentApi({
                orgId,
                orderId,
                paymentId: mockPayId,
                signature: "test_signature",
            });

            if (verifyRes.success) {
                setMsg({ type: "success", text: "Sample test payment completed & verified successfully!" });
                loadData();
            } else {
                setMsg({ type: "error", text: verifyRes.message || "Failed to process sample test payment." });
            }
        } catch (err: any) {
            setMsg({ type: "error", text: err.message || "Sample test payment error." });
        } finally {
            setRzpProcessing(false);
        }
    };

    // Owner submits Manual Payment
    const handleOpenMarkModal = (uId: string, rentAmt: number) => {
        setMarkUnitId(uId);
        setMarkAmount(rentAmt + 1500);
        setIsMarkModalOpen(true);
    };

    const handleSubmitManualMark = async (e: React.FormEvent) => {
        e.preventDefault();
        setMarkingSubmitting(true);
        try {
            const res = await markManualPaymentApi({
                orgId,
                unitId: markUnitId,
                amount: markAmount,
                billingMonth: "August 2026",
                manualPaymentType: markMode,
                manualNote: markNote,
                paidDate: markDate,
            });

            if (res.success) {
                setMsg({ type: "success", text: "Payment marked as paid manually!" });
                setIsMarkModalOpen(false);
                setMarkNote("");
                loadData();
            } else {
                setMsg({ type: "error", text: res.message || "Failed to mark payment." });
            }
        } catch (err: any) {
            setMsg({ type: "error", text: err.message || "Error marking payment manually." });
        } finally {
            setMarkingSubmitting(false);
        }
    };

    // Owner Undoes Manual Payment
    const handleUndoManual = async (paymentId: string) => {
        if (!window.confirm("Are you sure you want to undo/revert this manual payment record?")) return;
        try {
            const res = await undoManualPaymentApi(paymentId, orgId);
            if (res.success) {
                setMsg({ type: "success", text: "Manual payment reverted to unpaid status." });
                loadData();
            } else {
                setMsg({ type: "error", text: res.message || "Failed to undo payment." });
            }
        } catch (err: any) {
            setMsg({ type: "error", text: err.message || "Error undoing payment." });
        }
    };

    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const displayUpiId = upiId || "owner@upi";
    const displayHolder = accountHolderName || "Property Owner";
    const upiUri = `upi://pay?pa=${displayUpiId}&pn=${encodeURIComponent(displayHolder)}&cu=INR`;
    const previewQrUrl = displayUpiId
        ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiUri)}`
        : "";

    if (loading) {
        return (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "0.95rem" }}>Loading payment module...</p>
            </div>
        );
    }

    /* ========================================================================= */
    /* TENANT POV: Dedicated Owner Payment Details & In-App Razorpay Checkout    */
    /* ========================================================================= */
    if (!isOwnerOrAdmin) {
        const targetObj = unitList.find((uObj: any) => {
            const u = uObj.unit || uObj;
            const uId = String(u._id || u.id);
            return (activeContextUnitId && uId === String(activeContextUnitId)) || (selectedUnitId && uId === String(selectedUnitId));
        }) || unitList[0] || {};

        const activeUnitObj = targetObj.unit || targetObj || {};
        const activeUnitId = String(activeUnitObj._id || activeUnitObj.id || "default");
        const activeUnitNum = activeUnitObj.unitNumber || "101";
        const baseRent = activeUnitObj.rentAmount || 7000;
        const totalDue = baseRent + 1500;

        const currentPaid = paymentsHistory.find(
            (p) => String(p.unitId) === activeUnitId && (p.paymentStatus === "PAID_APP" || p.paymentStatus === "PAID_MANUAL" || p.paymentStatus === "SUCCESS")
        );

        return (
            <div className="fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
                    <div style={{ marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Rent Checkout & Payment
                        </h2>
                        <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "4px 0 0" }}>
                            Pay your monthly rent directly via Razorpay or direct bank transfer.
                        </p>
                    </div>

                    {msg && (
                        <div
                            style={{
                                padding: "12px 16px",
                                borderRadius: "10px",
                                marginBottom: "20px",
                                backgroundColor: msg.type === "success" ? "#dcfce7" : "#fee2e2",
                                color: msg.type === "success" ? "#166534" : "#991b1b",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                            }}
                        >
                            {msg.text}
                        </div>
                    )}

                    {/* Rent Demand / Status Card */}
                    <div style={{ backgroundColor: currentPaid ? "#f0fdf4" : "#eef2ff", border: `1px solid ${currentPaid ? "#bbf7d0" : "#c7d2fe"}`, borderRadius: "14px", padding: "20px", marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: currentPaid ? "#166534" : "#4338ca", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Current Rent Demand — Unit {activeUnitNum} (August 2026)
                            </span>
                            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                                ₹{totalDue.toLocaleString()}
                            </div>
                            <div style={{ fontSize: "0.825rem", color: "#64748b", marginTop: "2px" }}>
                                Base Rent: ₹{baseRent.toLocaleString()} • EB & Housekeeping: ₹1,500
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                            {currentPaid ? (
                                <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "8px 18px", borderRadius: "9999px", fontWeight: 800, fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                    ✓ {currentPaid.paymentStatus === "PAID_APP" ? "Paid — via App (Razorpay Test)" : "Paid — Manually"}
                                </span>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleRazorpayPayNow(activeUnitId, totalDue)}
                                        disabled={rzpProcessing}
                                        style={{
                                            backgroundColor: "#4f46e5",
                                            color: "#ffffff",
                                            fontWeight: 800,
                                            fontSize: "0.9rem",
                                            padding: "12px 20px",
                                            borderRadius: "10px",
                                            border: "none",
                                            cursor: "pointer",
                                            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        {rzpProcessing ? "Opening..." : "💳 Pay Now with Razorpay"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleInstantSampleTestPayment(activeUnitId, totalDue)}
                                        disabled={rzpProcessing}
                                        style={{
                                            backgroundColor: "#166534",
                                            color: "#ffffff",
                                            fontWeight: 800,
                                            fontSize: "0.9rem",
                                            padding: "12px 20px",
                                            borderRadius: "10px",
                                            border: "none",
                                            cursor: "pointer",
                                            boxShadow: "0 4px 12px rgba(22, 101, 52, 0.3)",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        ⚡ Sample Test Pay via Razorpay
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Receipt Details if Paid */}
                    {currentPaid && (
                        <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
                            <h4 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                                Payment Confirmation Details
                            </h4>
                            <div style={{ fontSize: "0.85rem", color: "#475569", display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div><strong>Status:</strong> {currentPaid.paymentStatus === "PAID_APP" ? "Paid via App (Razorpay Test)" : "Paid Manually"}</div>
                                {currentPaid.providerPaymentId && <div><strong>Razorpay Payment ID:</strong> <code style={{ backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>{currentPaid.providerPaymentId}</code></div>}
                                {currentPaid.manualPaymentType && <div><strong>Payment Mode:</strong> {currentPaid.manualPaymentType}</div>}
                                {currentPaid.manualNote && <div><strong>Note:</strong> {currentPaid.manualNote}</div>}
                                <div><strong>Date Recorded:</strong> {currentPaid.paidDate ? new Date(currentPaid.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                            </div>
                        </div>
                    )}

                    {/* Manual Fallback: Owner Details & QR */}
                    <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px dashed #e2e8f0" }}>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px" }}>
                            Direct UPI & Bank Transfer Fallback
                        </h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "24px", alignItems: "start" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Owner UPI ID</div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                                        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>{displayUpiId}</span>
                                        <button type="button" onClick={() => handleCopy(displayUpiId, "upi")} style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 700, cursor: "pointer" }}>
                                            {copiedField === "upi" ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Account Holder</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginTop: "4px" }}>{displayHolder}</div>
                                </div>

                                <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Bank Account & IFSC</div>
                                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginTop: "4px" }}>
                                        {accountNumber ? `${accountNumber} (${ifscCode})` : "Not provided by owner"}
                                    </div>
                                </div>
                            </div>

                            {previewQrUrl && (
                                <div style={{ textAlign: "center", backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                                    <img src={previewQrUrl} alt="UPI Payment QR Code" style={{ width: "180px", height: "180px", borderRadius: "8px" }} />
                                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, marginTop: "8px" }}>
                                        Scan with any UPI App
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ========================================================================= */
    /* OWNER / ADMIN POV: Payment Settings & Rent Collection Ledger             */
    /* ========================================================================= */
    return (
        <div className="fade-in" style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* Top Sub-Tab Navigation */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "2px solid #e2e8f0", paddingBottom: "12px" }}>
                <button
                    type="button"
                    onClick={() => setActiveSubTab("history")}
                    style={{
                        padding: "8px 20px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activeSubTab === "history" ? "#4f46e5" : "transparent",
                        color: activeSubTab === "history" ? "#ffffff" : "#475569",
                        fontWeight: 800,
                        fontSize: "0.925rem",
                        cursor: "pointer",
                    }}
                >
                    Unit Rent Collection Ledger
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSubTab("settings")}
                    style={{
                        padding: "8px 20px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activeSubTab === "settings" ? "#4f46e5" : "transparent",
                        color: activeSubTab === "settings" ? "#ffffff" : "#475569",
                        fontWeight: 800,
                        fontSize: "0.925rem",
                        cursor: "pointer",
                    }}
                >
                    Owner Payment Settings & Credentials
                </button>
            </div>

            {msg && (
                <div
                    style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        backgroundColor: msg.type === "success" ? "#dcfce7" : "#fee2e2",
                        color: msg.type === "success" ? "#166534" : "#991b1b",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                    }}
                >
                    {msg.text}
                </div>
            )}

            {/* SUB-TAB 1: RENT COLLECTION LEDGER & MANUAL MARK */}
            {activeSubTab === "history" && (
                <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "24px" }}>
                    {/* Unit List Sidebar */}
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "16px" }}>
                        <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                            Property Units
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {unitList.map((uObj: any) => {
                                const u = uObj.unit || uObj;
                                const uId = String(u._id || u.id);
                                const isSelected = uId === selectedUnitId;
                                return (
                                    <button
                                        key={uId}
                                        type="button"
                                        onClick={() => setSelectedUnitId(uId)}
                                        style={{
                                            padding: "10px 14px",
                                            borderRadius: "8px",
                                            border: "1px solid",
                                            borderColor: isSelected ? "#4f46e5" : "#e2e8f0",
                                            backgroundColor: isSelected ? "#eef2ff" : "#ffffff",
                                            color: isSelected ? "#4f46e5" : "#1e293b",
                                            fontWeight: 700,
                                            textAlign: "left",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <span>Unit {u.unitNumber || "101"}</span>
                                        <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>₹{(u.rentAmount || 6500).toLocaleString()}/mo</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Unit Payment History Content */}
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px" }}>
                        {(() => {
                            const selectedUnitObj = unitList.find((uObj: any) => String((uObj.unit || uObj)._id || (uObj.unit || uObj).id) === selectedUnitId);
                            const u = selectedUnitObj?.unit || selectedUnitObj || {};
                            const uNum = u.unitNumber || "101";
                            const uRent = u.rentAmount || 6500;

                            const unitPayments = paymentsHistory.filter((p) => String(p.unitId) === selectedUnitId);
                            const isCurrentlyPaid = unitPayments.some(
                                (p) => p.paymentStatus === "PAID_APP" || p.paymentStatus === "PAID_MANUAL" || p.paymentStatus === "SUCCESS"
                            );

                            return (
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                                Unit {uNum} Payment Ledger
                                            </h3>
                                            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                                Base Rent: ₹{uRent.toLocaleString()} • Status: {isCurrentlyPaid ? "Paid" : "Unpaid"}
                                            </p>
                                        </div>

                                        {!isCurrentlyPaid && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenMarkModal(selectedUnitId || "", uRent)}
                                                style={{
                                                    backgroundColor: "#166534",
                                                    color: "#ffffff",
                                                    fontWeight: 700,
                                                    fontSize: "0.875rem",
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                + Mark as Paid
                                            </button>
                                        )}
                                    </div>

                                    {/* Payment Records Table / List */}
                                    {unitPayments.length === 0 ? (
                                        <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                                            No payment records recorded yet for Unit {uNum}.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {unitPayments.map((p) => {
                                                const isPaidApp = p.paymentStatus === "PAID_APP" || p.paymentStatus === "SUCCESS";
                                                const isPaidManual = p.paymentStatus === "PAID_MANUAL";

                                                return (
                                                    <div
                                                        key={p._id}
                                                        style={{
                                                            padding: "16px",
                                                            borderRadius: "10px",
                                                            border: "1px solid #e2e8f0",
                                                            backgroundColor: isPaidApp || isPaidManual ? "#f0fdf4" : "#ffffff",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>
                                                                ₹{p.amount.toLocaleString()} ({p.invoiceMonth || "August 2026"})
                                                            </div>
                                                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                                                {isPaidApp && `Paid via App • Razorpay ID: ${p.providerPaymentId || "pay_demo"}`}
                                                                {isPaidManual && `Paid Manually (${p.manualPaymentType || "Cash"}) • By ${p.markedBy?.name || "Owner/Admin"}`}
                                                                {!isPaidApp && !isPaidManual && `Status: ${p.paymentStatus}`}
                                                                {p.paidDate && ` • ${new Date(p.paidDate).toLocaleDateString()}`}
                                                            </div>
                                                            {p.manualNote && <div style={{ fontSize: "0.775rem", color: "#475569", marginTop: "4px" }}>Note: {p.manualNote}</div>}
                                                        </div>

                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 800,
                                                                    padding: "4px 12px",
                                                                    borderRadius: "9999px",
                                                                    backgroundColor: isPaidApp ? "#dcfce7" : isPaidManual ? "#dbeafe" : "#fee2e2",
                                                                    color: isPaidApp ? "#166534" : isPaidManual ? "#1e40af" : "#991b1b",
                                                                }}
                                                            >
                                                                {isPaidApp ? "Paid — via App" : isPaidManual ? "Paid — Manually" : p.paymentStatus}
                                                            </span>

                                                            {isPaidManual && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUndoManual(p._id)}
                                                                    style={{
                                                                        fontSize: "0.775rem",
                                                                        fontWeight: 700,
                                                                        color: "#dc2626",
                                                                        background: "none",
                                                                        border: "none",
                                                                        cursor: "pointer",
                                                                        textDecoration: "underline",
                                                                    }}
                                                                >
                                                                    Undo
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* SUB-TAB 2: OWNER BANK & RAZORPAY CONFIG */}
            {activeSubTab === "settings" && (
                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "28px" }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 20px" }}>
                        Owner Razorpay Credentials & Bank Details
                    </h3>

                    <form onSubmit={handleSaveOwnerSettings} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Razorpay Config Section */}
                        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#4f46e5" }}>
                                    Razorpay API Credentials (Test Mode / Live)
                                </h4>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: rzpIsConfigured ? "#dcfce7" : "#fef3c7", color: rzpIsConfigured ? "#166534" : "#92400e", padding: "3px 10px", borderRadius: "9999px" }}>
                                    {rzpIsConfigured ? "Custom Razorpay Active" : "Default Sandbox Active"}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                        Razorpay Key ID
                                    </label>
                                    <input
                                        type="text"
                                        value={rzpKeyId}
                                        onChange={(e) => setRzpKeyId(e.target.value)}
                                        disabled={!isOwner}
                                        placeholder="rzp_test_..."
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                        Razorpay Key Secret (Server-only)
                                    </label>
                                    <input
                                        type="password"
                                        value={rzpKeySecret}
                                        onChange={(e) => setRzpKeySecret(e.target.value)}
                                        disabled={!isOwner}
                                        placeholder="••••••••••••••••"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bank Details Section */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                    UPI ID
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    disabled={!isOwner}
                                    placeholder="owner@upi"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                    disabled={!isOwner}
                                    placeholder="Owner Name"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                    Bank Account Number
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    disabled={!isOwner}
                                    placeholder="918273645102"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
                                    IFSC Code
                                </label>
                                <input
                                    type="text"
                                    value={ifscCode}
                                    onChange={(e) => setIfscCode(e.target.value)}
                                    disabled={!isOwner}
                                    placeholder="SBIN0001234"
                                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>
                        </div>

                        {isOwner && (
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    alignSelf: "flex-start",
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    padding: "12px 28px",
                                    borderRadius: "10px",
                                    border: "none",
                                    cursor: "pointer",
                                    marginTop: "12px",
                                }}
                            >
                                {saving ? "Saving Settings..." : "Save Owner Credentials & Details"}
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* MANUAL PAYMENT MARK MODAL */}
            {isMarkModalOpen && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
                        <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                            Mark Rent as Paid Manually
                        </h3>

                        <form onSubmit={handleSubmitManualMark} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Amount (₹)</label>
                                <input
                                    type="number"
                                    value={markAmount}
                                    onChange={(e) => setMarkAmount(Number(e.target.value))}
                                    required
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Payment Date</label>
                                <input
                                    type="date"
                                    value={markDate}
                                    onChange={(e) => setMarkDate(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Payment Mode</label>
                                <select
                                    value={markMode}
                                    onChange={(e) => setMarkMode(e.target.value as any)}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                                    <option value="UPI">Direct UPI</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "4px" }}>Note / Reference (Optional)</label>
                                <textarea
                                    value={markNote}
                                    onChange={(e) => setMarkNote(e.target.value)}
                                    placeholder="e.g. Paid in cash directly to owner on 5th Aug"
                                    rows={2}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsMarkModalOpen(false)}
                                    style={{ padding: "10px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "none", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={markingSubmitting}
                                    style={{ padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#166534", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                                >
                                    {markingSubmitting ? "Saving..." : "Confirm Paid"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsSection;
