import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
  OrganizationIcon,
  UnitIcon,
  CustomerIcon,
  PaymentIcon,
  InvoiceIcon,
  NotificationIcon,
  SettingsIcon,
  ProfileIcon,
} from "../ui/Icons";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

// Full nav items for Organization Dashboard View (View 2)
const fullNavItems: NavItem[] = [
  { label: "Organization", path: "/organization", icon: OrganizationIcon },
  { label: "Units", path: "/units", icon: UnitIcon },
  { label: "Users", path: "/users", icon: CustomerIcon },
  { label: "Payment", path: "/payments", icon: PaymentIcon },
  { label: "Invoice", path: "/invoices", icon: InvoiceIcon },
];

// Landing / Workspace-Selection View nav item (View 1)
const landingNavItems: NavItem[] = [
  { label: "Organization", path: "/select-workspace", icon: OrganizationIcon },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { activeMembership } = useSelector((state: RootState) => state.organization);
  const [collapsed, setCollapsed] = useState(false);

  const hasActiveOrg = Boolean(activeMembership && activeMembership.organizationId);
  const userRole = activeMembership?.role || "MEMBER";
  const orgName = activeMembership?.organizationId?.name || "";

  const mainNavItems = hasActiveOrg ? fullNavItems : landingNavItems;

  return (
    <aside
      style={{
        width: collapsed ? "70px" : "240px",
        borderRight: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        padding: "16px 10px",
        minHeight: "calc(100vh - 72px)",
        transition: "width 0.2s ease-in-out",
        justifyContent: "space-between",
      }}
    >
      {/* Top Main Menu */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
              Main Menu
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand side panel" : "Collapse side panel"}
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

        {/* Conditional Main Nav Links */}
        {mainNavItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/organization" && item.path !== "/select-workspace" && location.pathname.startsWith(item.path));
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
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <Icon size={19} color={isActive ? "#2563eb" : "#64748b"} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom Panel Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
        {/* Dedicated Notifications Link - Only in Organization Dashboard View (View 2) */}
        {hasActiveOrg && (
          <Link
            to="/notifications"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: collapsed ? "10px" : "10px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.88rem",
              fontWeight: location.pathname === "/notifications" ? 700 : 500,
              color: location.pathname === "/notifications" ? "#2563eb" : "#475569",
              backgroundColor: location.pathname === "/notifications" ? "#eff6ff" : "transparent",
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <NotificationIcon size={19} color="#64748b" />
            {!collapsed && <span>Notifications</span>}
          </Link>
        )}

        {/* Dedicated Settings Link - Shown in both View 1 and View 2 */}
        <Link
          to="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: collapsed ? "10px" : "10px 12px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "0.88rem",
            fontWeight: location.pathname === "/settings" ? 700 : 500,
            color: location.pathname === "/settings" ? "#2563eb" : "#475569",
            backgroundColor: location.pathname === "/settings" ? "#eff6ff" : "transparent",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <SettingsIcon size={19} color="#64748b" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* User Profile Card at Bottom */}
        {user && !collapsed && (
          <Link
            to="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px",
              borderRadius: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
              marginTop: "8px",
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
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : <ProfileIcon size={18} />}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#2563eb", fontWeight: 700 }}>
                {hasActiveOrg ? `${userRole} • ${orgName}` : user.email || "Profile"}
              </div>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
