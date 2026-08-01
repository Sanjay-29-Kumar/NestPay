import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/services/api";

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    type: string;
    invitationToken?: string;
    isRead: boolean;
    createdAt: string;
}

function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            try {
                const response = await api.get("/notifications");
                setIsLoading(false);
                if (response.data?.success && Array.isArray(response.data.data)) {
                    setNotifications(response.data.data);
                }
            } catch {
                setIsLoading(false);
            }
        }

        fetchNotifications();
    }, []);

    async function handleMarkAsRead(id: string) {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
        } catch {
            // Ignore error
        }
    }

    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
                    Notifications & In-App Alerts
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                    View workspace invitations and system notifications.
                </p>

                {isLoading && (
                    <div style={{ padding: "30px 0", textAlign: "center" }}>
                        <p style={{ color: "#64748b" }}>Loading notifications...</p>
                    </div>
                )}

                {!isLoading && notifications.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#ffffff" }}>
                        <p style={{ color: "#94a3b8", margin: 0 }}>You have no notifications.</p>
                    </div>
                )}

                {!isLoading && notifications.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {notifications.map((item) => (
                            <Card key={item._id} style={{ backgroundColor: item.isRead ? "#ffffff" : "#f0f9ff" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <h4 style={{ margin: 0, color: "#0f172a" }}>{item.title}</h4>
                                            {!item.isRead && (
                                                <span style={{ backgroundColor: "#2563eb", color: "#ffffff", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>
                                                    NEW
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: "6px 0 0 0", color: "#475569", fontSize: "0.9rem" }}>
                                            {item.message}
                                        </p>
                                    </div>

                                    {item.type === "INVITATION" && item.invitationToken ? (
                                        <Link to={`/accept-invite?token=${item.invitationToken}`} style={{ textDecoration: "none" }}>
                                            <Button variant="primary" size="sm">
                                                Accept Invitation
                                            </Button>
                                        </Link>
                                    ) : !item.isRead ? (
                                        <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(item._id)}>
                                            Mark as Read
                                        </Button>
                                    ) : null}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default NotificationsPage;
