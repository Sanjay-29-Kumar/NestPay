import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "@/store";
import { getDirectoryPermissions } from "@/features/organization/utils/permissions";
import { getUnitsApi, type UnitData } from "../services/unitsApi";

interface UnitsListProps {
    orgId: string;
    onAddUnit: () => void;
    onSelectUnit: (unitId: string) => void;
    onAddUserToUnit?: (unitId: string) => void;
}

export const UnitsList: React.FC<UnitsListProps> = ({ orgId, onAddUnit, onSelectUnit, onAddUserToUnit }) => {
    const { memberships, currentUnitId } = useSelector((state: RootState) => state.organization);
    const [searchParams] = useSearchParams();
    const activeUnitId = searchParams.get("unitId") || currentUnitId;

    const activeMembership = memberships.find((m) => {
        const org = typeof m.organizationId === "object" ? m.organizationId : null;
        return org?._id === orgId;
    });
    const userRole = activeMembership?.role || "TENANT";
    const perms = getDirectoryPermissions(userRole);
    const isOwnerOrAdmin = perms.canAddUser;

    const [units, setUnits] = useState<UnitData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUnitForMenu, setSelectedUnitForMenu] = useState<UnitData | null>(null);
    const [selectedUnitForReadOnly, setSelectedUnitForReadOnly] = useState<UnitData | null>(null);

    // Pin currently active unit at top for Tenants
    const sortedUnits = [...units].sort((a, b) => {
        if (!activeUnitId) return 0;
        const aIsActive = String(a._id) === String(activeUnitId);
        const bIsActive = String(b._id) === String(activeUnitId);
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        return 0;
    });

    useEffect(() => {
        loadUnits();
    }, [orgId]);

    const loadUnits = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUnitsApi(orgId);
            if (res.success && res.data) {
                setUnits(res.data.units || []);
            } else {
                setError(res.message || "Failed to load units.");
            }
        } catch {
            setError("Error loading units.");
        } finally {
            setLoading(false);
        }
    };

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
                <p style={{ margin: 0, fontSize: "0.925rem", fontWeight: 500 }}>Loading units...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "20px",
                    color: "#991b1b",
                    fontSize: "0.925rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span>⚠️ {error}</span>
                <button
                    type="button"
                    onClick={loadUnits}
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #fca5a5",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        color: "#991b1b",
                        cursor: "pointer",
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // Zero Units — Empty State View
    if (units.length === 0) {
        return (
            <div
                className="fade-in"
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "64px 32px",
                    textAlign: "center",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
                }}
            >
                <div
                    style={{
                        width: "72px",
                        height: "72px",
                        backgroundColor: "#eef2ff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        margin: "0 auto 20px",
                        boxShadow: "0 0 0 8px rgba(238, 242, 255, 0.5)",
                    }}
                >
                    🏠
                </div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                    No units yet
                </h3>
                <p
                    style={{
                        fontSize: "0.95rem",
                        color: "#64748b",
                        maxWidth: "420px",
                        margin: "0 auto 28px",
                        lineHeight: 1.5,
                    }}
                >
                    Add your first unit to start managing property spaces, room types, and tenant assignments.
                </p>
                <button
                    type="button"
                    onClick={onAddUnit}
                    style={{
                        backgroundColor: "#4f46e5",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px 28px",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 4px 14px 0 rgba(79, 70, 229, 0.35)",
                        transition: "all 0.2s ease",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#4338ca";
                        e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#4f46e5";
                        e.currentTarget.style.transform = "none";
                    }}
                >
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, lineHeight: 1 }}>+</span>
                    <span>Add Unit</span>
                </button>
            </div>
        );
    }

    // Units Exist — Populated List & Grid View
    return (
        <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header section with page title & top "+ Add Unit" button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Units & Properties
                    </h2>
                    <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "4px 0 0" }}>
                        {units.length} {units.length === 1 ? "unit" : "units"} registered in this workspace
                    </p>
                </div>
                {isOwnerOrAdmin && (
                    <button
                        type="button"
                        onClick={onAddUnit}
                        style={{
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "10px 20px",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 4px 12px 0 rgba(79, 70, 229, 0.25)",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#4338ca";
                            e.currentTarget.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#4f46e5";
                            e.currentTarget.style.transform = "none";
                        }}
                    >
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1 }}>+</span>
                        <span>Add Unit</span>
                    </button>
                )}
            </div>

            {/* Grid of Unit Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "20px",
                }}
            >
                {sortedUnits.map((unit) => {
                    const isOccupied = unit.status === "OCCUPIED";
                    const isActive = String(unit._id) === String(activeUnitId);
                    const roomTypeLabel = unit.roomType || unit.unitType || "Flat";
                    const blockFloorInfo = [
                        unit.blockWing ? `Block ${unit.blockWing}` : null,
                        unit.floor ? `Floor ${unit.floor}` : null,
                    ]
                        .filter(Boolean)
                        .join(" • ");

                    return (
                        <div
                            key={unit._id}
                            onClick={() => onSelectUnit(unit._id)}
                            style={{
                                backgroundColor: isActive ? "#f5f3ff" : "#ffffff",
                                border: isActive ? "2px solid #6366f1" : "1px solid #e2e8f0",
                                borderRadius: "14px",
                                padding: "20px",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: isActive ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "0 2px 4px 0 rgba(0,0,0,0.02)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "16px",
                                position: "relative",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isActive ? "#4f46e5" : "#c7d2fe";
                                e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(79, 70, 229, 0.12)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isActive ? "#6366f1" : "#e2e8f0";
                                e.currentTarget.style.boxShadow = isActive ? "0 4px 12px rgba(99, 102, 241, 0.15)" : "0 2px 4px 0 rgba(0,0,0,0.02)";
                                e.currentTarget.style.transform = "none";
                            }}
                        >
                            {/* Card Top: Unit Number & Status Badge */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                                            Unit {unit.unitNumber}
                                        </div>
                                        {isActive && (
                                            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#4f46e5", backgroundColor: "#e0e7ff", padding: "2px 8px", borderRadius: "9999px" }}>
                                                📍 Active
                                            </span>
                                        )}
                                    </div>
                                    {blockFloorInfo && (
                                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                            {blockFloorInfo}
                                        </div>
                                    )}
                                </div>
                                <span
                                    style={{
                                        fontSize: "0.7rem",
                                        fontWeight: 700,
                                        padding: "3px 9px",
                                        borderRadius: "9999px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.03em",
                                        backgroundColor: isOccupied ? "#e0e7ff" : "#dcfce7",
                                        color: isOccupied ? "#3730a3" : "#166534",
                                    }}
                                >
                                    {isOccupied ? "OCCUPIED" : "VACANT"}
                                </span>
                            </div>

                            {/* Card Middle: Room Type & Rent Pill */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                                <span
                                    style={{
                                        fontSize: "0.825rem",
                                        fontWeight: 600,
                                        backgroundColor: "#f1f5f9",
                                        color: "#334155",
                                        padding: "3px 10px",
                                        borderRadius: "6px",
                                    }}
                                >
                                    {roomTypeLabel}
                                </span>

                                {unit.rentAmount && unit.rentAmount > 0 ? (
                                    <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                                        ₹{unit.rentAmount.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}>/mo</span>
                                    </span>
                                ) : (
                                    <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                                        No rent set
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Trailing "+ Add Unit" Tile Card */}
                <div
                    onClick={onAddUnit}
                    style={{
                        backgroundColor: "#f8fafc",
                        border: "2px dashed #cbd5e1",
                        borderRadius: "14px",
                        padding: "24px 20px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "130px",
                        gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#4f46e5";
                        e.currentTarget.style.backgroundColor = "#eef2ff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#cbd5e1";
                        e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            backgroundColor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            fontWeight: 700,
                            color: "#4f46e5",
                        }}
                    >
                        +
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#4f46e5" }}>Add Unit</span>
                </div>
            </div>

            {/* Action Menu Modal for Unit Card */}
            {selectedUnitForMenu && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.5)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1100,
                        padding: "20px",
                    }}
                    onClick={() => setSelectedUnitForMenu(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            maxWidth: "420px",
                            width: "100%",
                            padding: "24px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                                    Unit {selectedUnitForMenu.unitNumber} Options
                                </h3>
                                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                    Select an action for this property space
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedUnitForMenu(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "1.4rem",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0 12px" }}>
                            {/* Action 1: Edit Unit */}
                            <button
                                type="button"
                                onClick={() => {
                                    const uId = selectedUnitForMenu._id;
                                    setSelectedUnitForMenu(null);
                                    onSelectUnit(uId);
                                }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    padding: "14px 18px",
                                    borderRadius: "10px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#ffffff",
                                    color: "#0f172a",
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = "#4f46e5";
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "#cbd5e1";
                                    e.currentTarget.style.backgroundColor = "#ffffff";
                                }}
                            >
                                <span>✏️ Edit Unit Details</span>
                                <span style={{ color: "#64748b" }}>→</span>
                            </button>

                            {/* Action 2: Add User */}
                            {(() => {
                                const isAddUserDisabled =
                                    selectedUnitForMenu.status === "OCCUPIED" &&
                                    selectedUnitForMenu.occupancyType === "Single";
                                return (
                                    <button
                                        type="button"
                                        disabled={isAddUserDisabled}
                                        onClick={() => {
                                            if (isAddUserDisabled) return;
                                            const uId = selectedUnitForMenu._id;
                                            setSelectedUnitForMenu(null);
                                            if (onAddUserToUnit) {
                                                onAddUserToUnit(uId);
                                            } else {
                                                window.location.href = `/org/${orgId}/units/${uId}/add-user`;
                                            }
                                        }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            width: "100%",
                                            padding: "14px 18px",
                                            borderRadius: "10px",
                                            border: isAddUserDisabled ? "1px solid #e2e8f0" : "1px solid #4f46e5",
                                            backgroundColor: isAddUserDisabled ? "#f8fafc" : "#eef2ff",
                                            color: isAddUserDisabled ? "#94a3b8" : "#4f46e5",
                                            fontWeight: 700,
                                            fontSize: "0.95rem",
                                            cursor: isAddUserDisabled ? "not-allowed" : "pointer",
                                            opacity: isAddUserDisabled ? 0.6 : 1,
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <span>👤 Add User to Unit</span>
                                        {isAddUserDisabled ? (
                                            <span style={{ fontSize: "0.75rem", backgroundColor: "#e2e8f0", color: "#64748b", padding: "2px 8px", borderRadius: "9999px" }}>
                                                Single Occupant Assigned
                                            </span>
                                        ) : (
                                            <span>+</span>
                                        )}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Read-Only Unit Modal for Tenants */}
            {selectedUnitForReadOnly && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.5)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1100,
                        padding: "20px",
                    }}
                    onClick={() => setSelectedUnitForReadOnly(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            maxWidth: "440px",
                            width: "100%",
                            padding: "24px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                                    Unit {selectedUnitForReadOnly.unitNumber} Details
                                </h3>
                                <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                    Read-only property space overview
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedUnitForReadOnly(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "1.4rem",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                    padding: "4px",
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.875rem" }}>Room Type</span>
                                <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.875rem" }}>{selectedUnitForReadOnly.roomType || "Flat"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.875rem" }}>Monthly Rent</span>
                                <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.875rem" }}>₹{selectedUnitForReadOnly.rentAmount?.toLocaleString() || 0}/mo</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.875rem" }}>Occupancy Type</span>
                                <span style={{ color: "#0f172a", fontWeight: 700, fontSize: "0.875rem" }}>{selectedUnitForReadOnly.occupancyType || "Family"}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                                <span style={{ color: "#64748b", fontWeight: 600, fontSize: "0.875rem" }}>Status</span>
                                <span style={{ color: selectedUnitForReadOnly.status === "OCCUPIED" ? "#3730a3" : "#166534", fontWeight: 800, fontSize: "0.875rem" }}>{selectedUnitForReadOnly.status}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedUnitForReadOnly(null)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                backgroundColor: "#f1f5f9",
                                color: "#334155",
                                border: "none",
                                borderRadius: "10px",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitsList;

