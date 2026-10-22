import React, { useEffect, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { getNotificationsApi, acceptInvitationApi } from "../services/organizationApi";
import type { NotificationItem } from "../types/organization.types";
import ManualWhatsAppModal from "./ManualWhatsAppModal";

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

    // WhatsApp Manual Modal State
    const [selectedWhatsAppNotif, setSelectedWhatsAppNotif] = useState<NotificationItem | null>(null);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

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

    const handleOpenWhatsAppModal = (item: NotificationItem) => {
        setSelectedWhatsAppNotif(item);
        setIsWhatsAppModalOpen(true);
    };

    return (
        <>
            <Drawer isOpen={isOpen} onClose={onClose} title="Notifications & Invites" subtitle="View updates, invitations & WhatsApp reminders">
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
                                You are all caught up! Routine WhatsApp reminder prompts and invitations will appear here.
                            </p>
                        </div>
                    ) : (
                        notifications.map((item) => {
                            const isWhatsAppAction = item.type === "MANUAL_WHATSAPP_ACTION" || item.title?.toLowerCase().includes("whatsapp");
                            const meta = item.metadata || {};

                            return (
                                <div
                                    key={item._id}
                                    style={{
                                        padding: "16px",
                                        borderRadius: "12px",
                                        backgroundColor: isWhatsAppAction ? "#f0fdf4" : item.isRead ? "#f8fafc" : "#ffffff",
                                        border: `1px solid ${isWhatsAppAction ? "#86efac" : item.isRead ? "#e2e8f0" : "#c7d2fe"}`,
                                        boxShadow: item.isRead ? "none" : "0 2px 4px rgba(0, 0, 0, 0.04)",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {isWhatsAppAction && (
                                                <span
                                                    style={{
                                                        backgroundColor: "#25D366",
                                                        color: "#ffffff",
                                                        fontSize: "0.675rem",
                                                        fontWeight: 800,
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        textTransform: "uppercase",
                                                    }}
                                                >
                                                    WhatsApp Action
                                                </span>
                                            )}
                                            <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                                                {item.title}
                                            </h5>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <p style={{ margin: "0 0 12px", fontSize: "0.875rem", color: "#475569" }}>
                                        {item.message}
                                    </p>

                                    {/* Action Chips for WhatsApp reminders */}
                                    {isWhatsAppAction && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                                            {meta.tenantName && (
                                                <span style={{ fontSize: "0.75rem", backgroundColor: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                                                    👤 {meta.tenantName}
                                                </span>
                                            )}
                                            {meta.unitNumber && (
                                                <span style={{ fontSize: "0.75rem", backgroundColor: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                                                    🏠 Unit {meta.unitNumber}
                                                </span>
                                            )}
                                            {meta.rentAmount && (
                                                <span style={{ fontSize: "0.75rem", backgroundColor: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                                                    ₹{Number(meta.rentAmount).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    )}

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

                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        {isWhatsAppAction && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenWhatsAppModal(item)}
                                                style={{
                                                    backgroundColor: "#25D366",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    padding: "8px 16px",
                                                    fontSize: "0.825rem",
                                                    fontWeight: 800,
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)",
                                                }}
                                            >
                                                <span>💬</span>
                                                <span>Send via WhatsApp</span>
                                            </button>
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
                                </div>
                            );
                        })
                    )}
                </div>
            </Drawer>

            {/* Mounted Manual WhatsApp Dispatch Modal */}
            {selectedWhatsAppNotif && (
                <ManualWhatsAppModal
                    isOpen={isWhatsAppModalOpen}
                    onClose={() => {
                        setIsWhatsAppModalOpen(false);
                        setSelectedWhatsAppNotif(null);
                    }}
                    onSent={() => {
                        fetchNotifications();
                    }}
                    orgId={typeof selectedWhatsAppNotif.organizationId === "object" ? selectedWhatsAppNotif.organizationId?._id : selectedWhatsAppNotif.organizationId}
                    unitId={typeof selectedWhatsAppNotif.unitId === "object" ? selectedWhatsAppNotif.unitId?._id : selectedWhatsAppNotif.unitId}
                    unitNumber={selectedWhatsAppNotif.metadata?.unitNumber || "101"}
                    tenantName={selectedWhatsAppNotif.metadata?.tenantName || "Tenant"}
                    tenantPhone={selectedWhatsAppNotif.metadata?.tenantPhone || ""}
                    amount={selectedWhatsAppNotif.metadata?.rentAmount || 8500}
                    dueDate={selectedWhatsAppNotif.metadata?.dueDate || "10th of this month"}
                    customMessage={selectedWhatsAppNotif.metadata?.prefilledMessage}
                    notificationId={selectedWhatsAppNotif._id}
                />
            )}
        </>
    );
};

export default NotificationDrawer;
