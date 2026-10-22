import React, { useState, useEffect } from "react";
import { openWhatsAppDirect, normalizePhoneNumber } from "@/utils/whatsappLink";
import api from "@/services/api";

export interface ManualWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSent?: () => void;
    orgId?: string;
    unitId?: string;
    unitNumber?: string;
    tenantName?: string;
    tenantPhone?: string;
    amount?: number | string;
    dueDate?: string;
    orgName?: string;
    customMessage?: string;
    notificationId?: string;
}

export const ManualWhatsAppModal: React.FC<ManualWhatsAppModalProps> = ({
    isOpen,
    onClose,
    onSent,
    orgId,
    unitId,
    unitNumber = "101",
    tenantName = "Tenant",
    tenantPhone = "",
    amount = 8500,
    dueDate = "10th of this month",
    orgName = "NestPay Property",
    customMessage,
    notificationId,
}) => {
    const defaultTemplate = `Hi ${tenantName},\n\nThis is a friendly reminder that your rent and maintenance of ₹${Number(amount).toLocaleString()} for ${orgName} (Unit ${unitNumber}) is due on ${dueDate}.\n\nPlease complete your payment at your earliest convenience.\n\nThank you!`;

    const [messageText, setMessageText] = useState<string>(customMessage || defaultTemplate);
    const [recipientPhone, setRecipientPhone] = useState<string>(tenantPhone);
    const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState<boolean>(false);
    const [phoneError, setPhoneError] = useState<string>("");
    const [isMarking, setIsMarking] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<string>("");

    useEffect(() => {
        if (isOpen) {
            setMessageText(customMessage || defaultTemplate);
            setRecipientPhone(tenantPhone);
            setHasOpenedWhatsApp(false);
            setPhoneError("");
            setStatusMsg("");
        }
    }, [isOpen, tenantName, tenantPhone, amount, dueDate, unitNumber, orgName, customMessage]);

    if (!isOpen) return null;

    const handleOpenWhatsApp = () => {
        setPhoneError("");
        const norm = normalizePhoneNumber(recipientPhone);
        if (!norm.isValid) {
            setPhoneError(norm.error || "Invalid phone number for this tenant — please update their contact details.");
            return;
        }

        const res = openWhatsAppDirect(recipientPhone, messageText);
        if (res.success) {
            setHasOpenedWhatsApp(true);
            setStatusMsg("WhatsApp opened in new tab! You can now hit send in WhatsApp, then click 'Mark as Sent' below.");
        } else {
            setPhoneError(res.error || "Failed to generate WhatsApp link.");
        }
    };

    const handleMarkAsSent = async () => {
        setIsMarking(true);
        try {
            // Single call: logs manual send AND marks notification as SENT in backend
            if (orgId && unitId) {
                await api.post(`/notifications/whatsapp/log-manual-send`, {
                    organizationId: orgId,
                    unitId,
                    tenantName,
                    phone: recipientPhone,
                    amount: Number(amount) || 0,
                    dueDate,
                    notificationId: notificationId || undefined,
                }).catch(() => {});
            } else if (notificationId) {
                // No unit context — just mark notification as read
                await api.patch(`/notifications/${notificationId}/read`).catch(() => {});
            }

            setStatusMsg("✓ Marked as sent! Reminder log updated.");
            setTimeout(() => {
                if (onSent) onSent();
                onClose();
            }, 800);
        } catch {
            onClose();
        } finally {
            setIsMarking(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: "16px",
            }}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "18px",
                    maxWidth: "540px",
                    width: "100%",
                    padding: "26px 28px",
                    boxShadow: "0 20px 30px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                backgroundColor: "#25D366",
                                color: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.4rem",
                                fontWeight: 800,
                            }}
                        >
                            💬
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                Send via WhatsApp
                            </h3>
                            <p style={{ margin: "2px 0 0", fontSize: "0.825rem", color: "#64748b" }}>
                                Unit {unitNumber} &bull; {tenantName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.3rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Recipient Details & Phone Input */}
                <div
                    style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#334155" }}>
                        <span>Tenant: <strong>{tenantName}</strong></span>
                        <span>Amount: <strong style={{ color: "#166534" }}>₹{Number(amount).toLocaleString()}</strong></span>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginBottom: "4px", textTransform: "uppercase" }}>
                            Recipient WhatsApp Phone Number
                        </label>
                        <input
                            type="text"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            placeholder="e.g. 9677708612 or +91 96777 08612"
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: phoneError ? "1px solid #ef4444" : "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                fontWeight: 700,
                                color: "#0f172a",
                                backgroundColor: "#ffffff",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>

                    {phoneError && (
                        <div style={{ color: "#dc2626", fontSize: "0.8rem", fontWeight: 600 }}>
                            ⚠️ {phoneError}
                        </div>
                    )}
                </div>

                {/* Message Editor */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <label style={{ fontSize: "0.775rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                            Pre-filled Message Preview (Editable)
                        </label>
                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                            {messageText.length} characters
                        </span>
                    </div>
                    <textarea
                        rows={6}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.875rem",
                            lineHeight: 1.5,
                            fontFamily: "inherit",
                            color: "#0f172a",
                            backgroundColor: "#ffffff",
                            boxSizing: "border-box",
                        }}
                    />
                </div>

                {statusMsg && (
                    <div
                        style={{
                            backgroundColor: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            color: "#166534",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            fontSize: "0.825rem",
                            fontWeight: 600,
                        }}
                    >
                        ✅ {statusMsg}
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button
                        type="button"
                        onClick={handleOpenWhatsApp}
                        style={{
                            flex: 1,
                            backgroundColor: "#25D366",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px",
                            fontWeight: 800,
                            fontSize: "0.925rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                        }}
                    >
                        <span>💬</span>
                        <span>{hasOpenedWhatsApp ? "Re-open WhatsApp" : "Send via WhatsApp"}</span>
                    </button>

                    {hasOpenedWhatsApp && (
                        <button
                            type="button"
                            onClick={handleMarkAsSent}
                            disabled={isMarking}
                            style={{
                                flex: 1,
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "10px",
                                padding: "12px",
                                fontWeight: 800,
                                fontSize: "0.925rem",
                                cursor: isMarking ? "not-allowed" : "pointer",
                                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                            }}
                        >
                            {isMarking ? "Recording..." : "✓ Mark as Sent"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManualWhatsAppModal;
