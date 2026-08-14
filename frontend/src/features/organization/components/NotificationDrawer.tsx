import React, { useEffect, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { getNotificationsApi, acceptInvitationApi } from "../services/organizationApi";
import type { NotificationItem } from "../types/organization.types";

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onInviteAccepted?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
    isOpen,
    onClose,
    onInviteAccepted,
}) => {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [actionMsg, setActionMsg] = useState<{ id: string; msg: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await getNotificationsApi();
            if (res.success && res.data) {
                setNotifications(res.data);
            }
        } catch {
            // Soft catch if notifications empty
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
        <Drawer isOpen={isOpen} onClose={onClose} title="Notifications & Invites" subtitle="View updates and organization invitations">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {isLoading ? (
                    <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div
                        style={{
                            padding: "40px 20px",
                            textAlign: "center",
                            backgroundColor: "#f8fafc",
                            borderRadius: "12px",
                            border: "1px dashed #cbd5e1",
                        }}
                    >
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔔</div>
                        <h4 style={{ margin: 0, fontSize: "1rem", color: "#334155" }}>No New Notifications</h4>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                            You are all caught up! Invitations to join other property organizations will appear here.
                        </p>
                    </div>
                ) : (
                    notifications.map((item) => (
                        <div
                            key={item._id}
                            style={{
                                padding: "16px",
                                borderRadius: "10px",
                                backgroundColor: item.isRead ? "#f8fafc" : "#ffffff",
                                border: `1px solid ${item.isRead ? "#e2e8f0" : "#c7d2fe"}`,
                                boxShadow: item.isRead ? "none" : "0 2px 4px rgba(79, 70, 229, 0.05)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                                    {item.title}
                                </h5>
                                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p style={{ margin: "0 0 12px", fontSize: "0.875rem", color: "#475569" }}>
                                {item.message}
                            </p>

                            {actionMsg?.id === item._id && (
                                <div
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                        marginBottom: "10px",
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
        </Drawer>
    );
};

export default NotificationDrawer;
