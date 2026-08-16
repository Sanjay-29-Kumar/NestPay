import React, { useEffect, useState } from "react";
import {
    getUsersGroupedByUnitApi,
    getFamilyRequestsApi,
    approveFamilyRequestApi,
    rejectFamilyRequestApi,
    type FamilyRequestData,
} from "../services/familyRequestsApi";
import { getDirectoryPermissions } from "../utils/permissions";
import { removeUserFromUnitApi } from "@/features/units/services/unitsApi";
import TenantProfileModal from "./TenantProfileModal";
import FamilyMemberRequestModal from "./FamilyMemberRequestModal";

interface UsersSectionProps {
    orgId: string;
    onGoToUnit?: (unitId: string) => void;
}

export const UsersSection: React.FC<UsersSectionProps> = ({ orgId, onGoToUnit }) => {
    const [activeSubTab, setActiveSubTab] = useState<"grouped" | "requests">("grouped");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Grouped data
    const [unitsWithOccupants, setUnitsWithOccupants] = useState<any[]>([]);
    const [unassignedOccupants, setUnassignedOccupants] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>("TENANT");
    const [currentUserOccupancyType, setCurrentUserOccupancyType] = useState<string | null>(null);

    // Family Requests
    const [familyRequests, setFamilyRequests] = useState<FamilyRequestData[]>([]);

    // Modals
    const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
    const [showFamilyReqModal, setShowFamilyReqModal] = useState<boolean>(false);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [orgId]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [groupedRes, reqRes] = await Promise.all([
                getUsersGroupedByUnitApi(orgId),
                getFamilyRequestsApi(orgId),
            ]);

            if (groupedRes.success && groupedRes.data) {
                setUnitsWithOccupants(groupedRes.data.units || []);
                setUnassignedOccupants(groupedRes.data.unassigned || []);
                setUserRole(groupedRes.data.userRole || "TENANT");
                setCurrentUserOccupancyType(groupedRes.data.currentUserOccupancyType || null);
            } else {
                setError(groupedRes.message || "Failed to load occupants.");
            }

            if (reqRes.success && reqRes.data) {
                setFamilyRequests(reqRes.data || []);
            }
        } catch {
            setError("Error loading users data.");
        } finally {
            setLoading(false);
        }
    };

    const handleApproveRequest = async (requestId: string) => {
        setActionLoadingId(requestId);
        const res = await approveFamilyRequestApi(orgId, requestId);
        setActionLoadingId(null);
        if (res.success) {
            loadData();
        } else {
            alert(res.message || "Failed to approve request.");
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        setActionLoadingId(requestId);
        const res = await rejectFamilyRequestApi(orgId, requestId);
        setActionLoadingId(null);
        if (res.success) {
            loadData();
        } else {
            alert(res.message || "Failed to reject request.");
        }
    };

    // Centralized RBAC permission checks
    const perms = getDirectoryPermissions(userRole, currentUserOccupancyType);
    const isOwnerOrAdmin = perms.canAddUser || ["OWNER", "ADMIN", "MANAGER"].includes(userRole);
    const pendingRequestsCount = familyRequests.filter((r) => r.status === "PENDING").length;

    if (loading) {
        return (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
                <div
                    style={{
                        width: "36px",
                        height: "36px",
                        border: "3px solid #cbd5e1",
                        borderTopColor: "#4f46e5",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 16px",
                    }}
                />
                <p style={{ margin: 0, fontSize: "0.925rem", fontWeight: 500 }}>Loading users directory...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header section */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Users & Occupants Directory
                    </h2>
                    <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "4px 0 0" }}>
                        Tenants, family heads, roommates, and workspace staff grouped by unit.
                    </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Owner/Admin: "+ Add User" button */}
                    {perms.canAddUser && (
                        <button
                            type="button"
                            onClick={() => {
                                if (onGoToUnit) {
                                    onGoToUnit("");
                                } else {
                                    window.location.href = `/org/${orgId}/units`;
                                }
                            }}
                            style={{
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "9px 18px",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <span>+ Add User</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-tabs ONLY for Owner / Admin */}
            {perms.canViewPendingRequestsTab && (
                <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "2px" }}>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("grouped")}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px 16px",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: activeSubTab === "grouped" ? "#4f46e5" : "#64748b",
                            borderBottom: activeSubTab === "grouped" ? "2px solid #4f46e5" : "2px solid transparent",
                            cursor: "pointer",
                        }}
                    >
                        Grouped by Unit
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSubTab("requests")}
                        style={{
                            background: "none",
                            border: "none",
                            padding: "8px 16px",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: activeSubTab === "requests" ? "#4f46e5" : "#64748b",
                            borderBottom: activeSubTab === "requests" ? "2px solid #4f46e5" : "2px solid transparent",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        <span>Pending Family Requests</span>
                        {pendingRequestsCount > 0 && (
                            <span
                                style={{
                                    backgroundColor: "#ef4444",
                                    color: "#ffffff",
                                    fontSize: "0.7rem",
                                    fontWeight: 800,
                                    padding: "1px 7px",
                                    borderRadius: "9999px",
                                }}
                            >
                                {pendingRequestsCount}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "14px 18px", borderRadius: "10px", fontSize: "0.9rem" }}>
                    ⚠️ {error}
                </div>
            )}

            {/* TAB 1: Grouped by Unit View */}
            {activeSubTab === "grouped" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {unitsWithOccupants.length === 0 && unassignedOccupants.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "48px 24px",
                                textAlign: "center",
                            }}
                        >
                            <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>No occupants registered</h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                                Add units and assign users from the Units module to populate the directory.
                            </p>
                        </div>
                    ) : (
                        unitsWithOccupants.map(({ unit, occupants }) => (
                            <div
                                key={unit._id}
                                style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "14px",
                                    overflow: "hidden",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                                }}
                            >
                                {/* Unit Header Bar */}
                                <div
                                    style={{
                                        backgroundColor: "#f8fafc",
                                        borderBottom: "1px solid #e2e8f0",
                                        padding: "14px 20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                                            Unit {unit.unitNumber}
                                        </span>
                                        {unit.blockWing && (
                                            <span style={{ fontSize: "0.8rem", color: "#64748b", backgroundColor: "#e2e8f0", padding: "2px 8px", borderRadius: "4px" }}>
                                                Block {unit.blockWing}
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                fontSize: "0.725rem",
                                                fontWeight: 700,
                                                padding: "2px 8px",
                                                borderRadius: "9999px",
                                                textTransform: "uppercase",
                                                backgroundColor: unit.status === "OCCUPIED" ? "#e0e7ff" : "#dcfce7",
                                                color: unit.status === "OCCUPIED" ? "#3730a3" : "#166534",
                                            }}
                                        >
                                            {unit.status}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: "0.825rem", fontWeight: 600, color: "#64748b" }}>
                                        {occupants.length} {occupants.length === 1 ? "occupant" : "occupants"}
                                    </span>
                                </div>

                                {/* Occupants Sub-Items List */}
                                <div style={{ padding: "8px 0" }}>
                                    {occupants.length === 0 ? (
                                        <div style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "0.875rem", fontStyle: "italic" }}>
                                            Vacant property space — No assigned occupants.
                                        </div>
                                    ) : (
                                        occupants.map((tenant: any) => (
                                            <div
                                                key={tenant._id}
                                                onClick={() => setSelectedTenant(tenant)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "12px 20px",
                                                    borderBottom: "1px solid #f1f5f9",
                                                    cursor: "pointer",
                                                    transition: "backgroundColor 0.15s ease",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = "transparent";
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <div
                                                        style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            borderRadius: "50%",
                                                            backgroundColor: "#eef2ff",
                                                            color: "#4f46e5",
                                                            fontWeight: 700,
                                                            fontSize: "0.875rem",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        {tenant.name ? tenant.name[0].toUpperCase() : "T"}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                                                            {tenant.name}
                                                        </div>
                                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                            {tenant.email} • {tenant.phone}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <span
                                                        style={{
                                                            fontSize: "0.725rem",
                                                            fontWeight: 700,
                                                            backgroundColor: "#f1f5f9",
                                                            color: "#334155",
                                                            padding: "3px 10px",
                                                            borderRadius: "9999px",
                                                        }}
                                                    >
                                                        {tenant.occupancyRole || "Resident"}
                                                    </span>
                                                    {isOwnerOrAdmin && (
                                                        <button
                                                            type="button"
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm(`Are you sure you want to remove ${tenant.name || "this user"} from Unit ${unit.unitNumber}?`)) {
                                                                    const res = await removeUserFromUnitApi(orgId, unit._id, tenant._id || tenant.email);
                                                                    if (res.success) {
                                                                        alert(res.message || "User removed successfully.");
                                                                        loadData();
                                                                    } else {
                                                                        alert(res.message || "Failed to remove user.");
                                                                    }
                                                                }
                                                            }}
                                                            style={{
                                                                backgroundColor: "#fee2e2",
                                                                color: "#991b1b",
                                                                border: "1px solid #fecaca",
                                                                borderRadius: "6px",
                                                                padding: "4px 10px",
                                                                fontSize: "0.725rem",
                                                                fontWeight: 700,
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                    <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>→</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB 2: Pending Family Requests */}
            {activeSubTab === "requests" && perms.canViewPendingRequestsTab && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {familyRequests.length === 0 ? (
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "48px 24px",
                                textAlign: "center",
                            }}
                        >
                            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📬</div>
                            <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>No pending family requests</h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b" }}>
                                Family member requests submitted by Family Heads will appear here for review.
                            </p>
                        </div>
                    ) : (
                        familyRequests.map((req) => {
                            const isPending = req.status === "PENDING";
                            const unitNum = req.unitId?.unitNumber || "N/A";
                            const headName = req.familyHeadUserId?.name || req.familyHeadUserId?.email || "Family Head";

                            return (
                                <div
                                    key={req._id}
                                    style={{
                                        backgroundColor: "#ffffff",
                                        border: "1px solid #e2e8f0",
                                        borderRadius: "14px",
                                        padding: "18px 22px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "16px",
                                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                                    }}
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                                                {req.name}
                                            </span>
                                            <span style={{ fontSize: "0.75rem", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 700, padding: "2px 8px", borderRadius: "9999px" }}>
                                                {req.relationship}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    padding: "2px 8px",
                                                    borderRadius: "9999px",
                                                    backgroundColor: req.status === "APPROVED" ? "#dcfce7" : req.status === "REJECTED" ? "#fef2f2" : "#fef3c7",
                                                    color: req.status === "APPROVED" ? "#166534" : req.status === "REJECTED" ? "#991b1b" : "#92400e",
                                                }}
                                            >
                                                {req.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                                            Requested by <strong>{headName}</strong> for <strong>Unit {unitNum}</strong> • {req.email} • {req.phone}
                                        </div>
                                    </div>

                                    {isPending && (
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <button
                                                type="button"
                                                disabled={actionLoadingId === req._id}
                                                onClick={() => handleRejectRequest(req._id)}
                                                style={{
                                                    backgroundColor: "#ffffff",
                                                    border: "1px solid #fca5a5",
                                                    color: "#991b1b",
                                                    padding: "6px 14px",
                                                    borderRadius: "8px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Decline
                                            </button>
                                            <button
                                                type="button"
                                                disabled={actionLoadingId === req._id}
                                                onClick={() => handleApproveRequest(req._id)}
                                                style={{
                                                    backgroundColor: "#10b981",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    padding: "7px 18px",
                                                    borderRadius: "8px",
                                                    fontWeight: 700,
                                                    fontSize: "0.85rem",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
                                                }}
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Tenant Profile Modal */}
            {selectedTenant && (
                <TenantProfileModal
                    orgId={orgId}
                    tenant={selectedTenant}
                    userRole={userRole}
                    onClose={() => setSelectedTenant(null)}
                    onGoToUnit={onGoToUnit}
                />
            )}

            {/* Family Member Request Modal */}
            {showFamilyReqModal && (
                <FamilyMemberRequestModal
                    orgId={orgId}
                    onClose={() => setShowFamilyReqModal(false)}
                    onSuccess={() => loadData()}
                />
            )}
        </div>
    );
};

export default UsersSection;
