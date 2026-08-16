import React from "react";
import { getDirectoryPermissions } from "../utils/permissions";

interface TenantProfileModalProps {
    orgId: string;
    tenant: any;
    userRole: string;
    onClose: () => void;
    onGoToUnit?: (unitId: string) => void;
}

export const TenantProfileModal: React.FC<TenantProfileModalProps> = ({
    orgId,
    tenant,
    userRole,
    onClose,
    onGoToUnit,
}) => {
    if (!tenant) return null;

    const perms = getDirectoryPermissions(userRole);
    const unitObj = tenant.unitId;
    const unitNumber = typeof unitObj === "object" && unitObj?.unitNumber ? unitObj.unitNumber : "Unassigned";
    const unitIdStr = typeof unitObj === "object" && unitObj?._id ? unitObj._id : typeof unitObj === "string" ? unitObj : null;

    const occupancyRole = tenant.occupancyRole || "Single";
    const moveInDate = tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : null;

    // Compute initials
    const initials = tenant.name
        ? tenant.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .substring(0, 2)
              .toUpperCase()
        : "T";

    return (
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
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "18px",
                    maxWidth: "520px",
                    width: "100%",
                    padding: "28px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                            style={{
                                width: "52px",
                                height: "52px",
                                borderRadius: "50%",
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                fontSize: "1.2rem",
                                fontWeight: 800,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)",
                            }}
                        >
                            {initials}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                                {tenant.name}
                            </h3>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                                <span
                                    style={{
                                        fontSize: "0.725rem",
                                        fontWeight: 700,
                                        backgroundColor: "#e0e7ff",
                                        color: "#3730a3",
                                        padding: "2px 9px",
                                        borderRadius: "9999px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {occupancyRole}
                                </span>
                                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                                    Unit {unitNumber}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
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

                {/* Main Details Grid */}
                <div
                    style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                        marginBottom: "20px",
                    }}
                >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                Email Address
                            </div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                {tenant.email || "N/A"}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                Phone Number
                            </div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a", marginTop: "2px" }}>
                                {tenant.phone || "N/A"}
                            </div>
                        </div>
                    </div>

                    <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>
                            Deferred / Self-Service Fields
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <div style={{ fontSize: "0.775rem", color: "#64748b" }}>Move-in Date</div>
                                <div style={{ fontSize: "0.85rem", color: moveInDate ? "#0f172a" : "#94a3b8", fontStyle: moveInDate ? "normal" : "italic", marginTop: "2px" }}>
                                    {moveInDate || "Not set (Tenant updates in profile)"}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: "0.775rem", color: "#64748b" }}>Emergency Contact</div>
                                <div style={{ fontSize: "0.85rem", color: tenant.emergencyContact?.name ? "#0f172a" : "#94a3b8", fontStyle: tenant.emergencyContact?.name ? "normal" : "italic", marginTop: "2px" }}>
                                    {tenant.emergencyContact?.name ? `${tenant.emergencyContact.name} (${tenant.emergencyContact.phone})` : "Not provided (Tenant updates later)"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "#475569",
                            cursor: "pointer",
                        }}
                    >
                        Close
                    </button>

                    {/* Owner / Admin specific "Go to Unit →" button */}
                    {perms.canGoToUnitFromProfile && unitIdStr && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                if (onGoToUnit) {
                                    onGoToUnit(unitIdStr);
                                } else {
                                    window.location.href = `/org/${orgId}/units/${unitIdStr}`;
                                }
                            }}
                            style={{
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                border: "none",
                                padding: "10px 22px",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>Go to Unit</span>
                            <span>→</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TenantProfileModal;
