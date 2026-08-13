import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "@/store";
import api from "@/services/api";
import { NotificationIcon, ProfileIcon } from "@/components/ui/Icons";

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
}

export function LandingNavbar() {
    const { user } = useSelector((state: RootState) => state.auth);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;
        async function fetchNotifications() {
            try {
                const response = await api.get("/notifications");
                if (response.data?.success && Array.isArray(response.data.data)) {
                    const unread = response.data.data.filter((n: NotificationItem) => !n.isRead).length;
                    setUnreadCount(unread);
                }
            } catch {
                // Ignore silent errors
            }
        }

        fetchNotifications();
    }, [user]);

    return (
        <header
            style={{
                height: "72px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 40,
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02)",
            }}
        >
            {/* Left: NestPay Wordmark Only */}
            <div style={{ display: "flex", alignItems: "center" }}>
                <Link to="/select-workspace" style={{ textDecoration: "none" }}>
                    <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#0f172a", letterSpacing: "-0.03em" }}>
                        NEST<span style={{ color: "#2563eb" }}>PAY</span>
                    </span>
                </Link>
            </div>

            {/* Right: Only Profile Avatar & Notification Bell */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* 1. Profile Avatar */}
                {user && (
                    <Link
                        to="/profile"
                        title={`Logged in as ${user.email}`}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            textDecoration: "none",
                        }}
                    >
                        <div
                            style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "50%",
                                backgroundColor: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: "0.95rem",
                                color: "#ffffff",
                                boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                                border: "2px solid #ffffff",
                            }}
                        >
                            {user.name ? user.name.charAt(0).toUpperCase() : <ProfileIcon size={18} />}
                        </div>
                    </Link>
                )}

                {/* 2. Notification Bell */}
                <Link
                    to="/notifications"
                    title="Notifications"
                    style={{
                        position: "relative",
                        textDecoration: "none",
                        color: "#64748b",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <NotificationIcon size={18} color="#475569" />
                    {unreadCount > 0 && (
                        <span
                            style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-4px",
                                backgroundColor: "#ef4444",
                                color: "#ffffff",
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                borderRadius: "10px",
                                padding: "2px 5px",
                                border: "2px solid #ffffff",
                            }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}

export default LandingNavbar;
