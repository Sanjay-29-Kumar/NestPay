import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { logout } from "@/features/auth/store/authSlice";
import type { RootState } from "@/store";
import Button from "@/components/ui/Button";
import api from "@/services/api";
import { NotificationIcon, MessengerIcon, ProfileIcon } from "@/components/ui/Icons";
import MessengerDrawer from "./MessengerDrawer";

import { setActiveMembership } from "@/features/organization/store/organizationSlice";

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    isRead: boolean;
    type: string;
}

function OrgDropdownSelector() {
    const dispatch = useDispatch();
    const { activeMembership, memberships } = useSelector((state: RootState) => state.organization);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (!activeMembership || !activeMembership.organizationId) return null;

    const org = activeMembership.organizationId;
    const role = activeMembership.role;

    const handleSelectOrg = (m: any) => {
        dispatch(setActiveMembership(m));
        setDropdownOpen(false);
        window.location.href = "/dashboard";
    };

    return (
        <div style={{ position: "relative" }}>
            <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: "#0f172a",
                }}
            >
                <span>{org.name}</span>
                <span
                    style={{
                        fontSize: "0.68rem",
                        padding: "2px 6px",
                        borderRadius: "10px",
                        backgroundColor: role === "OWNER" ? "#eef2ff" : role === "ADMIN" ? "#fff7ed" : "#ecfdf5",
                        color: role === "OWNER" ? "#4338ca" : role === "ADMIN" ? "#c2410c" : "#047857",
                        fontWeight: 800,
                    }}
                >
                    {role}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>▼</span>
            </button>

            {dropdownOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        width: "240px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "10px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        zIndex: 50,
                        padding: "6px",
                    }}
                >
                    <div style={{ padding: "6px 8px", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                        Switch Organization
                    </div>
                    {memberships.map((m) => {
                        if (!m.organizationId) return null;
                        const isSelected = m._id === activeMembership._id;
                        return (
                            <div
                                key={m._id}
                                onClick={() => handleSelectOrg(m)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    backgroundColor: isSelected ? "#eff6ff" : "transparent",
                                    fontSize: "0.85rem",
                                    fontWeight: isSelected ? 700 : 500,
                                    color: isSelected ? "#2563eb" : "#0f172a",
                                }}
                            >
                                <span>{m.organizationId.name}</span>
                                <span style={{ fontSize: "0.68rem", padding: "2px 6px", borderRadius: "8px", backgroundColor: "#f1f5f9", fontWeight: 700 }}>
                                    {m.role}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function Navbar() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const [unreadCount, setUnreadCount] = useState(0);
    const [messengerOpen, setMessengerOpen] = useState(false);

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

    return (
        <>
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
                {/* Left: NESTPAY logo & Organization Switcher */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <Link to="/dashboard" style={{ textDecoration: "none" }}>
                        <span style={{ fontWeight: 900, fontSize: "1.35rem", color: "#0f172a", letterSpacing: "-0.03em" }}>
                            NEST<span style={{ color: "#2563eb" }}>PAY</span>
                        </span>
                    </Link>

                    {activeMembership?.organizationId && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderLeft: "1px solid #cbd5e1", paddingLeft: "14px" }}>
                            <OrgDropdownSelector />
                        </div>
                    )}
                </div>

                {/* Right: Notifications, In-App Messenger, Profile */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {/* Notifications Bell Icon */}
                    <Link
                        to="/notifications"
                        title="Notifications"
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
                            transition: "all 0.15s ease",
                        }}
                    >
                        <NotificationIcon size={19} color="#475569" />
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

                    {/* In-App Messenger Icon */}
                    <button
                        onClick={() => setMessengerOpen(true)}
                        title="In-App Messenger"
                        style={{
                            position: "relative",
                            border: "1px solid #e2e8f0",
                            backgroundColor: "#f8fafc",
                            padding: "8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <MessengerIcon size={19} color="#2563eb" />
                    </button>

                    {/* Profile */}
                    {user ? (
                        <Link
                            to="/profile"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                textDecoration: "none",
                                padding: "4px 8px",
                                borderRadius: "8px",
                                transition: "all 0.15s ease",
                            }}
                        >
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
                                {user.name ? user.name.charAt(0).toUpperCase() : <ProfileIcon size={18} />}
                            </div>
                            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
                                {user.name}
                            </span>
                        </Link>
                    ) : null}

                    <Button variant="secondary" size="sm" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </header>

            {/* In-App Messenger Drawer */}
            <MessengerDrawer isOpen={messengerOpen} onClose={() => setMessengerOpen(false)} />
        </>
    );
}

export default Navbar;
