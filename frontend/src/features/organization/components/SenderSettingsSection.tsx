import React, { useEffect, useState } from "react";
import {
    getOrganizationApi,
    updateOrganizationApi,
    getWhatsAppConfigApi,
    updateWhatsAppConfigApi,
    sendTestNotificationApi,
} from "../services/organizationApi";

interface SenderSettingsSectionProps {
    orgId: string;
    isOwnerOrAdmin: boolean;
}

export const SenderSettingsSection: React.FC<SenderSettingsSectionProps> = ({
    orgId,
    isOwnerOrAdmin,
}) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSavingEmail, setIsSavingEmail] = useState<boolean>(false);
    const [isSavingWhatsApp, setIsSavingWhatsApp] = useState<boolean>(false);

    const [senderName, setSenderName] = useState<string>("");
    const [senderEmail, setSenderEmail] = useState<string>("");
    const [replyToEmail, setReplyToEmail] = useState<string>("");

    const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState<string>("");
    const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState<string>("");
    const [whatsappDisplayName, setWhatsappDisplayName] = useState<string>("");
    const [whatsappStatus, setWhatsappStatus] = useState<string>("INACTIVE");

    // Interactive Test Dispatch state
    const [testEmail, setTestEmail] = useState<string>("sanjay8612ssk@gmail.com");
    const [testPhone, setTestPhone] = useState<string>("8344226412");
    const [isTesting, setIsTesting] = useState<boolean>(false);
    const [testResultMsg, setTestResultMsg] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const [emailSuccessMsg, setEmailSuccessMsg] = useState<string>("");
    const [whatsappSuccessMsg, setWhatsappSuccessMsg] = useState<string>("");

    useEffect(() => {
        if (!orgId) return;
        setIsLoading(true);

        Promise.all([
            getOrganizationApi(orgId).catch(() => null),
            getWhatsAppConfigApi(orgId).catch(() => null),
        ])
            .then(([orgRes, waRes]) => {
                if (orgRes?.success && orgRes.data?.organization) {
                    const org = orgRes.data.organization;
                    const emailConfig = org.emailSenderConfig || {};
                    setSenderName(emailConfig.senderName || org.displayName || org.name || "");
                    setSenderEmail(emailConfig.senderEmail || org.email || "");
                    setReplyToEmail(emailConfig.replyToEmail || org.email || "");
                }

                if (waRes?.success && waRes.data) {
                    const wa = waRes.data;
                    setWhatsappPhoneNumberId(wa.phoneNumberId || "");
                    setWhatsappBusinessAccountId(wa.businessAccountId || "");
                    setWhatsappDisplayName(wa.displayName || "NestPay Notifications");
                    setWhatsappStatus(wa.status || "ACTIVE");
                }
            })
            .finally(() => setIsLoading(false));
    }, [orgId]);

    const handleSaveEmailSender = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwnerOrAdmin) return;

        setIsSavingEmail(true);
        setEmailSuccessMsg("");
        setErrorMsg("");

        try {
            const res = await updateOrganizationApi(orgId, {
                emailSenderConfig: {
                    senderName,
                    senderEmail,
                    replyToEmail,
                    isVerified: true,
                },
            });

            if (res.success) {
                setEmailSuccessMsg("Email sender identity updated successfully!");
                setTimeout(() => setEmailSuccessMsg(""), 4000);
            } else {
                setErrorMsg(res.message || "Failed to update email sender identity.");
            }
        } catch {
            setErrorMsg("Error connecting to server.");
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwnerOrAdmin) return;

        setIsSavingWhatsApp(true);
        setWhatsappSuccessMsg("");
        setErrorMsg("");

        try {
            const res = await updateWhatsAppConfigApi(orgId, {
                phoneNumberId: whatsappPhoneNumberId,
                businessAccountId: whatsappBusinessAccountId,
                displayName: whatsappDisplayName || "NestPay Notifications",
                status: whatsappPhoneNumberId ? "ACTIVE" : "INACTIVE",
            });

            if (res.success) {
                setWhatsappStatus(res.data?.status || "ACTIVE");
                setWhatsappSuccessMsg("WhatsApp sender credentials updated successfully!");
                setTimeout(() => setWhatsappSuccessMsg(""), 4000);
            } else {
                setErrorMsg(res.message || "Failed to update WhatsApp configuration.");
            }
        } catch {
            setErrorMsg("Error connecting to server.");
        } finally {
            setIsSavingWhatsApp(false);
        }
    };

    const handleRunTestDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOwnerOrAdmin) return;

        setIsTesting(true);
        setTestResultMsg("");
        setErrorMsg("");

        try {
            const res = await sendTestNotificationApi(orgId, {
                testEmail: testEmail.trim(),
                testPhone: testPhone.trim(),
            });

            if (res.success) {
                setTestResultMsg(res.message);
            } else {
                setErrorMsg(res.message || "Test dispatch failed.");
            }
        } catch {
            setErrorMsg("Error triggering test dispatch.");
        } finally {
            setIsTesting(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                Loading sender identity settings...
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {errorMsg && (
                <div
                    style={{
                        padding: "12px 16px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        color: "#991b1b",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                    }}
                >
                    ⚠️ {errorMsg}
                </div>
            )}

            {/* EMAIL SENDER SETUP */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                        borderBottom: "1px solid #f1f5f9",
                        paddingBottom: "12px",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                            📧 Owner Email Sender Identity
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Ensure tenant emails (rent demands, receipts, reminders) appear directly from your email identity.
                        </p>
                    </div>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            backgroundColor: senderEmail ? "#dcfce7" : "#fef3c7",
                            color: senderEmail ? "#166534" : "#92400e",
                        }}
                    >
                        {senderEmail ? "Verified Identity Active" : "Default Sender"}
                    </span>
                </div>

                <form onSubmit={handleSaveEmailSender} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Sender Display Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Rajesh (Green Heights Complex)"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                disabled={!isOwnerOrAdmin || isSavingEmail}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Owner Email Address</label>
                            <input
                                type="email"
                                placeholder="e.g. rajesh@gmail.com"
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                                disabled={!isOwnerOrAdmin || isSavingEmail}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Reply-To Email Address</label>
                            <input
                                type="email"
                                placeholder="e.g. rajesh@gmail.com"
                                value={replyToEmail}
                                onChange={(e) => setReplyToEmail(e.target.value)}
                                disabled={!isOwnerOrAdmin || isSavingEmail}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {emailSuccessMsg && (
                        <div style={{ color: "#16a34a", fontSize: "0.85rem", fontWeight: 700 }}>
                            ✅ {emailSuccessMsg}
                        </div>
                    )}

                    {isOwnerOrAdmin && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="submit"
                                disabled={isSavingEmail}
                                style={{
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    cursor: isSavingEmail ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSavingEmail ? "Saving Identity..." : "Save Email Sender Identity"}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* WHATSAPP BUSINESS SETUP */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                        borderBottom: "1px solid #f1f5f9",
                        paddingBottom: "12px",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                            💬 WhatsApp Sender Setup
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Connect your WhatsApp Business API number, or use NestPay's shared sender with clear on-behalf-of branding.
                        </p>
                    </div>
                    <span
                        style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "9999px",
                            backgroundColor: whatsappPhoneNumberId ? "#dcfce7" : "#e0f2fe",
                            color: whatsappPhoneNumberId ? "#166534" : "#0369a1",
                        }}
                    >
                        {whatsappPhoneNumberId ? `Connected Dedicated Number (${whatsappStatus})` : "Using Shared Number (On Behalf Of)"}
                    </span>
                </div>

                {!whatsappPhoneNumberId && (
                    <div
                        style={{
                            backgroundColor: "#f0f9ff",
                            border: "1px solid #bae6fd",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            fontSize: "0.85rem",
                            color: "#0369a1",
                            marginBottom: "16px",
                            lineHeight: 1.5,
                        }}
                    >
                        ℹ️ <strong>Current Mode:</strong> Using shared platform sender. All WhatsApp messages sent to tenants will be labeled with <em>"Sent on behalf of {senderName || "Owner"} — Organization"</em>. Enter your Meta WhatsApp Business API parameters below to switch to your own dedicated WhatsApp number.
                    </div>
                )}

                <form onSubmit={handleSaveWhatsAppConfig} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>WhatsApp Phone Number ID</label>
                            <input
                                type="text"
                                placeholder="e.g. 104829384729103"
                                value={whatsappPhoneNumberId}
                                onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                                disabled={!isOwnerOrAdmin || isSavingWhatsApp}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Meta Business Account ID</label>
                            <input
                                type="text"
                                placeholder="e.g. 204829384729104"
                                value={whatsappBusinessAccountId}
                                onChange={(e) => setWhatsappBusinessAccountId(e.target.value)}
                                disabled={!isOwnerOrAdmin || isSavingWhatsApp}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Sender Display Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Green Heights Property Management"
                                value={whatsappDisplayName}
                                onChange={(e) => setWhatsappDisplayName(e.target.value)}
                                disabled={!isOwnerOrAdmin || isSavingWhatsApp}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {whatsappSuccessMsg && (
                        <div style={{ color: "#16a34a", fontSize: "0.85rem", fontWeight: 700 }}>
                            ✅ {whatsappSuccessMsg}
                        </div>
                    )}

                    {isOwnerOrAdmin && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="submit"
                                disabled={isSavingWhatsApp}
                                style={{
                                    backgroundColor: "#059669",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    cursor: isSavingWhatsApp ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSavingWhatsApp ? "Saving WhatsApp Setup..." : "Save WhatsApp Credentials"}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* CARD 3: Live Multi-Channel Sender Identity Verification Test */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #e2e8f0",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "#fef3c7",
                            color: "#d97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "1.1rem",
                        }}
                    >
                        🧪
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                            Live Multi-Channel Sender Verification Test
                        </h3>
                        <p style={{ margin: 0, fontSize: "0.825rem", color: "#64748b" }}>
                            Trigger a test notice to verify your Owner Email and WhatsApp sender configuration.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleRunTestDispatch} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Recipient Test Email</label>
                            <input
                                type="email"
                                placeholder="e.g. sanjay8612ssk@gmail.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                disabled={!isOwnerOrAdmin || isTesting}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Recipient Test WhatsApp Phone</label>
                            <input
                                type="text"
                                placeholder="e.g. 8344226412"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                                disabled={!isOwnerOrAdmin || isTesting}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {testResultMsg && (
                        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700 }}>
                            🎉 {testResultMsg}
                        </div>
                    )}

                    {isOwnerOrAdmin && (
                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                type="submit"
                                disabled={isTesting}
                                style={{
                                    backgroundColor: "#d97706",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontSize: "0.875rem",
                                    fontWeight: 700,
                                    cursor: isTesting ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                }}
                            >
                                {isTesting ? "Executing Dispatch Test..." : "🧪 Send Test Email & WhatsApp Notice"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.775rem",
    fontWeight: 700,
    color: "#475569",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
};

export default SenderSettingsSection;
