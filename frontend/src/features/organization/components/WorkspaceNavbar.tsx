import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { NotificationIcon } from "@/components/ui/Icons";

interface WorkspaceNavbarProps {
    onOpenProfile: () => void;
    onOpenNotifications: () => void;
    unreadNotificationsCount?: number;
}

export const WorkspaceNavbar: React.FC<WorkspaceNavbarProps> = ({
    onOpenProfile,
    onOpenNotifications,
    unreadNotificationsCount = 0,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);

    // Compute initials for fallback profile avatar
    const getInitials = (name?: string, email?: string) => {
        if (name && name.trim()) {
            const parts = name.trim().split(" ");
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return parts[0].substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return "NP";
    };

    const initials = getInitials(user?.name || user?.fullName || user?.displayName, user?.email);
    const userPhoto = user?.photo;

    return (
        <header
            style={{
                height: "64px",
                backgroundColor: "#ffffff",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 28px",
                position: "sticky",
                top: 0,
                zIndex: 40,
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
            }}
        >
            {/* Left: Brand Logo Text */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                    <span style={{ color: "#0f172a" }}>Nest</span>
                    <span style={{ color: "#4f46e5" }}>Pay</span>
                </div>
            </div>

            {/* Right side: Exactly two items (Notification Bell Icon, Profile Avatar Icon) */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* 1. Notification Bell Icon */}
                <button
                    type="button"
                    onClick={onOpenNotifications}
                    title="Notifications"
                    style={{
                        position: "relative",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#475569",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.color = "#4f46e5";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.color = "#475569";
                    }}
                >
                    <NotificationIcon size={20} />
                    {unreadNotificationsCount > 0 && (
                        <span
                            style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "9px",
                                height: "9px",
                                backgroundColor: "#ef4444",
                                borderRadius: "50%",
                                border: "2px solid #ffffff",
                            }}
                        />
                    )}
                </button>

                {/* 2. Profile Avatar / Icon */}
                <button
                    type="button"
                    onClick={onOpenProfile}
                    title={user?.name || user?.email || "Account Profile"}
                    style={{
                        background: "none",
                        border: "2px solid #e2e8f0",
                        borderRadius: "50%",
                        padding: 0,
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        width: "40px",
                        height: "40px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#4f46e5";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                >
                    {userPhoto ? (
                        <img
                            src={userPhoto}
                            alt={user?.name || "User Avatar"}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                                // Fallback to initials if photo fails to load
                                (e.target as HTMLElement).style.display = "none";
                            }}
                        />
                    ) : null}

                    {!userPhoto && (
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {initials}
                        </div>
                    )}
                </button>
            </div>
        </header>
    );
};

export default WorkspaceNavbar;
