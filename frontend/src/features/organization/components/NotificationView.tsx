import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { getNotificationsApi, acceptInvitationApi } from "../services/organizationApi";
import type { NotificationItem } from "../types/organization.types";

interface NotificationViewProps {
    onInviteAccepted?: () => void;
}

export const NotificationView: React.FC<NotificationViewProps> = ({ onInviteAccepted }) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await getNotificationsApi();
            if (res.success && res.data) {
                setNotifications(res.data);
            }
        } catch {
            // handle error silently
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptInvite = async (notifId: string, token?: string) => {
        if (!token) return;
        try {
            const res = await acceptInvitationApi(token);
            if (res.success) {
                setActionMsg({ id: notifId, msg: res.message || "Invitation accepted!", type: "success" });
                if (onInviteAccepted) onInviteAccepted();
                fetchNotifications();
            } else {
                setActionMsg({ id: notifId, msg: res.message || "Failed to accept invite.", type: "error" });
            }
        } catch (err: any) {
            setActionMsg({ id: notifId, msg: err.response?.data?.message || "Error accepting invite.", type: "error" });
        }
    };

    return (
        <div
            className="fade-in"
            style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
            }}
        >
            <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Notifications & Invites
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                    View system notifications and pending organization invitations.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {isLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div
                        style={{
                            padding: "48px 24px",
                            textAlign: "center",
                            backgroundColor: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px dashed #cbd5e1",
                        }}
                    >
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
                        <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "#334155" }}>No Notifications</h3>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#94a3b8" }}>
                            You have no unread notifications or pending organization invitations.
                        </p>
                    </div>
                ) : (
                    notifications.map((item) => (
                        <div
                            key={item._id}
                            style={{
                                padding: "20px",
                                borderRadius: "12px",
                                backgroundColor: item.isRead ? "#f8fafc" : "#ffffff",
                                border: `1px solid ${item.isRead ? "#e2e8f0" : "#c7d2fe"}`,
                                boxShadow: item.isRead ? "none" : "0 2px 4px rgba(79, 70, 229, 0.05)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                                    {item.title}
                                </h4>
                                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#475569" }}>
                                {item.message}
                            </p>

                            {actionMsg?.id === item._id && (
                                <div
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: "6px",
                                        fontSize: "0.85rem",
                                        marginBottom: "12px",
                                        backgroundColor: actionMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                                        color: actionMsg.type === "success" ? "#166534" : "#991b1b",
                                    }}
                                >
                                    {actionMsg.msg}
                                </div>
                            )}

                            {item.invitationToken && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleAcceptInvite(item._id, item.invitationToken)}
                                >
                                    Accept Invitation
                                </Button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationView;
