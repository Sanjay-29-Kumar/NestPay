import React from "react";
import {
    OrganizationIcon,
    ProfileIcon,
    SettingsIcon,
    LogoutIcon,
    NotificationIcon,
} from "@/components/ui/Icons";

export type WorkspaceTab = "organizations" | "profile" | "settings" | "logout" | "notification";

interface WorkspaceSidebarProps {
    activeTab: WorkspaceTab;
    onSelectTab: (tab: WorkspaceTab) => void;
    unreadCount?: number;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
    activeTab,
    onSelectTab,
    unreadCount = 0,
}) => {
    // EXACTLY 5 items, strictly ordered top to bottom:
    // 1. Organizations
    // 2. Profile
    // 3. Settings
    // 4. Logout
    // 5. Notification
    const navItems: Array<{
        id: WorkspaceTab;
        label: string;
        icon: React.ReactNode;
        isDanger?: boolean;
        hasBadge?: boolean;
    }> = [
        {
            id: "organizations",
            label: "Organizations",
            icon: <OrganizationIcon size={20} />,
        },
        {
            id: "profile",
            label: "Profile",
            icon: <ProfileIcon size={20} />,
        },
        {
            id: "settings",
            label: "Settings",
            icon: <SettingsIcon size={20} />,
        },
        {
            id: "logout",
            label: "Logout",
            icon: <LogoutIcon size={20} />,
            isDanger: true,
        },
        {
            id: "notification",
            label: "Notification",
            icon: <NotificationIcon size={20} />,
            hasBadge: unreadCount > 0,
        },
    ];

    return (
        <aside
            style={{
                width: "240px",
                backgroundColor: "#ffffff",
                borderRight: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                padding: "20px 12px",
                flexShrink: 0,
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const isLogout = item.isDanger;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectTab(item.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                border: "none",
                                background: isActive
                                    ? "#eef2ff"
                                    : "transparent",
                                color: isActive
                                    ? "#4f46e5"
                                    : isLogout
                                    ? "#ef4444"
                                    : "#334155",
                                fontWeight: isActive ? 600 : 500,
                                fontSize: "0.95rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                textAlign: "left",
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = isLogout
                                        ? "#fef2f2"
                                        : "#f8fafc";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        color: isActive
                                            ? "#4f46e5"
                                            : isLogout
                                            ? "#ef4444"
                                            : "#64748b",
                                    }}
                                >
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </div>

                            {item.hasBadge && (
                                <span
                                    style={{
                                        backgroundColor: "#ef4444",
                                        color: "#ffffff",
                                        fontSize: "0.75rem",
                                        fontWeight: 700,
                                        padding: "2px 7px",
                                        borderRadius: "9999px",
                                        lineHeight: 1,
                                    }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default WorkspaceSidebar;
