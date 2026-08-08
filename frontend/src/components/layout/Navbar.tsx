import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "@/features/auth/store/authSlice";
import type { RootState } from "@/store";
import Button from "@/components/ui/Button";
import api from "@/services/api";

import { OrganizationIcon, NotificationIcon } from "@/components/ui/Icons";

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
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.02)",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Link to="/dashboard" style={{ textDecoration: "none" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#0f172a", letterSpacing: "-0.03em" }}>
                        NEST<span style={{ color: "#4f46e5" }}>PAY</span>
                    </span>
                </Link>

                {currentOrg ? (
                    <div
                        onClick={() => navigate("/select-workspace")}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 14px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.15s ease-in-out",
                        }}
                    >
                        <OrganizationIcon size={16} color="#4f46e5" />
                        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                            {currentOrg.name}
                        </span>
                        {currentRole && (
                            <span
                                style={{
                                    backgroundColor:
                                        currentRole === "OWNER"
                                            ? "#eef2ff"
                                            : currentRole === "ADMIN"
                                            ? "#fff7ed"
                                            : "#ecfdf5",
                                    color:
                                        currentRole === "OWNER"
                                            ? "#4338ca"
                                            : currentRole === "ADMIN"
                                            ? "#c2410c"
                                            : "#047857",
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "12px",
                                    border: `1px solid ${
                                        currentRole === "OWNER"
                                            ? "#c7d2fe"
                                            : currentRole === "ADMIN"
                                            ? "#ffedd5"
                                            : "#a7f3d0"
                                    }`,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {currentRole}
                            </span>
                        )}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
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
                        color: "#64748b",
                        padding: "8px",
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
                                padding: "2px 6px",
                                border: "2px solid #ffffff",
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
