import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { logout } from "@/features/auth/store/authSlice";
import {
    setMemberships,
    setCurrentOrgId,
    setOrganizationLoading,
    addMembership,
    clearOrganizationState,
} from "../store/organizationSlice";
import { getUserMembershipsApi, getNotificationsApi } from "../services/organizationApi";
import type { Membership, NotificationItem } from "../types/organization.types";

import WorkspaceNavbar from "../components/WorkspaceNavbar";
import WorkspaceSidebar, { type WorkspaceTab } from "../components/WorkspaceSidebar";
import CreateOrganizationModal from "../components/CreateOrganizationModal";
import ProfileView from "../components/ProfileView";
import SettingsView from "../components/SettingsView";
import NotificationView from "../components/NotificationView";
import Button from "@/components/ui/Button";
import { OrganizationIcon } from "@/components/ui/Icons";

export const WorkspacePage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { memberships, isLoading } = useSelector((state: RootState) => state.organization);

    const [activeTab, setActiveTab] = useState<WorkspaceTab>("organizations");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        dispatch(setOrganizationLoading(true));
        try {
            const [memRes, notifRes] = await Promise.allSettled([
                getUserMembershipsApi(),
                getNotificationsApi(),
            ]);

            if (memRes.status === "fulfilled" && memRes.value?.success) {
                dispatch(setMemberships(memRes.value.data));
            }

            if (notifRes.status === "fulfilled" && notifRes.value?.success) {
                setNotifications(notifRes.value.data || []);
            }
        } catch {
            // handle error silently
        } finally {
            dispatch(setOrganizationLoading(false));
        }
    };

    const handleSelectTab = (tab: WorkspaceTab) => {
        if (tab === "logout") {
            dispatch(logout());
            dispatch(clearOrganizationState());
            return;
        }
        setActiveTab(tab);
    };

    const handleSelectOrganization = (orgId: string) => {
        dispatch(setCurrentOrgId(orgId));
        navigate(`/org/${orgId}/dashboard`);
    };

    const handleOrganizationCreated = (newMembership: Membership) => {
        dispatch(addMembership(newMembership));
        if (newMembership.organizationId?._id) {
            handleSelectOrganization(newMembership.organizationId._id);
        }
    };

    const formatRoleLabel = (role: string) => {
        switch (role) {
            case "OWNER":
                return { label: "Owner", bg: "#e0e7ff", color: "#3730a3" };
            case "ADMIN":
                return { label: "Admin", bg: "#f3e8ff", color: "#6b21a8" };
            case "MANAGER":
                return { label: "Manager", bg: "#dbeafe", color: "#1e40af" };
            case "ACCOUNTANT":
                return { label: "Accountant", bg: "#fef3c7", color: "#92400e" };
            case "TENANT":
                return { label: "Tenant", bg: "#dcfce7", color: "#166534" };
            case "MEMBER":
                return { label: "Tenant Family", bg: "#e0f2fe", color: "#075985" };
            default:
                return { label: role, bg: "#f1f5f9", color: "#334155" };
        }
    };

    const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
            {/* Top Navbar */}
            <WorkspaceNavbar
                onOpenProfile={() => setActiveTab("profile")}
                onOpenNotifications={() => setActiveTab("notification")}
                unreadNotificationsCount={unreadNotifsCount}
            />

            {/* Layout Body */}
            <div style={{ display: "flex", flex: 1 }}>
                {/* Side Panel */}
                <WorkspaceSidebar
                    activeTab={activeTab}
                    onSelectTab={handleSelectTab}
                    unreadCount={unreadNotifsCount}
                />

                {/* Main Content Area - Swaps content in-place without drawer overlays */}
                <main style={{ flex: 1, padding: "40px 32px", overflowY: "auto" }}>
                    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
                        {/* Page Header */}
                        <div style={{ marginBottom: "28px" }}>
                            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                NestPay Workspace
                            </h1>
                            <p style={{ margin: "6px 0 0", fontSize: "1rem", color: "#64748b" }}>
                                {activeTab === "organizations" && "Please select an organization workspace"}
                                {activeTab === "profile" && "Your personal profile and account settings"}
                                {activeTab === "settings" && "Workspace & security configuration"}
                                {activeTab === "notification" && "System notifications & organization invitations"}
                            </p>
                        </div>

                        {/* TAB 1: Organizations (Default Workspace Picker) */}
                        {activeTab === "organizations" && (
                            <div
                                className="fade-in"
                                style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "16px",
                                    padding: "32px",
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
                                }}
                            >
                                {/* Single Outer Card Header - NO duplicate button on top right */}
                                <div
                                    style={{
                                        marginBottom: "24px",
                                        paddingBottom: "16px",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        Select Workspace
                                    </h2>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                                        Choose an organization workspace to manage or view.
                                    </p>
                                </div>

                                {/* Card Data Content State */}
                                {isLoading ? (
                                    <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
                                        <div style={{ fontSize: "1.8rem", marginBottom: "12px" }}>⏳</div>
                                        <p style={{ margin: 0, fontSize: "0.95rem" }}>Loading your workspaces...</p>
                                    </div>
                                ) : memberships.length === 0 ? (
                                    /* State 1: No organizations yet */
                                    <div
                                        style={{
                                            padding: "48px 24px",
                                            textAlign: "center",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: "72px",
                                                height: "72px",
                                                borderRadius: "50%",
                                                backgroundColor: "#eef2ff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "2.2rem",
                                                marginBottom: "20px",
                                                color: "#4f46e5",
                                            }}
                                        >
                                            🏢
                                        </div>

                                        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                                            No Organizations Found
                                        </h3>

                                        <p
                                            style={{
                                                fontSize: "0.95rem",
                                                color: "#64748b",
                                                maxWidth: "440px",
                                                margin: "0 auto 28px",
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            You do not belong to any organization yet. Create your first property organization to get started!
                                        </p>

                                        {/* Single Create Organization CTA */}
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => setIsCreateModalOpen(true)}
                                        >
                                            + Create Organization
                                        </Button>
                                    </div>
                                ) : (
                                    /* State 2: Has one or more organizations - Clean Stacked List */
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                borderRadius: "12px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {memberships.map((membership, idx) => {
                                                const org = typeof membership.organizationId === "object" && membership.organizationId !== null
                                                    ? membership.organizationId
                                                    : null;

                                                if (!org) return null;

                                                const roleInfo = formatRoleLabel(membership.role);
                                                const logo = org.logo;
                                                const isLast = idx === memberships.length - 1;

                                                return (
                                                    <div
                                                        key={membership._id}
                                                        onClick={() => handleSelectOrganization(org._id)}
                                                        style={{
                                                            padding: "16px 20px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            cursor: "pointer",
                                                            transition: "all 0.15s ease",
                                                            borderBottom: isLast ? "none" : "1px solid #f1f5f9",
                                                            borderRadius: "10px",
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = "#f8fafc";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = "transparent";
                                                        }}
                                                    >
                                                        {/* Left: Logo/Icon + Name + Type */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                            {logo ? (
                                                                <img
                                                                    src={logo}
                                                                    alt={org.name}
                                                                    style={{
                                                                        width: "44px",
                                                                        height: "44px",
                                                                        borderRadius: "10px",
                                                                        objectFit: "cover",
                                                                        border: "1px solid #e2e8f0",
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    style={{
                                                                        width: "44px",
                                                                        height: "44px",
                                                                        borderRadius: "10px",
                                                                        backgroundColor: "#eef2ff",
                                                                        color: "#4f46e5",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        flexShrink: 0,
                                                                    }}
                                                                >
                                                                    <OrganizationIcon size={22} />
                                                                </div>
                                                            )}

                                                            <div>
                                                                <h4
                                                                    style={{
                                                                        margin: 0,
                                                                        fontSize: "1.05rem",
                                                                        fontWeight: 700,
                                                                        color: "#0f172a",
                                                                    }}
                                                                >
                                                                    {org.name || "Unnamed Organization"}
                                                                </h4>
                                                                <p style={{ margin: "2px 0 0", fontSize: "0.825rem", color: "#64748b" }}>
                                                                    {org.organizationType
                                                                        ? org.organizationType.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                                                                        : "Apartment"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Right: Role Badge + Enter Link */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                                                            <span
                                                                style={{
                                                                    padding: "4px 12px",
                                                                    borderRadius: "9999px",
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 600,
                                                                    backgroundColor: roleInfo.bg,
                                                                    color: roleInfo.color,
                                                                }}
                                                            >
                                                                {roleInfo.label}
                                                            </span>

                                                            <span
                                                                style={{
                                                                    fontSize: "0.9rem",
                                                                    fontWeight: 600,
                                                                    color: "#4f46e5",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "4px",
                                                                }}
                                                            >
                                                                Enter &rarr;
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* SINGLE Create Organization link below the list */}
                                        <div
                                            style={{
                                                paddingTop: "16px",
                                                borderTop: "1px solid #f1f5f9",
                                                display: "flex",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setIsCreateModalOpen(true)}
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    color: "#4f46e5",
                                                    fontWeight: 600,
                                                    fontSize: "0.925rem",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    transition: "all 0.15s ease",
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#eef2ff")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                            >
                                                + Create Organization
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: Profile (In-Place View) */}
                        {activeTab === "profile" && <ProfileView />}

                        {/* TAB 3: Settings (In-Place View) */}
                        {activeTab === "settings" && <SettingsView />}

                        {/* TAB 4: Notifications (In-Place View) */}
                        {activeTab === "notification" && (
                            <NotificationView onInviteAccepted={loadData} />
                        )}
                    </div>
                </main>
            </div>

            {/* Create Organization Modal Dialog */}
            <CreateOrganizationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleOrganizationCreated}
            />
        </div>
    );
};

export default WorkspacePage;
