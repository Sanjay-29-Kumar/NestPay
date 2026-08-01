import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "@/features/auth/store/authSlice";
import type { RootState } from "@/store";
import Button from "@/components/ui/Button";
import api from "@/services/api";

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
    invitationToken?: string;
}

export function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);

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
                // Ignore silent fetch errors
            }
        }

        fetchNotifications();
    }, [user]);

    function handleLogout() {
        dispatch(logout());
        navigate("/login");
    }

    const currentOrg = activeMembership?.organizationId;
    const currentRole = activeMembership?.role;

    return (
        <header
            style={{
                height: "64px",
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 40,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <Link to="/dashboard" style={{ textDecoration: "none" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0f172a" }}>
                        NEST<span style={{ color: "#2563eb" }}>PAY</span>
                    </span>
                </Link>

                {currentOrg ? (
                    <div
                        onClick={() => navigate("/select-workspace")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 12px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <span style={{ fontSize: "1.1rem" }}>🏢</span>
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0f172a" }}>
                            {currentOrg.name}
                        </span>
                        {currentRole && (
                            <span
                                style={{
                                    backgroundColor:
                                        currentRole === "OWNER"
                                            ? "#dbeafe"
                                            : currentRole === "ADMIN"
                                            ? "#fef3c7"
                                            : "#dcfce7",
                                    color:
                                        currentRole === "OWNER"
                                            ? "#1e40af"
                                            : currentRole === "ADMIN"
                                            ? "#92400e"
                                            : "#166534",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    textTransform: "uppercase",
                                }}
                            >
                                {currentRole}
                            </span>
                        )}
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>▼</span>
                    </div>
                ) : null}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Notifications Bell */}
                <Link
                    to="/notifications"
                    style={{
                        position: "relative",
                        textDecoration: "none",
                        fontSize: "1.2rem",
                        color: "#475569",
                        padding: "6px",
                    }}
                >
                    🔔
                    {unreadCount > 0 && (
                        <span
                            style={{
                                position: "absolute",
                                top: "2px",
                                right: "2px",
                                backgroundColor: "#dc2626",
                                color: "#ffffff",
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                borderRadius: "10px",
                                padding: "1px 5px",
                            }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </Link>

                {user ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                width: "34px",
                                height: "34px",
                                borderRadius: "50%",
                                backgroundColor: "#2563eb",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                color: "#ffffff",
                            }}
                        >
                            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
                            {user.name}
                        </span>
                    </div>
                ) : null}

                <Button variant="secondary" size="sm" onClick={handleLogout}>
                    Logout
                </Button>
            </div>
        </header>
    );
}

export default Navbar;
