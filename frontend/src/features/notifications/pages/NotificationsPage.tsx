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
    const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
    const [feedbackMsg, setFeedbackMsg] = useState<string>("");

    const fetchNotifications = async () => {
        try {
            const response = await api.get("/notifications");
            setIsLoading(false);
            if (response.data?.success && Array.isArray(response.data.data)) {
                setNotifications(response.data.data);
            }
        } catch {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function handleMarkAsRead(id: string) {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
            );
            setFeedbackMsg("Notification marked as read.");
            setTimeout(() => setFeedbackMsg(""), 3000);
        } catch {
            // Ignore error
        }
    }

    async function handleMarkAllAsRead() {
        try {
            await api.patch("/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setFeedbackMsg("All notifications marked as read.");
            setTimeout(() => setFeedbackMsg(""), 3000);
        } catch {
            // Ignore error
        }
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const displayedNotifications =
        activeTab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Notifications & In-App Alerts
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                            View workspace invitations and system notifications.
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <Button variant="primary" size="sm" onClick={handleMarkAllAsRead}>
                            ✓ Mark All as Read ({unreadCount})
                        </Button>
                    )}
                </div>

                {feedbackMsg && (
                    <div style={{ padding: "10px 14px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "8px", border: "1px solid #bbf7d0", fontSize: "0.9rem" }}>
                        {feedbackMsg}
                    </div>
                )}

                {/* Tabs for Unread vs All */}
                <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                    <button
                        onClick={() => setActiveTab("unread")}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            backgroundColor: activeTab === "unread" ? "#4f46e5" : "#f1f5f9",
                            color: activeTab === "unread" ? "#ffffff" : "#475569",
                        }}
                    >
                        Unread / Action Required ({unreadCount})
                    </button>
                    <button
                        onClick={() => setActiveTab("all")}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            backgroundColor: activeTab === "all" ? "#4f46e5" : "#f1f5f9",
                            color: activeTab === "all" ? "#ffffff" : "#475569",
                        }}
                    >
                        All Notifications ({notifications.length})
                    </button>
                </div>

                {isLoading && (
                    <div style={{ padding: "40px 0", textAlign: "center" }}>
                        <p style={{ color: "#64748b" }}>Loading notifications...</p>
                    </div>
                )}

                {!isLoading && displayedNotifications.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#ffffff" }}>
                        <p style={{ color: "#94a3b8", margin: 0 }}>
                            {activeTab === "unread" ? "You have no unread notifications or pending invitations." : "You have no notifications."}
                        </p>
                    </div>
                )}

                {!isLoading && displayedNotifications.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {displayedNotifications.map((item) => (
                            <Card key={item._id} style={{ backgroundColor: item.isRead ? "#ffffff" : "#f0f9ff", borderLeft: item.isRead ? "none" : "4px solid #2563eb" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <h4 style={{ margin: 0, color: "#0f172a" }}>{item.title}</h4>
                                            {!item.isRead ? (
                                                <span style={{ backgroundColor: "#2563eb", color: "#ffffff", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>
                                                    UNREAD
                                                </span>
                                            ) : (
                                                <span style={{ backgroundColor: "#e2e8f0", color: "#475569", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", fontWeight: 600 }}>
                                                    READ
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ margin: "6px 0 0 0", color: "#475569", fontSize: "0.9rem" }}>
                                            {item.message}
                                        </p>
                                    </div>

                                    <div style={{ display: "flex", gap: "8px" }}>
                                        {item.type === "INVITATION" && item.invitationToken ? (
                                            <Link
                                                to={`/accept-invite?token=${item.invitationToken}`}
                                                style={{ textDecoration: "none" }}
                                                onClick={() => handleMarkAsRead(item._id)}
                                            >
                                                <Button variant="primary" size="sm">
                                                    Accept Invitation
                                                </Button>
                                            </Link>
                                        ) : null}

                                        {!item.isRead && (
                                            <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(item._id)}>
                                                Mark as Read
                                            </Button>
                                        )}
                                    </div>
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

