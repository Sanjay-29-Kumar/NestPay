import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
    setMemberships,
    setCurrentOrgId,
    setOrganizationLoading,
} from "@/features/organization/store/organizationSlice";
import { getUserMembershipsApi, getNotificationsApi } from "@/features/organization/services/organizationApi";
import {
    OrganizationIcon,
    UnitIcon,
    MembersIcon,
    PaymentIcon,
    InvoiceIcon,
    SettingsIcon,
    NotificationIcon,
    ChatIcon,
    ProfileIcon,
    LogoutIcon,
} from "@/components/ui/Icons";
import { getUnitsApi } from "@/features/units/services/unitsApi";
import UnitsList from "@/features/units/components/UnitsList";
import AddUnitPage from "@/features/units/components/AddUnitPage";
import EditUnitPage from "@/features/units/components/EditUnitPage";
import AddUserToUnitPage from "@/features/units/components/AddUserToUnitPage";
import UnitDetailPage from "@/features/units/components/UnitDetailPage";
import UsersSection from "@/features/organization/components/UsersSection";
import PaymentsSection from "@/features/organization/components/PaymentsSection";
import SenderSettingsSection from "@/features/organization/components/SenderSettingsSection";
import UnitChatModule from "@/features/chat/components/UnitChatModule";

export type DashboardTab =
    | "organization"
    | "units"
    | "users"
    | "payment"
    | "invoice"
    | "settings"
    | "notification"
    | "chat"
    | "profile";

