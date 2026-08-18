import React, { useEffect, useState } from "react";
import {
    getReminderLogsApi,
    getConfirmationLogsApi,
    type ReminderLogData,
    type PaymentConfirmationLogData,
} from "../services/invoiceApi";

interface InvoiceLogsSectionProps {
    orgId: string;
    unitId: string;
}

export const InvoiceLogsSection: React.FC<InvoiceLogsSectionProps> = ({ orgId, unitId }) => {
    const [activeSubTab, setActiveSubTab] = useState<"reminders" | "confirmations">("reminders");
    const [reminderLogs, setReminderLogs] = useState<ReminderLogData[]>([]);
    const [confirmationLogs, setConfirmationLogs] = useState<PaymentConfirmationLogData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadLogs();
    }, [orgId, unitId]);

    const loadLogs = async () => {
        setLoading(true);
        setError(null);
        try {
            const [remRes, confRes] = await Promise.all([
                getReminderLogsApi(orgId, unitId),
                getConfirmationLogsApi(orgId, unitId),
            ]);

            if (remRes.success && remRes.data) {
                setReminderLogs(remRes.data);
            }
            if (confRes.success && confRes.data) {
                setConfirmationLogs(confRes.data);
            }
        } catch {
            setError("Failed to load invoice logs.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>Loading unit invoice logs...</p>
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                marginTop: "24px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                        Invoice Section Logs (Read-Only System Audit)
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                        Auto-populated dispatch records for automated & manual reminders and payment receipts.
                    </p>
                </div>

                {/* Sub Tab Switcher */}
                <div style={{ display: "flex", gap: "6px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("reminders")}
                        style={{
                            padding: "6px 14px",
                            border: "none",
                            borderRadius: "8px",
                            backgroundColor: activeSubTab === "reminders" ? "#ffffff" : "transparent",
                            color: activeSubTab === "reminders" ? "#4f46e5" : "#64748b",
                            fontWeight: activeSubTab === "reminders" ? 800 : 600,
                            fontSize: "0.825rem",
                            cursor: "pointer",
                            boxShadow: activeSubTab === "reminders" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}
                    >
                        Payment Reminder Log ({reminderLogs.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("confirmations")}
                        style={{
                            padding: "6px 14px",
                            border: "none",
                            borderRadius: "8px",
                            backgroundColor: activeSubTab === "confirmations" ? "#ffffff" : "transparent",
                            color: activeSubTab === "confirmations" ? "#059669" : "#64748b",
                            fontWeight: activeSubTab === "confirmations" ? 800 : 600,
                            fontSize: "0.825rem",
                            cursor: "pointer",
                            boxShadow: activeSubTab === "confirmations" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        }}
                    >
                        Payment Confirmation Log ({confirmationLogs.length})
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "12px" }}>{error}</div>
            )}

            {/* TAB 1: Payment Reminder Log */}
            {activeSubTab === "reminders" && (
                <div>
                    {reminderLogs.length === 0 ? (
                        <div style={{ padding: "28px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", color: "#64748b", fontSize: "0.875rem" }}>
                            No payment reminders have been sent for this unit yet.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Date & Time</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Trigger / Day Rule</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Recipient(s)</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Channels</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Amount</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reminderLogs.map((log) => (
                                        <tr key={log._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>
                                                {formatDate(log.sentAt)}
                                            </td>
                                            <td style={{ padding: "12px", fontWeight: 700, color: "#4f46e5" }}>
                                                {log.dayRule}
                                            </td>
                                            <td style={{ padding: "12px", color: "#334155" }}>
                                                {log.recipients.map((r, idx) => (
                                                    <div key={idx} style={{ fontWeight: 600 }}>
                                                        👤 {r.name} {r.phone ? `(${r.phone})` : ""}
                                                    </div>
                                                ))}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                    {log.channels.map((ch, idx) => (
                                                        <span key={idx} style={{ fontSize: "0.725rem", backgroundColor: "#eef2ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px", fontWeight: 800, color: "#0f172a" }}>
                                                ₹{log.amount?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        fontWeight: 800,
                                                        padding: "2px 8px",
                                                        borderRadius: "9999px",
                                                        backgroundColor: log.status === "SUCCESS" ? "#dcfce7" : "#fee2e2",
                                                        color: log.status === "SUCCESS" ? "#166534" : "#991b1b",
                                                    }}
                                                >
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Payment Confirmation Log */}
            {activeSubTab === "confirmations" && (
                <div>
                    {confirmationLogs.length === 0 ? (
                        <div style={{ padding: "28px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px", color: "#64748b", fontSize: "0.875rem" }}>
                            No payment confirmation records exist for this unit yet.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Date & Time</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Payment Mode</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Recipient(s)</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Channels</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Amount</th>
                                        <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: 700 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {confirmationLogs.map((log) => (
                                        <tr key={log._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>
                                                {formatDate(log.sentAt)}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{ fontSize: "0.775rem", fontWeight: 800, backgroundColor: "#ecfdf5", color: "#065f46", padding: "3px 10px", borderRadius: "6px" }}>
                                                    {log.paymentMode}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", color: "#334155" }}>
                                                {log.recipients.map((r, idx) => (
                                                    <div key={idx} style={{ fontWeight: 600 }}>
                                                        👤 {r.name} {r.phone ? `(${r.phone})` : ""}
                                                    </div>
                                                ))}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                    {log.channels.map((ch, idx) => (
                                                        <span key={idx} style={{ fontSize: "0.725rem", backgroundColor: "#eef2ff", color: "#3730a3", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                                                            {ch}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px", fontWeight: 800, color: "#059669" }}>
                                                ₹{log.amount?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span
                                                    style={{
                                                        fontSize: "0.75rem",
                                                        fontWeight: 800,
                                                        padding: "2px 8px",
                                                        borderRadius: "9999px",
                                                        backgroundColor: log.status === "SUCCESS" ? "#dcfce7" : "#fee2e2",
                                                        color: log.status === "SUCCESS" ? "#166534" : "#991b1b",
                                                    }}
                                                >
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default InvoiceLogsSection;
