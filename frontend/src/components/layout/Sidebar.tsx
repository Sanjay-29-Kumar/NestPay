import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
    DashboardIcon,
    OrganizationIcon,
    ProfileIcon,
    MembersIcon,
    PropertyIcon,
    UnitIcon,
    CustomerIcon,
    DocumentIcon,
    PaymentIcon,
    InvoiceIcon,
    ExpenseIcon,
    ReportIcon,
    NotificationIcon,
    SettingsIcon,
} from "../ui/Icons";

interface NavItem {
    label: string;
    path: string;
    icon: React.ComponentType<{ size?: number; color?: string }>;
    roles: Array<string>;
}

const allNavItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: DashboardIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Organization", path: "/organization", icon: OrganizationIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Units", path: "/units", icon: UnitIcon, roles: ["OWNER", "ADMIN", "MANAGER", "STAFF", "TENANT", "MEMBER"] },
    { label: "People", path: "/customers", icon: CustomerIcon, roles: ["OWNER", "ADMIN", "MANAGER", "STAFF", "TENANT", "MEMBER"] },
    { label: "Payments", path: "/payments", icon: PaymentIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Invoices", path: "/invoices", icon: InvoiceIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Properties", path: "/properties", icon: PropertyIcon, roles: ["OWNER", "ADMIN", "MANAGER"] },
    { label: "Members", path: "/members", icon: MembersIcon, roles: ["OWNER", "ADMIN"] },
    { label: "Documents", path: "/documents", icon: DocumentIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Expenses", path: "/expenses", icon: ExpenseIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"] },
    { label: "Reports", path: "/reports", icon: ReportIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"] },
    { label: "Notifications", path: "/notifications", icon: NotificationIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "My Profile", path: "/profile", icon: ProfileIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Settings", path: "/settings", icon: SettingsIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
];

export function Sidebar() {
    const location = useLocation();
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const [collapsed, setCollapsed] = useState(false);

    const userRole = activeMembership?.role || "MEMBER";
    const visibleNavItems = allNavItems.filter((item) => item.roles.includes(userRole));

    return (
        <aside
            style={{
                width: collapsed ? "70px" : "240px",
                borderRight: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                padding: "16px 10px",
                gap: "4px",
                minHeight: "calc(100vh - 64px)",
                transition: "width 0.2s ease-in-out",
                boxShadow: "1px 0 3px rgba(0,0,0,0.01)",
            }}
        >
            {/* Header / Collapse Toggle */}
            <div
                style={{
                    padding: "0 8px 12px 8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: collapsed ? "center" : "space-between",
                }}
            >
                {!collapsed && (
                    <span
                        style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                        }}
                    >
                        Workspace Menu
                    </span>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    style={{
                        background: "#f1f5f9",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        color: "#475569",
                        fontWeight: 700,
                    }}
                >
                    {collapsed ? "→" : "←"}
                </button>
            </div>

            {/* Nav Links */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                {visibleNavItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={collapsed ? item.label : undefined}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: collapsed ? "10px" : "10px 12px",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontSize: "0.88rem",
                                fontWeight: isActive ? 700 : 500,
                                color: isActive ? "#2563eb" : "#475569",
                                backgroundColor: isActive ? "#eff6ff" : "transparent",
                                border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                                transition: "all 0.15s ease",
                                justifyContent: collapsed ? "center" : "flex-start",
                            }}
                        >
                            <Icon size={19} color={isActive ? "#2563eb" : "#64748b"} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Role Tag */}
            {!collapsed && (
                <div
                    style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "0.75rem",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "12px",
                    }}
                >
                    <span>Role Permissions:</span>
                    <span style={{ fontWeight: 800, color: "#2563eb" }}>{userRole}</span>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