interface DashboardPageProps {
    initialTab?: DashboardTab;
    unitSubView?: "list" | "new" | "details" | "edit" | "add-user";
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ initialTab, unitSubView }) => {
    const { orgId, unitId } = useParams<{ orgId: string; unitId?: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();

    const { user } = useSelector((state: RootState) => state.auth);
    const { memberships, currentUnitId, isLoading } = useSelector((state: RootState) => state.organization);
    const activeUnitParam = searchParams.get("unitId") || unitId || currentUnitId;
    const [activeUnitNumber, setActiveUnitNumber] = useState<string | null>(null);

    const [unitsList, setUnitsList] = useState<any[]>([]);
    const [selectedChatUnitId, setSelectedChatUnitId] = useState<string | null>(null);

    useEffect(() => {
        if (orgId) {
            getUnitsApi(orgId).then((res) => {
                if (res.success && res.data?.units) {
                    const list = res.data.units;
                    setUnitsList(list);
                    const match = list.find((u: any) => String(u._id || u.id) === String(activeUnitParam));
                    if (match) {
                        setActiveUnitNumber(match.unitNumber);
                        setSelectedChatUnitId(String((match as any)._id || (match as any).id));
                    } else if (list.length > 0) {
                        setActiveUnitNumber(list[0].unitNumber);
                        setSelectedChatUnitId(String((list[0] as any)._id || (list[0] as any).id));
                    }
                }
            });
        }
    }, [orgId, activeUnitParam]);

    const currentTabFromUrl = initialTab || (searchParams.get("tab") as DashboardTab) || "organization";
    const [activeTab, setActiveTab] = useState<DashboardTab>(currentTabFromUrl);

    useEffect(() => {
        if (orgId) {
            dispatch(setCurrentOrgId(orgId));
        }

        if (memberships.length === 0) {
            loadMemberships();
        }
    }, [orgId, memberships.length, dispatch]);

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        } else {
            const tab = searchParams.get("tab") as DashboardTab;
            if (tab) {
                setActiveTab(tab);
            }
        }
    }, [searchParams, initialTab]);

    const [notificationsList, setNotificationsList] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    const loadNotifications = async () => {
        try {
            const res = await getNotificationsApi();
            if (res.success && res.data) {
                setNotificationsList(res.data);
                const unread = res.data.filter((n: any) => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch {
            // handle error silently
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(() => {
            loadNotifications();
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const loadMemberships = async () => {
        dispatch(setOrganizationLoading(true));
        try {
            const res = await getUserMembershipsApi();
            if (res.success && res.data) {
                dispatch(setMemberships(res.data));
            }
        } catch {
            // handle error silently
        } finally {
            dispatch(setOrganizationLoading(false));
        }
    };

    const handleSelectTab = (tab: DashboardTab) => {
        setActiveTab(tab);
        if (tab === "units") {
            navigate(`/org/${orgId}/units`);
        } else if (tab === "payment") {
            navigate(`/org/${orgId}/payment`);
        } else {
            navigate(`/org/${orgId}/dashboard?tab=${tab}`);
        }
    };

    // Find current active organization & membership
    const activeMembership = memberships.find((m) => {
        const org = typeof m.organizationId === "object" ? m.organizationId : null;
        return org?._id === orgId;
    });

    const activeOrg = typeof activeMembership?.organizationId === "object"
        ? activeMembership.organizationId
        : null;

    const orgName = activeOrg?.name || "Organization Workspace";
    const userRole = activeMembership?.role || "MEMBER";
    const isOwnerOrAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(userRole);

    // Helper for formatting roles
    const formatRoleInfo = (role: string) => {
        switch (role) {
            case "OWNER":
                return { label: "Owner", bg: "#e0e7ff", color: "#3730a3", isOwner: true };
            case "ADMIN":
                return { label: "Admin", bg: "#f3e8ff", color: "#6b21a8", isOwner: false };
            case "MANAGER":
                return { label: "Manager", bg: "#dbeafe", color: "#1e40af", isOwner: false };
            case "ACCOUNTANT":
                return { label: "Accountant", bg: "#fef3c7", color: "#92400e", isOwner: false };
            case "TENANT":
                return { label: "Tenant", bg: "#dcfce7", color: "#166534", isOwner: false };
            case "MEMBER":
            default:
                return { label: "Tenant Family", bg: "#e0f2fe", color: "#075985", isOwner: false };
        }
    };

    const roleInfo = formatRoleInfo(userRole);

    // Helper for user initials
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

    // Navigation items definitions
    const topNavItems: Array<{ id: DashboardTab; label: string; icon: React.ReactNode }> = [
        { id: "organization", label: "Organization", icon: <OrganizationIcon size={20} /> },
        { id: "units", label: "Units", icon: <UnitIcon size={20} /> },
        { id: "users", label: "Users", icon: <MembersIcon size={20} /> },
        { id: "payment", label: "Payment", icon: <PaymentIcon size={20} /> },
        { id: "invoice", label: "Invoice", icon: <InvoiceIcon size={20} /> },
    ];

    // Bottom section: Settings, Notification, Chat, Profile (bottom-most)
    const bottomNavItems: Array<{ id: DashboardTab; label: string; icon: React.ReactNode }> = [
        { id: "settings", label: "Settings", icon: <SettingsIcon size={20} /> },
        { id: "notification", label: "Notification", icon: <NotificationIcon size={20} /> },
        { id: "chat", label: "Chat", icon: <ChatIcon size={20} /> },
        { id: "profile", label: "Profile", icon: <ProfileIcon size={20} /> },
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
            {/* Top Fixed Combined Header Container */}
            <header
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    zIndex: 1000,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
                }}
            >
                {/* Top Navbar (Height: 56px) */}
                <div
                    style={{
                        height: "56px",
                        backgroundColor: "#ffffff",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 28px",
                        position: "relative",
                        zIndex: 1001,
                    }}
                >
                    {/* Left: NestPay Branding */}
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                            style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.03em", cursor: "pointer" }}
                            onClick={() => navigate("/workspace")}
                            title="Back to Workspace Selection"
                        >
                            <span style={{ color: "#0f172a" }}>Nest</span>
                            <span style={{ color: "#4f46e5" }}>Pay</span>
                        </div>
                    </div>

                    {/* Right: Notification Bell + Profile Avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

                        {/* 1. Notification Bell Icon */}
                        <button
                            type="button"
                            onClick={() => {
                                handleSelectTab("notification");
                                loadNotifications();
                            }}
                            title="Notifications"
                            style={{
                                position: "relative",
                                background: activeTab === "notification" ? "#eef2ff" : "#f8fafc",
                                border: activeTab === "notification" ? "1px solid #c7d2fe" : "1px solid #e2e8f0",
                                borderRadius: "50%",
                                width: "38px",
                                height: "38px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                color: activeTab === "notification" ? "#4f46e5" : "#475569",
                                transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                                if (activeTab !== "notification") {
                                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                                    e.currentTarget.style.color = "#4f46e5";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== "notification") {
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                    e.currentTarget.style.color = "#475569";
                                }
                            }}
                        >
                            <NotificationIcon size={19} />
                            {unreadCount > 0 && (
                                <span
                                    style={{
                                        position: "absolute",
                                        top: "-2px",
                                        right: "-2px",
                                        backgroundColor: "#ef4444",
                                        color: "#ffffff",
                                        fontSize: "0.65rem",
                                        fontWeight: 850,
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "50%",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        border: "2px solid #ffffff",
                                        boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)",
                                    }}
                                >
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* 2. Profile Avatar Icon */}
                        <button
                            type="button"
                            onClick={() => handleSelectTab("profile")}
                            title={user?.name || user?.email || "Account Profile"}
                            style={{
                                background: "none",
                                border: activeTab === "profile" ? "2px solid #4f46e5" : "2px solid #e2e8f0",
                                borderRadius: "50%",
                                padding: 0,
                                cursor: "pointer",
                                outline: "none",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                width: "38px",
                                height: "38px",
                                boxShadow: activeTab === "profile" ? "0 0 0 3px rgba(79, 70, 229, 0.15)" : "none",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#4f46e5";
                                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.15)";
                            }}
                            onMouseLeave={(e) => {
                                if (activeTab !== "profile") {
                                    e.currentTarget.style.borderColor = "#e2e8f0";
                                    e.currentTarget.style.boxShadow = "none";
                                }
                            }}
                        >
                            {userPhoto ? (
                                <img
                                    src={userPhoto}
                                    alt={user?.name || "User Avatar"}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "#4f46e5",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "0.85rem",
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
                </div>
            </header>

            {/* Dashboard Shell Layout Body */}
            <div style={{ display: "flex", flex: 1, marginTop: "56px", minHeight: "calc(100vh - 56px)" }}>
                {/* Side Panel */}
                <aside
                    style={{
                        width: "240px",
                        backgroundColor: "#ffffff",
                        borderRight: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "20px 12px",
                        flexShrink: 0,
                        position: "sticky",
                        top: "56px",
                        height: "calc(100vh - 56px)",
                        overflowY: "auto",
                    }}
                >
                    {/* Top Section Nav Items (Organization, Units, Users, Payment, Invoice) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ padding: "0 12px 8px", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Organization Modules
                        </div>
                        {topNavItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelectTab(item.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: isActive ? "#eef2ff" : "transparent",
                                        color: isActive ? "#4f46e5" : "#334155",
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: "0.925rem",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textAlign: "left",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.backgroundColor = "#f8fafc";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", color: isActive ? "#4f46e5" : "#64748b" }}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Bottom Section Nav Items (Settings, Notification, Chat, Profile, Switch Workspace) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ padding: "0 12px 8px", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Account & Tools
                        </div>
                        {bottomNavItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleSelectTab(item.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: isActive ? "#eef2ff" : "transparent",
                                        color: isActive ? "#4f46e5" : "#334155",
                                        fontWeight: isActive ? 600 : 500,
                                        fontSize: "0.925rem",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textAlign: "left",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.backgroundColor = "#f8fafc";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", color: isActive ? "#4f46e5" : "#64748b" }}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}

                        {/* Switch Workspace Item inside Side Panel */}
                        <button
                            type="button"
                            onClick={() => navigate("/workspace")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "none",
                                background: "transparent",
                                color: "#64748b",
                                fontWeight: 500,
                                fontSize: "0.925rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                textAlign: "left",
                                marginTop: "4px",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f1f5f9";
                                e.currentTarget.style.color = "#4f46e5";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "#64748b";
                            }}
                        >
                            <span style={{ display: "flex", alignItems: "center", color: "#64748b" }}>
                                <LogoutIcon size={20} />
                            </span>
                            <span>Switch Workspace</span>
                        </button>
                    </div>
                </aside>

                {/* Main Dynamic Content Area */}
                <main style={{ flex: 1, padding: "20px 28px 40px", overflowY: "auto", position: "relative" }}>
                    {/* Org & Role Box — Always fixed at top right corner under profile nav bar */}
                    <div
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "28px",
                            zIndex: 100,
                            backgroundColor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "12px",
                            padding: "8px 18px",
                            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.05)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            minWidth: "125px",
                            borderTop: "3px solid #4f46e5",
                        }}
                        title={`Active Workspace: ${orgName} (${roleInfo.label})`}
                    >
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                            {isLoading && !activeOrg ? "Loading..." : orgName}
                        </div>
                        {activeUnitNumber && (
                            <div style={{ fontSize: "0.775rem", fontWeight: 800, color: "#4f46e5", whiteSpace: "nowrap" }}>
                                Unit {activeUnitNumber}
                            </div>
                        )}
                        <span
                            style={{
                                fontSize: "0.625rem",
                                fontWeight: 700,
                                backgroundColor: roleInfo.bg,
                                color: roleInfo.color,
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {roleInfo.label}
                        </span>
                    </div>

                    <div style={{ maxWidth: "950px", margin: "0 auto" }}>

                        {/* MODULE 1: Organization */}
                        {activeTab === "organization" && (
                            <div className="fade-in" style={cardStyle}>
                                <div style={headerStyle}>
                                    <h2 style={titleStyle}>Organization — Overview</h2>
                                    <p style={subtitleStyle}>General organization settings, configuration, and workspace status.</p>
                                </div>
                                <div style={bodyStyle}>
                                    <div style={infoGridStyle}>
                                        <div style={infoCardStyle}>
                                            <span style={infoLabelStyle}>Organization Name</span>
                                            <span style={infoValueStyle}>{orgName}</span>
                                        </div>
                                        <div style={infoCardStyle}>
                                            <span style={infoLabelStyle}>Organization ID</span>
                                            <code style={{ ...infoValueStyle, color: "#4f46e5" }}>{orgId || "N/A"}</code>
                                        </div>
                                        <div style={infoCardStyle}>
                                            <span style={infoLabelStyle}>Organization Type</span>
                                            <span style={infoValueStyle}>{activeOrg?.organizationType || "APARTMENT"}</span>
                                        </div>
                                        <div style={infoCardStyle}>
                                            <span style={infoLabelStyle}>Your Member Role</span>
                                            <span style={{ ...infoValueStyle, color: roleInfo.color }}>{roleInfo.label}</span>
                                        </div>
                                    </div>
                                    <p style={placeholderTextStyle}>
                                        🏢 Organization details module placeholder. Full management features will be built in the next step.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* MODULE 2: Units (Full Interactive Module: List, Add Unit, Unit Details Hub, Edit Unit, Add User to Unit) */}
                        {activeTab === "units" && orgId && (
                            <>
                                {unitSubView === "new" ? (
                                    isOwnerOrAdmin ? (
                                        <AddUnitPage
                                            orgId={orgId}
                                            onCancel={() => navigate(`/org/${orgId}/units`)}
                                            onCreated={(newUnitId) => navigate(`/org/${orgId}/units/${newUnitId}`)}
                                        />
                                    ) : (
                                        <div
                                            className="fade-in"
                                            style={{
                                                backgroundColor: "#ffffff",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "16px",
                                                padding: "48px 24px",
                                                textAlign: "center",
                                                maxWidth: "520px",
                                                margin: "40px auto",
                                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
                                            }}
                                        >
                                            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔒</div>
                                            <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                                                Access Restricted
                                            </h3>
                                            <p style={{ fontSize: "0.925rem", color: "#64748b", margin: "0 0 24px", lineHeight: 1.5 }}>
                                                Only property owners, administrators, or managers can add new units.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/org/${orgId}/units`)}
                                                style={{
                                                    backgroundColor: "#4f46e5",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    borderRadius: "10px",
                                                    padding: "10px 24px",
                                                    fontSize: "0.9rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Back to Units List
                                            </button>
                                        </div>
                                    )
                                ) : unitSubView === "add-user" && unitId ? (
                                    <AddUserToUnitPage
                                        orgId={orgId}
                                        unitId={unitId}
                                        onBack={() => navigate(`/org/${orgId}/units/${unitId}`)}
                                    />
                                ) : unitSubView === "edit" && unitId ? (
                                    <EditUnitPage
                                        orgId={orgId}
                                        unitId={unitId}
                                        onBack={() => navigate(`/org/${orgId}/units/${unitId}`)}
                                    />
                                ) : (unitSubView === "details" || unitId) && unitId ? (
                                    <UnitDetailPage
                                        orgId={orgId}
                                        unitId={unitId}
                                        onBack={() => navigate(`/org/${orgId}/units`)}
                                        onEditUnit={() => navigate(`/org/${orgId}/units/${unitId}/edit`)}
                                        onAddUser={() => navigate(`/org/${orgId}/units/${unitId}/add-user`)}
                                    />
                                ) : (
                                    <UnitsList
                                        orgId={orgId}
                                        onAddUnit={() => navigate(`/org/${orgId}/units/new`)}
                                        onSelectUnit={(selectedId) => navigate(`/org/${orgId}/units/${selectedId}`)}
                                    />
                                )}
                            </>
                        )}

                        {/* MODULE 3: Users */}
                        {activeTab === "users" && orgId && (
                            <UsersSection
                                orgId={orgId}
                                onGoToUnit={(targetUnitId) => navigate(`/org/${orgId}/units/${targetUnitId}`)}
                            />
                        )}

                        {/* MODULE 4: Payment */}
                        {activeTab === "payment" && (
                            <PaymentsSection
                                orgId={orgId || ""}
                                isOwnerOrAdmin={isOwnerOrAdmin}
                                onGoToUnit={(targetUnitId) => navigate(`/org/${orgId}/units/${targetUnitId}`)}
                            />
                        )}

                        {/* MODULE 5: Invoice */}
                        {activeTab === "invoice" && (
                            <div className="fade-in" style={cardStyle}>
                                <div style={headerStyle}>
                                    <h2 style={titleStyle}>Invoice — Billing & Statements</h2>
                                    <p style={subtitleStyle}>Generate monthly rent receipts, digital invoices, and billing history.</p>
                                </div>
                                <div style={bodyStyle}>
                                    <div style={emptyBoxStyle}>
                                        <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Invoice Module Placeholder</h3>
                                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                                            Invoice generation, PDF exports, and billing reminders will be built here in step 5.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODULE 6: Settings */}
                        {activeTab === "settings" && (
                            <div className="fade-in" style={cardStyle}>
                                <div style={headerStyle}>
                                    <h2 style={titleStyle}>Settings — Workspace & Notification Sender Identity</h2>
                                    <p style={subtitleStyle}>Configure organization email display identities and custom WhatsApp Business credentials.</p>
                                </div>
                                <div style={bodyStyle}>
                                    {orgId ? (
                                        <SenderSettingsSection orgId={orgId} isOwnerOrAdmin={isOwnerOrAdmin} />
                                    ) : (
                                        <div style={{ color: "#64748b" }}>Please select an organization workspace.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* MODULE 7: Notification */}
                        {activeTab === "notification" && (
                            <div className="fade-in" style={cardStyle}>
                                <div style={headerStyle}>
                                    <h2 style={titleStyle}>Notifications & Activity Alerts</h2>
                                    <p style={subtitleStyle}>System announcements, tenant requests, and workspace updates.</p>
                                </div>
                                <div style={bodyStyle}>
                                    {notificationsList.length === 0 ? (
                                        <div style={emptyBoxStyle}>
                                            <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>No notifications yet</h3>
                                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                                                New family member requests, announcements, and activity updates will appear here.
                                            </p>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {notificationsList.map((item: any) => {
                                                const isFamilyRequestNotif = item.title?.includes("Family Member Request");
                                                return (
                                                    <div
                                                        key={item._id}
                                                        style={{
                                                            backgroundColor: item.isRead ? "#ffffff" : "#f0f5ff",
                                                            border: item.isRead ? "1px solid #e2e8f0" : "1px solid #c7d2fe",
                                                            borderRadius: "12px",
                                                            padding: "16px 20px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            flexWrap: "wrap",
                                                            gap: "16px",
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1 }}>
                                                            <div>
                                                                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                                                                    {item.title}
                                                                </div>
                                                                <div style={{ fontSize: "0.875rem", color: "#334155", marginTop: "3px" }}>
                                                                    {item.message}
                                                                </div>
                                                                <div style={{ fontSize: "0.775rem", color: "#94a3b8", marginTop: "6px" }}>
                                                                    {new Date(item.createdAt).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {isFamilyRequestNotif && roleInfo.isOwner && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectTab("users")}
                                                                style={{
                                                                    backgroundColor: "#4f46e5",
                                                                    color: "#ffffff",
                                                                    border: "none",
                                                                    borderRadius: "8px",
                                                                    padding: "9px 18px",
                                                                    fontWeight: 700,
                                                                    fontSize: "0.85rem",
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 2px 6px rgba(79, 70, 229, 0.25)",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                Review Request →
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* MODULE 8: Chat */}
                        {activeTab === "chat" && (
                            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div style={{ ...cardStyle, padding: "20px 24px" }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                                        <div>
                                            <h2 style={{ ...titleStyle, fontSize: "1.25rem" }}>💬 {orgName} — Real-Time Unit Chat</h2>
                                            <p style={{ ...subtitleStyle, fontSize: "0.85rem" }}>
                                                {isOwnerOrAdmin
                                                    ? `Select a unit thread in ${orgName} to communicate with unit occupants.`
                                                    : `Chat room for your assigned unit in ${orgName}.`}
                                            </p>
                                        </div>

                                        {unitsList.length > 1 && isOwnerOrAdmin && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <label style={{ fontSize: "0.825rem", fontWeight: 700, color: "#475569" }}>
                                                    Select Unit Thread:
                                                </label>
                                                <select
                                                    value={selectedChatUnitId || ""}
                                                    onChange={(e) => {
                                                        const targetId = e.target.value;
                                                        setSelectedChatUnitId(targetId);
                                                        const targetUnit = unitsList.find((u: any) => String(u._id || u.id) === String(targetId));
                                                        if (targetUnit) {
                                                            setActiveUnitNumber(targetUnit.unitNumber);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: "8px 14px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #cbd5e1",
                                                        fontWeight: 700,
                                                        color: "#0f172a",
                                                        backgroundColor: "#ffffff",
                                                        cursor: "pointer",
                                                        outline: "none",
                                                    }}
                                                >
                                                    {unitsList.map((u: any) => {
                                                        const id = String(u._id || u.id);
                                                        return (
                                                            <option key={id} value={id}>
                                                                Unit {u.unitNumber} {u.propertyId?.name ? `(${u.propertyId.name})` : ""}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {orgId && (selectedChatUnitId || unitsList[0]?._id) ? (
                                    <UnitChatModule
                                        orgId={orgId}
                                        unitId={selectedChatUnitId || String(unitsList[0]._id)}
                                        unitNumber={
                                            unitsList.find((u) => String(u._id || u.id) === String(selectedChatUnitId || unitsList[0]?._id))
                                                ?.unitNumber
                                        }
                                    />
                                ) : (
                                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", backgroundColor: "#ffffff", borderRadius: "16px" }}>
                                        No units found in this organization yet.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MODULE 9: Profile */}
                        {activeTab === "profile" && (
                            <div className="fade-in" style={cardStyle}>
                                <div style={headerStyle}>
                                    <h2 style={titleStyle}>Profile — Account Info</h2>
                                    <p style={subtitleStyle}>Your personal user profile, contact details, and credentials.</p>
                                </div>
                                <div style={bodyStyle}>
                                    <div style={infoGridStyle}>
                                        <div style={infoCardStyle}>
                                            <span style={infoLabelStyle}>Full Name</span>
                                            <span style={infoValueStyle}>{user?.name || user?.fullName || "N/A"}</span>
                                        </div>
                                        <div style={infoCardStyle}>
                                            <span style={infoLabelStyle}>Email Address</span>
                                            <span style={infoValueStyle}>{user?.email || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div style={{ ...emptyBoxStyle, marginTop: "20px" }}>
                                        <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>👤</div>
                                        <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Profile Module Placeholder</h3>
                                        <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                                            User profile editing and contact preferences will be built here in step 8.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Reusable Inline Styles for Placeholder Cards
const cardStyle: React.CSSProperties = {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
};

const headerStyle: React.CSSProperties = {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
};

const titleStyle: React.CSSProperties = {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
};

const subtitleStyle: React.CSSProperties = {
    margin: "4px 0 0",
    fontSize: "0.9rem",
    color: "#64748b",
};

const bodyStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
};

const emptyBoxStyle: React.CSSProperties = {
    padding: "48px 24px",
    textAlign: "center",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
};

const infoGridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
};

const infoCardStyle: React.CSSProperties = {
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
};

const infoLabelStyle: React.CSSProperties = {
    fontSize: "0.775rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
};

const infoValueStyle: React.CSSProperties = {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#0f172a",
};

const placeholderTextStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    color: "#64748b",
    lineHeight: 1.5,
    margin: 0,
};

export default DashboardPage;
