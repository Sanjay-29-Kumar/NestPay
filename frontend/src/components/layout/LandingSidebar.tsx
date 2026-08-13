import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "@/features/auth/store/authSlice";
import {
  OrganizationIcon,
  ProfileIcon,
  SettingsIcon,
  LogoutIcon,
  NotificationIcon,
} from "../ui/Icons";

export function LandingSidebar() {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  function handleLogout() {
    dispatch(logout());
    navigate("/login");
  }

  const items = [
    { label: "Organizations", path: "/select-workspace", icon: OrganizationIcon, isButton: false },
    { label: "Profile", path: "/profile", icon: ProfileIcon, isButton: false },
    { label: "Settings", path: "/settings", icon: SettingsIcon, isButton: false },
    { label: "Logout", path: "/login", icon: LogoutIcon, isButton: true, onClick: handleLogout },
    { label: "Notification", path: "/notifications", icon: NotificationIcon, isButton: false },
  ];

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
      }}
    >
      {/* Sidebar Header with Collapse Toggle Button (No Dashboard heading) */}
      <div
        style={{
          padding: "0 8px 12px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
        }}
      >
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

      {/* Nav List - Exactly 5 items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = !item.isButton && location.pathname === item.path;

          if (item.isButton) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                title={collapsed ? item.label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: collapsed ? "10px" : "10px 12px",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  color: "#dc2626",
                  backgroundColor: "transparent",
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  justifyContent: collapsed ? "center" : "flex-start",
                }}
              >
                <Icon size={19} color="#dc2626" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
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
    </aside>
  );
}

export default LandingSidebar;
