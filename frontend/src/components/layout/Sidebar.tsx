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
    { label: "My Profile", path: "/profile", icon: ProfileIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Members", path: "/members", icon: MembersIcon, roles: ["OWNER", "ADMIN"] },
    { label: "Properties", path: "/properties", icon: PropertyIcon, roles: ["OWNER", "ADMIN", "MANAGER"] },
    { label: "Units", path: "/units", icon: UnitIcon, roles: ["OWNER", "ADMIN", "MANAGER", "STAFF", "TENANT", "MEMBER"] },
    { label: "Customers", path: "/customers", icon: CustomerIcon, roles: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
    { label: "Documents", path: "/documents", icon: DocumentIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Payments", path: "/payments", icon: PaymentIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Invoices", path: "/invoices", icon: InvoiceIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Expenses", path: "/expenses", icon: ExpenseIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"] },
    { label: "Reports", path: "/reports", icon: ReportIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"] },
    { label: "Notifications", path: "/notifications", icon: NotificationIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
    { label: "Settings", path: "/settings", icon: SettingsIcon, roles: ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "STAFF", "TENANT", "MEMBER"] },
];

export function Sidebar() {
    const location = useLocation();
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const userRole = activeMembership?.role || "MEMBER";

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
                gap: "4px",
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
                        fontWeight: 700,
                    }}
                >
                    {userRole}
                </span>
            </div>

            {visibleNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
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
                        <Icon size={18} color={isActive ? "#2563eb" : "#64748b"} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </aside>
    );
}

export default Sidebar;
