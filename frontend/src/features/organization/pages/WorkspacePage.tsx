import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { logout } from "@/features/auth/store/authSlice";
import {
    setMemberships,
    setCurrentOrgId,
    setCurrentUnitId,
    setOrganizationLoading,
    addMembership,
    clearOrganizationState,
} from "../store/organizationSlice";
import { getUserMembershipsApi, getNotificationsApi } from "../services/organizationApi";
import { getUsersGroupedByUnitApi } from "../services/familyRequestsApi";
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
    const { user } = useSelector((state: RootState) => state.auth);
    const { memberships, isLoading } = useSelector((state: RootState) => state.organization);

    const [activeTab, setActiveTab] = useState<WorkspaceTab>("organizations");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [orgUnitsMap, setOrgUnitsMap] = useState<Record<string, any[]>>({});

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
                const mems = memRes.value.data || [];
                dispatch(setMemberships(mems));

                // Fetch units for each org to build the nested tree: org -> unit
                const unitsPromises = mems.map(async (m: any) => {
                    const orgId = typeof m.organizationId === "object" ? m.organizationId?._id : m.organizationId;
                    if (!orgId) return { orgId: "", units: [] };
                    try {
                        const res = await getUsersGroupedByUnitApi(orgId);
                        if (res.success && res.data) {
                            const rawUnits = res.data.units || res.data.unitsWithOccupants || [];
                            return { orgId, units: rawUnits };
                        }
                    } catch {
                        // ignore error
                    }
                    return { orgId, units: [] };
                });

                const unitsResults = await Promise.all(unitsPromises);
                const newUnitsMap: Record<string, any[]> = {};
                unitsResults.forEach((r) => {
                    if (r.orgId) {
                        newUnitsMap[r.orgId] = r.units;
                    }
                });
                setOrgUnitsMap(newUnitsMap);
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

    const handleSelectOrganizationUnit = (orgId: string, unitId: string) => {
        dispatch(setCurrentOrgId(orgId));
        dispatch(setCurrentUnitId(unitId));
        navigate(`/org/${orgId}/dashboard?unitId=${unitId}`);
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

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: "40px 32px", overflowY: "auto" }}>
                    <div style={{ maxWidth: "880px", margin: "0 auto" }}>
                        {/* Page Header */}
                        <div style={{ marginBottom: "28px" }}>
                            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                NestPay Workspace
                            </h1>
                            <p style={{ margin: "6px 0 0", fontSize: "1rem", color: "#64748b" }}>
                                {activeTab === "organizations" && "Please select an organization workspace or specific unit workspace"}
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
                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04)",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: "24px",
                                        paddingBottom: "16px",
                                        borderBottom: "1px solid #f1f5f9",
                                    }}
                                >
                                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                                        Select Workspace & Units
                                    </h2>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                                        Organizations and your assigned unit workspaces are grouped below.
                                    </p>
                                </div>

                                {isLoading ? (
                                    <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
                                        <p style={{ margin: 0, fontSize: "0.95rem" }}>Loading your workspaces and unit assignments...</p>
                                    </div>
                                ) : memberships.length === 0 ? (
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
                                        <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
                                            No Organizations Found
                                        </h3>
                                        <p style={{ fontSize: "0.95rem", color: "#64748b", maxWidth: "440px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                                            You do not belong to any organization yet. Create your first property organization to get started!
                                        </p>
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => setIsCreateModalOpen(true)}
                                        >
                                            + Create Organization
                                        </Button>
                                    </div>
                                ) : (
                                    /* Nested Tree List: Org -> Units */
                                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                        {memberships.map((membership) => {
                                            const org = typeof membership.organizationId === "object" && membership.organizationId !== null
                                                ? membership.organizationId
                                                : null;

                                            if (!org) return null;

                                            const roleInfo = formatRoleLabel(membership.role);
                                            const isOwner = ["OWNER", "ADMIN", "MANAGER"].includes(membership.role);
                                            const orgUnits = orgUnitsMap[org._id] || [];

                                            // Filter units for tenants if not owner
                                            const userEmail = user?.email?.toLowerCase();
                                            const userPhone = user?.phone;
                                            const tenantUnits = isOwner
                                                ? orgUnits
                                                : orgUnits.filter((uObj: any) => {
                                                      const occs = uObj.occupants || [];
                                                      return occs.some((occ: any) => {
                                                          const e = occ.email?.toLowerCase();
                                                          const p = occ.phone;
                                                          return (userEmail && e === userEmail) || (userPhone && p === userPhone);
                                                      });
                                                  });

                                            return (
                                                <div
                                                    key={membership._id}
                                                    style={{
                                                        backgroundColor: "#ffffff",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "14px",
                                                        padding: "20px",
                                                        boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                                                    }}
                                                >
                                                    {/* Organization Name Header */}
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div
                                                                style={{
                                                                    width: "36px",
                                                                    height: "36px",
                                                                    borderRadius: "8px",
                                                                    backgroundColor: roleInfo.bg,
                                                                    color: roleInfo.color,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    flexShrink: 0,
                                                                }}
                                                            >
                                                                <OrganizationIcon size={18} />
                                                            </div>
                                                            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                                                                {org.name || "Unnamed Organization"}
                                                            </h3>
                                                        </div>

                                                        {isOwner && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSelectOrganization(org._id)}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    color: "#4f46e5",
                                                                    fontWeight: 700,
                                                                    fontSize: "0.85rem",
                                                                    cursor: "pointer",
                                                                }}
                                                            >
                                                                Property Dashboard →
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Nested Units List */}
                                                    {tenantUnits.length > 0 && (
                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "8px" }}>
                                                            {tenantUnits.map((uObj: any) => {
                                                                const u = uObj.unit || uObj;
                                                                const uId = String(u._id || u.id);
                                                                const uNum = u.unitNumber || "101";
                                                                const uName = u.unitName || u.name || "";

                                                                // Find user's role in this unit
                                                                const occs = uObj.occupants || [];
                                                                const myOcc = occs.find((occ: any) => {
                                                                    const e = occ.email?.toLowerCase();
                                                                    const p = occ.phone;
                                                                    return (userEmail && e === userEmail) || (userPhone && p === userPhone);
                                                                });
                                                                const unitRoleLabel = myOcc?.occupancyRole || (isOwner ? "Owner / Admin" : u.occupancyType || "Tenant");

                                                                return (
                                                                    <div
                                                                        key={uId}
                                                                        onClick={() => handleSelectOrganizationUnit(org._id, uId)}
                                                                        style={{
                                                                            padding: "14px 18px",
                                                                            backgroundColor: "#f8fafc",
                                                                            border: "1px solid #e2e8f0",
                                                                            borderRadius: "10px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "space-between",
                                                                            cursor: "pointer",
                                                                            transition: "all 0.15s ease",
                                                                        }}
                                                                        onMouseEnter={(ev) => {
                                                                            ev.currentTarget.style.backgroundColor = "#eef2ff";
                                                                            ev.currentTarget.style.borderColor = "#c7d2fe";
                                                                        }}
                                                                        onMouseLeave={(ev) => {
                                                                            ev.currentTarget.style.backgroundColor = "#f8fafc";
                                                                            ev.currentTarget.style.borderColor = "#e2e8f0";
                                                                        }}
                                                                    >
                                                                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                                            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>
                                                                                Unit {uNum} {uName ? `(${uName})` : ""}
                                                                            </div>
                                                                            <div style={{ fontSize: "0.775rem", color: "#64748b" }}>
                                                                                {org.name || "Organization"}
                                                                            </div>
                                                                        </div>

                                                                        <span
                                                                            style={{
                                                                                fontSize: "0.775rem",
                                                                                fontWeight: 700,
                                                                                backgroundColor: isOwner ? "#e0e7ff" : "#dcfce7",
                                                                                color: isOwner ? "#3730a3" : "#166534",
                                                                                padding: "4px 14px",
                                                                                borderRadius: "9999px",
                                                                            }}
                                                                        >
                                                                            {unitRoleLabel}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

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
                                                }}
                                            >
                                                + Create Organization
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "profile" && <ProfileView />}
                        {activeTab === "settings" && <SettingsView />}
                        {activeTab === "notification" && (
                            <NotificationView onInviteAccepted={loadData} />
                        )}
                    </div>
                </main>
            </div>

            <CreateOrganizationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleOrganizationCreated}
            />
        </div>
    );
};

export default WorkspacePage;
