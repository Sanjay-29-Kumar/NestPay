import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "@/features/auth/store/authSlice";
import { clearActiveMembership } from "@/features/organization/store/organizationSlice";
import type { RootState } from "@/store";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import { NotificationIcon, MessengerIcon, ProfileIcon } from "@/components/ui/Icons";
import MessengerDrawer from "./MessengerDrawer";

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
}

export function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const [unreadCount, setUnreadCount] = useState(0);
    const [messengerOpen, setMessengerOpen] = useState(false);

    const org = activeMembership?.organizationId;
    const role = activeMembership?.role || "MEMBER";

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

    function handleLogout() {
        dispatch(logout());
        navigate("/login");
    }

    function handleSwitchWorkspace() {
        dispatch(clearActiveMembership());
        navigate("/select-workspace");
    }

    return (
        <>
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
                {/* Left: NestPay Wordmark */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Link to="/dashboard" style={{ textDecoration: "none" }}>
                        <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#0f172a", letterSpacing: "-0.03em" }}>
                            NEST<span style={{ color: "#2563eb" }}>PAY</span>
                        </span>
                    </Link>
                </div>

                {/* Right: Actions & Current Organization Indicator */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* 1. Chat / Messenger Button */}
                        <button
                            onClick={() => setMessengerOpen(true)}
                            title="Unit Messenger / Chat"
                            style={{
                                position: "relative",
                                border: "1px solid #e2e8f0",
                                backgroundColor: "#eff6ff",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#2563eb",
                                fontWeight: 700,
                                fontSize: "0.8rem",
                            }}
                        >
                            <MessengerIcon size={18} color="#2563eb" />
                            <span>Chat</span>
                        </button>

                        {/* 2. Profile Icon (Google ID Picture) */}
                        {user ? (
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
                        ) : null}

                        {/* 3. Notification Button */}
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

                        <Button variant="secondary" size="sm" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>

                    {/* Sub-label directly below right side: Current Organization Indicator */}
                    {org && (
                        <div
                            onClick={handleSwitchWorkspace}
                            title="Click to switch organization and return to workspace selection"
                            style={{
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                color: "#64748b",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span>Org:</span>
                            <span style={{ fontWeight: 800, color: "#0f172a" }}>{org.name}</span>
                            <span
                                style={{
                                    fontSize: "0.65rem",
                                    padding: "1px 6px",
                                    borderRadius: "8px",
                                    backgroundColor: role === "OWNER" ? "#eef2ff" : role === "ADMIN" ? "#fff7ed" : "#ecfdf5",
                                    color: role === "OWNER" ? "#4338ca" : role === "ADMIN" ? "#c2410c" : "#047857",
                                    fontWeight: 800,
                                }}
                            >
                                {role}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "#2563eb" }}>(Switch ⇄)</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Unit Shared Messenger Drawer */}
            <MessengerDrawer isOpen={messengerOpen} onClose={() => setMessengerOpen(false)} />
        </>
    );
}

export default Navbar;
