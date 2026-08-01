import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface NavItem {
    label: string;
    path: string;
    icon: string;
    roles: Array<"OWNER" | "ADMIN" | "TENANT" | "MEMBER">;
}

const allNavItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: "📊", roles: ["OWNER", "ADMIN", "TENANT", "MEMBER"] },
    { label: "Customers", path: "/customers", icon: "👥", roles: ["OWNER", "ADMIN"] },
    { label: "Invoices", path: "/invoices", icon: "📄", roles: ["OWNER", "ADMIN", "TENANT", "MEMBER"] },
    { label: "Payments", path: "/payments", icon: "💳", roles: ["OWNER", "ADMIN", "TENANT", "MEMBER"] },
    { label: "Expenses", path: "/expenses", icon: "💸", roles: ["OWNER", "ADMIN"] },
    { label: "Reports", path: "/reports", icon: "📈", roles: ["OWNER", "ADMIN"] },
    { label: "Notifications", path: "/notifications", icon: "🔔", roles: ["OWNER", "ADMIN", "TENANT", "MEMBER"] },
    { label: "Documents", path: "/documents", icon: "📁", roles: ["OWNER", "ADMIN", "TENANT", "MEMBER"] },
    { label: "Organization", path: "/organization", icon: "🏢", roles: ["OWNER", "ADMIN"] },
    { label: "Settings", path: "/settings", icon: "⚙️", roles: ["OWNER", "ADMIN", "TENANT", "MEMBER"] },
];

export function Sidebar() {
    const location = useLocation();
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const userRole = activeMembership?.role || "MEMBER";

    // Filter sidebar navigation items based on active membership role
    const visibleNavItems = allNavItems.filter((item) => item.roles.includes(userRole));

    return (
        <aside
            style={{
                width: "240px",
                borderRight: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                padding: "20px 12px",
                gap: "6px",
                minHeight: "calc(100vh - 64px)",
            }}
        >
            <div
                style={{
                    padding: "0 12px 12px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#64748b",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span>Workspace Menu</span>
                <span
                    style={{
                        fontSize: "0.65rem",
                        backgroundColor: "#e2e8f0",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        color: "#334155",
                    }}
                >
                    {userRole}
                </span>
            </div>

            {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontSize: "0.9rem",
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? "#2563eb" : "#475569",
                            backgroundColor: isActive ? "#eff6ff" : "transparent",
                            border: isActive ? "1px solid #bfdbfe" : "1px solid transparent",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </aside>
    );
}

export default Sidebar;
