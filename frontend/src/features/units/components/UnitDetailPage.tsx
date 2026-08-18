import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import type { RootState } from "@/store";
import { getDirectoryPermissions, getUnitAccessLevel } from "@/features/organization/utils/permissions";
import { getUnitByIdApi, removeUserFromUnitApi, type UnitData } from "../services/unitsApi";
import { getUsersGroupedByUnitApi } from "@/features/organization/services/familyRequestsApi";
import {
    getCurrentInvoiceApi,
    establishBillApi,
    issuePaymentDemandApi,
    type InvoiceData,
    type ReminderScheduleData,
} from "../services/invoiceApi";
import { getPaymentHistoryApi } from "@/features/organization/services/paymentsApi";
import InvoiceLogsSection from "./InvoiceLogsSection";
import ReminderScheduleConfig from "./ReminderScheduleConfig";
import MarkPaidModal from "./MarkPaidModal";

interface UnitDetailPageProps {
    orgId: string;
    unitId: string;
    onBack: () => void;
    onEditUnit: () => void;
    onAddUser: () => void;
}

type TabType = "details" | "tenants" | "payment" | "chat" | "invoice";

interface UtilityItem {
    id: string;
    label: string;
    amount: number;
}

export const UnitDetailPage: React.FC<UnitDetailPageProps> = ({
    orgId,
    unitId,
    onBack,
    onEditUnit,
    onAddUser,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { memberships, currentUnitId } = useSelector((state: RootState) => state.organization);
    const [searchParams] = useSearchParams();
    const urlUnitId = searchParams.get("unitId");
    const activeUnitId = urlUnitId || currentUnitId || unitId;

    const activeMembership = memberships.find((m) => {
        const org = typeof m.organizationId === "object" ? m.organizationId : null;
        return org?._id === orgId;
    });
    const userRole = activeMembership?.role || "TENANT";
    const perms = getDirectoryPermissions(userRole);
    const isOwnerOrAdmin = perms.canAddUser;

    const [unit, setUnit] = useState<UnitData | null>(null);
    const [occupants, setOccupants] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("details");

    // Automated Invoice & Payment Reminder System states
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [, setScheduleConfig] = useState<ReminderScheduleData | null>(null);
    const [utilitiesInput, setUtilitiesInput] = useState<string>("");
    const [adjustmentNotes, setAdjustmentNotes] = useState<string>("");
    const [isEstablishingBill, setIsEstablishingBill] = useState<boolean>(false);
    const [isIssuingPayment, setIsIssuingPayment] = useState<boolean>(false);
    const [invoiceMsg, setInvoiceMsg] = useState<string | null>(null);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);
    const [isMarkPaidOpen, setIsMarkPaidOpen] = useState<boolean>(false);
    const [isScheduleConfigOpen, setIsScheduleConfigOpen] = useState<boolean>(false);
    const [logsRefreshKey, setLogsRefreshKey] = useState<number>(0);

    // Payment establishment states
    const [utilityItems, setUtilityItems] = useState<UtilityItem[]>([]);
    const [dueDate, setDueDate] = useState<string>("2026-09-05");
    const [billingMonth, setBillingMonth] = useState<string>("August 2026");
    const [billSuccessMsg, setBillSuccessMsg] = useState<string | null>(null);
    const [isBillEstablished, setIsBillEstablished] = useState<boolean>(false);

    useEffect(() => {
        loadData();
        loadInvoiceData();
    }, [orgId, unitId]);

    const [unitPaymentHistory, setUnitPaymentHistory] = useState<any[]>([]);

    const loadInvoiceData = async () => {
        try {
            const [res, histRes] = await Promise.all([
                getCurrentInvoiceApi(orgId, unitId),
                getPaymentHistoryApi(orgId),
            ]);

            if (res.success && res.data) {
                setInvoiceData(res.data.invoice);
                setScheduleConfig(res.data.schedule);
                if (res.data.invoice.notes) {
                    setAdjustmentNotes(res.data.invoice.notes);
                }
                if (res.data.invoice.overrideAmount !== undefined) {
                    setUtilitiesInput(String(res.data.invoice.overrideAmount));
                }
            }

            if (histRes?.success && histRes?.history) {
                setUnitPaymentHistory(histRes.history);
            }
        } catch {
            // Silently swallow initial fetch error
        }
    };

    const handleIssuePaymentDemand = async () => {
        setIsIssuingPayment(true);
        setInvoiceMsg(null);
        setInvoiceError(null);

        try {
            const res = await issuePaymentDemandApi(orgId, unitId);
            if (res.success) {
                setInvoiceMsg("Payment demand issued immediately across WhatsApp, In-App, and Email!");
                setLogsRefreshKey((k) => k + 1);
                setTimeout(() => setInvoiceMsg(null), 5000);
            } else {
                setInvoiceError(res.message || "Failed to issue payment demand.");
            }
        } catch {
            setInvoiceError("Server error issuing payment demand.");
        } finally {
            setIsIssuingPayment(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [unitRes, groupedRes] = await Promise.all([
                getUnitByIdApi(orgId, unitId),
                getUsersGroupedByUnitApi(orgId),
            ]);

            if (unitRes.success && unitRes.data) {
                setUnit(unitRes.data);
            } else {
                setError(unitRes.message || "Failed to load unit details.");
            }

            if (groupedRes.success && groupedRes.data) {
                const unitsList = groupedRes.data.units || groupedRes.data.unitsWithOccupants || [];
                const targetUnitObj = unitsList.find((u: any) => {
                    const uId = u.unit?._id || u.unit?.id || u.unit;
                    return String(uId) === String(unitId);
                });
                setOccupants(targetUnitObj?.occupants || []);
            }
        } catch {
            setError("Error loading unit information.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUtilityItem = () => {
        setUtilityItems([
            ...utilityItems,
            { id: String(Date.now()), label: "Other Maintenance Charge", amount: 0 },
        ]);
    };

    const handleUpdateUtility = (id: string, field: "label" | "amount", value: any) => {
        setUtilityItems(
            utilityItems.map((item) =>
                item.id === id
                    ? { ...item, [field]: field === "amount" ? Number(value) || 0 : value }
                    : item
            )
        );
    };

    const handleRemoveUtility = (id: string) => {
        setUtilityItems(utilityItems.filter((item) => item.id !== id));
    };

    const handleEstablishBill = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsEstablishingBill(true);
        setBillSuccessMsg(null);
        setInvoiceError(null);

        const utVal = Number(utilitiesInput) || 0;
        const itemizedSum = utilityItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        const combinedUtilities = utVal + itemizedSum;
        const calculatedTotal = baseRentAmount + combinedUtilities;

        try {
            const res = await establishBillApi(orgId, unitId, {
                utilitiesAmount: combinedUtilities,
                totalAmount: calculatedTotal,
                notes: adjustmentNotes,
                dueDate,
                billingPeriod: billingMonth,
            });

            if (res.success) {
                setIsBillEstablished(true);
                setBillSuccessMsg(`Monthly bill of ₹${calculatedTotal.toLocaleString()} for ${billingMonth} established successfully! Multi-channel payment demand dispatched to tenant(s).`);
                setLogsRefreshKey((k) => k + 1);
                loadInvoiceData();
                setTimeout(() => setBillSuccessMsg(null), 5000);
            } else {
                setInvoiceError(res.message || "Failed to establish bill.");
            }
        } catch {
            setInvoiceError("Server error while establishing bill & issuing demand.");
        } finally {
            setIsEstablishingBill(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#64748b" }}>
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
                <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 500 }}>Loading unit details...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error || !unit) {
        return (
            <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 0" }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                >
                    ← Back to Units List
                </button>
                <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "18px 24px", borderRadius: "12px", marginTop: "16px" }}>
                    {error || "Unit not found."}
                </div>
            </div>
        );
    }

    const isOccupied = unit.status === "OCCUPIED";
    const activeOccupants = occupants.filter((o) => o.status !== "PENDING");

    const baseRentAmount = unit.rentAmount || 0;
    const utilitiesNum = Number(utilitiesInput) || 0;
    const itemizedUtilitiesAmount = utilityItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalUtilitiesAmount = utilitiesNum + itemizedUtilitiesAmount;
    const totalPayableAmount = baseRentAmount + totalUtilitiesAmount;

    // Sharing Occupancy Dynamic Equal Split Calculation
    const isSharingUnit = unit.occupancyType === "Sharing";
    const activeSharingCount = Math.max(1, activeOccupants.length);
    const individualShareAmount = isSharingUnit
        ? Math.round(totalPayableAmount / activeSharingCount)
        : totalPayableAmount;

    // Centralized Access Level Evaluation
    const accessLevel = getUnitAccessLevel({
        user,
        userRole,
        targetOrgId: orgId,
        targetUnitId: unitId,
        activeUnitId,
        occupants,
    });

    // Helper to safely render string/object values without crashing React
    const formatString = (val: any): string => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "number") return String(val);
        if (typeof val === "object") {
            if (val.name || val.phone || val.relationship) {
                const parts = [val.name, val.relationship ? `(${val.relationship})` : "", val.phone || val.mobile].filter(Boolean);
                return parts.join(" ");
            }
            return val.name || val.fullName || val.phone || JSON.stringify(val);
        }
        return String(val);
    };

    // Requirement #2: Minimal read-only card for OTHER_UNIT_RESTRICTED (no tabs, no financial details)
    if (accessLevel === "OTHER_UNIT_RESTRICTED" || accessLevel === "NO_ACCESS") {
        const primaryTenant = occupants.find((o) => o.occupancyRole === "Family Head" || o.occupancyRole === "Primary Tenant") || occupants[0];

        return (
            <div className="fade-in" style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 0" }}>
                <div style={{ marginBottom: "20px" }}>
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: "#334155",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        ← Back
                    </button>
                </div>

                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)",
                    }}
                >
                    {/* Minimal Header: Unit Name + Status Only */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                                Unit {unit.unitNumber || "101"}
                            </h2>
                            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                {unit.blockWing ? `Block/Wing: ${unit.blockWing}` : "Property Unit"}
                            </p>
                        </div>

                        <span
                            style={{
                                padding: "4px 14px",
                                borderRadius: "9999px",
                                fontSize: "0.775rem",
                                fontWeight: 800,
                                backgroundColor: isOccupied ? "#dcfce7" : "#f1f5f9",
                                color: isOccupied ? "#166534" : "#475569",
                            }}
                        >
                            {isOccupied ? "OCCUPIED" : "VACANT"}
                        </span>
                    </div>

                    {/* Minimal Body: Occupants breakdown based on occupancy type */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <span style={{ fontSize: "0.775rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                                    Occupancy Type
                                </span>
                                <span style={{ fontSize: "0.825rem", fontWeight: 700, backgroundColor: "#e2e8f0", color: "#334155", padding: "2px 10px", borderRadius: "6px" }}>
                                    {unit.occupancyType || "Family"}
                                </span>
                            </div>

                            {/* Case 1: Family Occupancy */}
                            {unit.occupancyType === "Family" && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ padding: "12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", marginBottom: "4px" }}>
                                            Primary Tenant (Head of Family)
                                        </div>
                                        {primaryTenant ? (
                                            <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                                                👤 {formatString(primaryTenant.name)} • 📞 {formatString(primaryTenant.phone) || "Not provided"}
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>No primary tenant listed.</div>
                                        )}
                                    </div>

                                    {occupants.filter((o) => o !== primaryTenant).length > 0 && (
                                        <div style={{ padding: "12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                                Family Members
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                {occupants.filter((o) => o !== primaryTenant).map((member: any, idx: number) => (
                                                    <div key={member._id || idx} style={{ fontSize: "0.875rem", color: "#334155", fontWeight: 600 }}>
                                                        👨‍👩‍👧 {formatString(member.name)} {member.occupancyRole ? `(${formatString(member.occupancyRole)})` : ""} {member.phone ? `• 📞 ${formatString(member.phone)}` : ""}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Case 2: Single Occupancy */}
                            {unit.occupancyType === "Single" && (
                                <div style={{ padding: "12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", marginBottom: "4px" }}>
                                        Resident Details
                                    </div>
                                    {occupants.length > 0 ? (
                                        <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                                            👤 {formatString(occupants[0].name)} • 📞 {formatString(occupants[0].phone) || "Not provided"}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>No resident assigned.</div>
                                    )}
                                </div>
                            )}

                            {/* Case 3: Sharing Occupancy */}
                            {unit.occupancyType === "Sharing" && (
                                <div style={{ padding: "12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", marginBottom: "8px" }}>
                                        Sharing Roommates ({occupants.length})
                                    </div>
                                    {occupants.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {occupants.map((roommate: any, idx: number) => (
                                                <div key={roommate._id || idx} style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 600 }}>
                                                    👤 {formatString(roommate.name)} • 📞 {formatString(roommate.phone) || "Not provided"}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>No sharing tenants listed.</div>
                                    )}
                                </div>
                            )}

                            {/* Fallback if occupancyType not explicitly set */}
                            {!["Family", "Single", "Sharing"].includes(unit.occupancyType || "") && (
                                <div style={{ padding: "12px", backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                    {occupants.length > 0 ? (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {occupants.map((occ: any, idx: number) => (
                                                <div key={occ._id || idx} style={{ fontSize: "0.875rem", color: "#0f172a", fontWeight: 600 }}>
                                                    👤 {formatString(occ.name)} • 📞 {formatString(occ.phone) || "Not provided"}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>No occupants listed.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Emergency Contact */}
                        <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.775rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                Emergency Contact
                            </div>
                            <div style={{ fontSize: "0.9rem", color: "#0f172a", fontWeight: 600 }}>
                                📞 {formatString(primaryTenant?.emergencyContact) || formatString(primaryTenant?.phone) || "Property Management Desk: +91 98765 43210"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
            {/* Header Navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: 0,
                    }}
                >
                    <span>←</span>
                    <span>Back to Units List</span>
                </button>

                <span
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        backgroundColor: isOwnerOrAdmin ? "#e0e7ff" : "#f1f5f9",
                        color: isOwnerOrAdmin ? "#3730a3" : "#334155",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {userRole}
                </span>
            </div>

            {/* Unit Info Card Banner */}
            <div
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "20px 24px",
                    marginBottom: "24px",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.03)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                        Unit {unit.unitNumber}
                    </h1>
                    {unit.blockWing && (
                        <span style={{ fontSize: "0.8rem", color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                            Block {unit.blockWing}
                        </span>
                    )}
                    <span
                        style={{
                            fontSize: "0.725rem",
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: "9999px",
                            backgroundColor: isOccupied ? "#e0e7ff" : "#dcfce7",
                            color: isOccupied ? "#3730a3" : "#166534",
                        }}
                    >
                        {unit.status}
                    </span>
                </div>
                <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "6px" }}>
                    Type: {unit.roomType || "Flat"} • Rent: ₹{unit.rentAmount?.toLocaleString() || 0}/mo • Floor: {unit.floor || "G"}
                </div>
            </div>

            {/* Hub Tab Bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    borderBottom: "2px solid #e2e8f0",
                    marginBottom: "24px",
                    overflowX: "auto",
                }}
            >
                {[
                    { id: "details", label: "Unit Details" },
                    { id: "tenants", label: `Tenants (${occupants.length})` },
                    { id: "payment", label: "Payment" },
                    { id: "chat", label: "Chat" },
                    { id: "invoice", label: "Invoice" },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as TabType)}
                            style={{
                                padding: "12px 20px",
                                border: "none",
                                background: "none",
                                borderBottom: isActive ? "3px solid #4f46e5" : "3px solid transparent",
                                color: isActive ? "#4f46e5" : "#64748b",
                                fontWeight: isActive ? 800 : 600,
                                fontSize: "0.925rem",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                whiteSpace: "nowrap",
                                marginBottom: "-2px",
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT PANELS */}

            {/* TAB 1: Unit Details */}
            {activeTab === "details" && (
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                            Property Specifications
                        </h3>
                        {isOwnerOrAdmin && (
                            <button
                                type="button"
                                onClick={onEditUnit}
                                style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}
                            >
                                Edit Specifications →
                            </button>
                        )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Unit Number</span>
                            <span style={specValueStyle}>{unit.unitNumber}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Block / Wing</span>
                            <span style={specValueStyle}>{unit.blockWing || "N/A"}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Floor</span>
                            <span style={specValueStyle}>{unit.floor || "G"}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Room Type</span>
                            <span style={specValueStyle}>{unit.roomType || "Flat"}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Occupancy Type</span>
                            <span style={specValueStyle}>{unit.occupancyType || "Family"}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Furnishing Status</span>
                            <span style={specValueStyle}>{unit.furnishingStatus || "Unfurnished"}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Monthly Rent</span>
                            <span style={{ ...specValueStyle, color: "#4f46e5" }}>₹{unit.rentAmount?.toLocaleString() || 0}/mo</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Security Deposit</span>
                            <span style={specValueStyle}>₹{unit.depositAmount?.toLocaleString() || 0}</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Maintenance Charge</span>
                            <span style={specValueStyle}>₹{unit.maintenanceCharge?.toLocaleString() || 0}/mo</span>
                        </div>
                        <div style={specCardStyle}>
                            <span style={specLabelStyle}>Unit Area</span>
                            <span style={specValueStyle}>{unit.areaSqFt ? `${unit.areaSqFt} sq. ft.` : "N/A"}</span>
                        </div>
                    </div>

                    {/* Amenities Section */}
                    {unit.amenities && unit.amenities.length > 0 && (
                        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                            <span style={specLabelStyle}>Amenities & Inclusions</span>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                                {unit.amenities.map((item, idx) => (
                                    <span
                                        key={idx}
                                        style={{
                                            backgroundColor: "#f8fafc",
                                            border: "1px solid #cbd5e1",
                                            color: "#334155",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            padding: "4px 12px",
                                            borderRadius: "9999px",
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes Section */}
                    {unit.notes && (
                        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                            <span style={specLabelStyle}>Notes & Instructions</span>
                            <p style={{ margin: "6px 0 0", fontSize: "0.875rem", color: "#475569", lineHeight: 1.5 }}>
                                {unit.notes}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: Tenants / Occupants */}
            {activeTab === "tenants" && (
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                                Assigned Occupants
                            </h3>
                            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                {occupants.length} occupant(s)
                            </p>
                        </div>

                        {isOwnerOrAdmin && (
                            <button
                                type="button"
                                onClick={onAddUser}
                                style={{
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "9px 18px",
                                    fontWeight: 700,
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                }}
                            >
                                + Add User to Unit
                            </button>
                        )}
                    </div>

                    {occupants.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
                            <h4 style={{ margin: "0 0 4px", color: "#0f172a" }}>No occupants assigned yet</h4>
                            <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                                {isOwnerOrAdmin
                                    ? "Click '+ Add User to Unit' above to assign family heads, tenants, or roommates to this unit."
                                    : "No occupants are currently registered for this unit workspace."}
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {occupants.map((occ: any, i: number) => (
                                <div
                                    key={occ._id || i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "14px 18px",
                                        backgroundColor: "#f8fafc",
                                        borderRadius: "10px",
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "38px",
                                                height: "38px",
                                                borderRadius: "50%",
                                                backgroundColor: "#eef2ff",
                                                color: "#4f46e5",
                                                fontWeight: 800,
                                                fontSize: "0.9rem",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {occ.name ? occ.name[0].toUpperCase() : "U"}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                                                {occ.name}
                                            </div>
                                            <div style={{ fontSize: "0.825rem", color: "#64748b", marginTop: "2px" }}>
                                                {occ.email} • {occ.phone}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 800,
                                                backgroundColor: "#e0e7ff",
                                                color: "#3730a3",
                                                padding: "4px 12px",
                                                borderRadius: "9999px",
                                            }}
                                        >
                                            {occ.occupancyRole || "Resident"}
                                        </span>
                                        {isOwnerOrAdmin && (
                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Are you sure you want to remove ${occ.name || "this user"} from Unit ${unit.unitNumber}?`)) {
                                                        const res = await removeUserFromUnitApi(orgId, unitId, occ._id || occ.email);
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
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Payment */}
            {activeTab === "payment" && (
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                >
                    {isOwnerOrAdmin ? (
                        /* OWNER VIEW: Establish Payment Demand & Maintenance Utilities */
                        <form onSubmit={handleEstablishBill}>
                            <div style={{ marginBottom: "20px" }}>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                    Establish Monthly Rent & Maintenance Bill
                                </h3>
                                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                    Set monthly rent and dynamically add maintenance charges (water, electricity, common maintenance) for Unit {unit.unitNumber}.
                                </p>
                            </div>

                            {billSuccessMsg && (
                                <div
                                    style={{
                                        backgroundColor: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        color: "#166534",
                                        padding: "12px 16px",
                                        borderRadius: "10px",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        marginBottom: "20px",
                                    }}
                                >
                                    ✓ {billSuccessMsg}
                                </div>
                            )}

                            {/* Section 1: Default Unit Rent (Read-Only) */}
                            <div
                                style={{
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "12px",
                                    padding: "16px 20px",
                                    marginBottom: "20px",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                                            Default Unit Rent (Read-Only Base Rent)
                                        </div>
                                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#4f46e5", marginTop: "2px" }}>
                                            ₹{baseRentAmount.toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onEditUnit}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#4f46e5",
                                            fontWeight: 700,
                                            fontSize: "0.825rem",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Edit in Unit Specs →
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Dynamic Utilities & Maintenance Charges (Editable Input) */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                                    Dynamic Utilities & Maintenance Charges (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Enter variable charges (e.g. water, electricity, common maintenance)"
                                    value={utilitiesInput}
                                    onChange={(e) => setUtilitiesInput(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "11px 14px",
                                        borderRadius: "10px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.95rem",
                                        fontWeight: 700,
                                        color: "#0f172a",
                                    }}
                                />
                                <span style={{ fontSize: "0.775rem", color: "#64748b", display: "block", marginTop: "4px" }}>
                                    Owner enters this fresh each cycle — varies month to month, separate from base rent.
                                </span>
                            </div>

                            {/* Itemized Charge Item Builder */}
                            <div style={{ marginBottom: "24px" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 800, color: "#334155" }}>
                                            Itemized Utility Breakdown (Optional)
                                        </h4>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddUtilityItem}
                                        style={{
                                            backgroundColor: "#f1f5f9",
                                            color: "#334155",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            padding: "6px 14px",
                                            fontWeight: 700,
                                            fontSize: "0.8rem",
                                            cursor: "pointer",
                                        }}
                                    >
                                        + Add Charge Item
                                    </button>
                                </div>

                                {utilityItems.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {utilityItems.map((item) => (
                                            <div
                                                key={item.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    backgroundColor: "#ffffff",
                                                    border: "1px solid #cbd5e1",
                                                    borderRadius: "10px",
                                                    padding: "10px 14px",
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    value={item.label}
                                                    placeholder="Charge Name (e.g. Electricity Bill)"
                                                    onChange={(e) => handleUpdateUtility(item.id, "label", e.target.value)}
                                                    style={{
                                                        flex: 2,
                                                        padding: "8px 10px",
                                                        borderRadius: "6px",
                                                        border: "1px solid #cbd5e1",
                                                        fontSize: "0.875rem",
                                                        fontWeight: 600,
                                                    }}
                                                />
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                                                    <span style={{ fontWeight: 700, color: "#64748b" }}>₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.amount || ""}
                                                        placeholder="Amount"
                                                        onChange={(e) => handleUpdateUtility(item.id, "amount", e.target.value)}
                                                        style={{
                                                            width: "100%",
                                                            padding: "8px 10px",
                                                            borderRadius: "6px",
                                                            border: "1px solid #cbd5e1",
                                                            fontSize: "0.875rem",
                                                            fontWeight: 700,
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveUtility(item.id)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#ef4444",
                                                        fontWeight: 700,
                                                        fontSize: "1rem",
                                                        cursor: "pointer",
                                                        padding: "4px 8px",
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Section 3: Billing Period & Due Date */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                                        Billing Month
                                    </label>
                                    <input
                                        type="text"
                                        value={billingMonth}
                                        onChange={(e) => setBillingMonth(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.875rem",
                                            fontWeight: 600,
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                                        Payment Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.875rem",
                                            fontWeight: 600,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Optional Adjustment Notes Field */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                                    Adjustment Notes / Details (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Includes water bill for August"
                                    value={adjustmentNotes}
                                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.875rem",
                                    }}
                                />
                            </div>

                            {/* Section 4: Total Bill Amount (Read-Only Auto-Calculated, Live Updates) */}
                            <div
                                style={{
                                    backgroundColor: "#eef2ff",
                                    border: "1px solid #c7d2fe",
                                    borderRadius: "12px",
                                    padding: "18px 24px",
                                    marginBottom: "20px",
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#334155" }}>
                                        <span>Default Unit Rent</span>
                                        <span style={{ fontWeight: 700 }}>₹{baseRentAmount.toLocaleString()}</span>
                                    </div>
                                    {totalUtilitiesAmount > 0 && (
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                                            <span>Utilities & Maintenance Charges</span>
                                            <span style={{ fontWeight: 600 }}>+ ₹{totalUtilitiesAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            paddingTop: "10px",
                                            marginTop: "6px",
                                            borderTop: "1px solid #c7d2fe",
                                            fontSize: "1.1rem",
                                            fontWeight: 800,
                                            color: "#1e1b4b",
                                        }}
                                    >
                                        <span>Total Bill Amount (Auto-Calculated)</span>
                                        <span style={{ color: "#4f46e5" }}>₹{totalPayableAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Occupants Payment Breakdown */}
                            <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                                <h4 style={{ margin: "0 0 12px", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                                    {isSharingUnit ? "Occupant Share Breakdown (Equal Split)" : "Occupant Payment Breakdown"}
                                </h4>
                                {activeOccupants.length === 0 ? (
                                    <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px", color: "#64748b", fontSize: "0.875rem" }}>
                                        No active occupants assigned to calculate individual shares.
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {activeOccupants.map((occ: any) => {
                                            const occShare = isSharingUnit ? individualShareAmount : totalPayableAmount;
                                            return (
                                                <div
                                                    key={occ._id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "14px 18px",
                                                        backgroundColor: "#f8fafc",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: "12px",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                                        <div
                                                            style={{
                                                                width: "38px",
                                                                height: "38px",
                                                                borderRadius: "50%",
                                                                backgroundColor: "#e0e7ff",
                                                                color: "#4f46e5",
                                                                fontWeight: 800,
                                                                fontSize: "0.95rem",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}
                                                        >
                                                            {occ.name ? occ.name[0].toUpperCase() : "T"}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: "0.925rem", color: "#0f172a" }}>
                                                                {occ.name}
                                                            </div>
                                                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                                                {occ.email} • {occ.occupancyRole || "Sharing"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#4f46e5" }}>
                                                            ₹{occShare.toLocaleString()}
                                                        </div>
                                                        <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                                                            {isSharingUnit ? "Personal Equal Share" : "Assigned Amount"}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isEstablishingBill}
                                style={{
                                    width: "100%",
                                    padding: "14px",
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "0.95rem",
                                    fontWeight: 800,
                                    cursor: isEstablishingBill ? "not-allowed" : "pointer",
                                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                                }}
                            >
                                {isEstablishingBill ? "Establishing Bill & Issuing Demand..." : "Establish Bill & Issue Demand"}
                            </button>
                        </form>
                    ) : (
                        /* TENANT VIEW: Active Established Bill & Equal Share Payment */
                        <div>
                            {(() => {
                                const matchingRecordInUnitDetail = unitPaymentHistory.find((p: any) => {
                                    const pUnitId = typeof p.unitId === "object" ? String((p.unitId as any)?._id || (p.unitId as any)?.id || "") : String(p.unitId || "");
                                    const cleanTargetId = String(unitId).trim();
                                    const isUnitMatch = !unitId || !pUnitId || pUnitId === cleanTargetId || pUnitId === "[object Object]";
                                    const isStatusMatch = p.paymentStatus === "PAID_APP" || p.paymentStatus === "PAID_MANUAL" || p.paymentStatus === "SUCCESS";
                                    return isUnitMatch && isStatusMatch;
                                });

                                const isPaidInUnitDetail = invoiceData?.status === "PAID" || Boolean(matchingRecordInUnitDetail);

                                return isPaidInUnitDetail ? (
                                    /* STATE 1: PAID STATE in Unit Detail */
                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                                    ✓ Rent Payment Settled
                                                </h3>
                                                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                                    Monthly rent and utilities bill for {billingMonth} has been completed.
                                                </p>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.85rem",
                                                    fontWeight: 800,
                                                    backgroundColor: "#dcfce7",
                                                    color: "#166534",
                                                    border: "1px solid #bbf7d0",
                                                    padding: "6px 16px",
                                                    borderRadius: "9999px",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                ✓ PAID
                                            </span>
                                        </div>

                                        <div
                                            style={{
                                                backgroundColor: "#f0fdf4",
                                                border: "1px solid #bbf7d0",
                                                borderRadius: "14px",
                                                padding: "20px 24px",
                                            }}
                                        >
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#334155" }}>
                                                    <span>Fixed Base Rent</span>
                                                    <span style={{ fontWeight: 700 }}>₹{baseRentAmount.toLocaleString()}</span>
                                                </div>

                                                {totalUtilitiesAmount > 0 && (
                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#334155" }}>
                                                        <span>EB & Maintenance Utilities</span>
                                                        <span style={{ fontWeight: 700, color: "#4f46e5" }}>+ ₹{totalUtilitiesAmount.toLocaleString()}</span>
                                                    </div>
                                                )}

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        paddingTop: "12px",
                                                        marginTop: "4px",
                                                        borderTop: "2px dashed #bbf7d0",
                                                        fontSize: "1.15rem",
                                                        fontWeight: 800,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    <span>Total Amount Paid</span>
                                                    <span style={{ color: "#166534" }}>₹{totalPayableAmount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #bbf7d0", fontSize: "0.825rem", color: "#15803d", display: "flex", justifyContent: "space-between" }}>
                                                <span>Payment Method: <strong>{matchingRecordInUnitDetail?.paymentStatus === "PAID_APP" || invoiceData?.paymentMode === "APP" ? "Paid via App (Razorpay)" : "Paid Manually"}</strong></span>
                                                <span>Date: <strong>{matchingRecordInUnitDetail?.paidDate ? new Date(matchingRecordInUnitDetail.paidDate).toLocaleDateString() : invoiceData?.paidAt ? new Date(invoiceData.paidAt).toLocaleDateString() : new Date().toLocaleDateString()}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* STATE 2: UNPAID STATE in Unit Detail */
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                                    Current Monthly Rent Demand
                                                </h3>
                                                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                                    Established rent and maintenance utilities breakdown for {billingMonth}.
                                                </p>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.8rem",
                                                    fontWeight: 800,
                                                    backgroundColor: isBillEstablished ? "#fef3c7" : "#dcfce7",
                                                    color: isBillEstablished ? "#92400e" : "#166534",
                                                    padding: "4px 14px",
                                                    borderRadius: "9999px",
                                                }}
                                            >
                                                {isBillEstablished ? "Payment Due" : "Up to date"}
                                            </span>
                                        </div>

                                        {isSharingUnit && (
                                            <div
                                                style={{
                                                    backgroundColor: "#eef2ff",
                                                    border: "1px solid #c7d2fe",
                                                    borderRadius: "12px",
                                                    padding: "16px 20px",
                                                    marginBottom: "20px",
                                                }}
                                            >
                                                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#3730a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                    Sharing Occupancy — Equal Split Active
                                                </div>
                                                <div style={{ fontSize: "0.875rem", color: "#334155", marginTop: "4px" }}>
                                                    Total unit bill of <strong>₹{totalPayableAmount.toLocaleString()}</strong> is split equally among <strong>{activeSharingCount} active sharing tenant(s)</strong>.
                                                </div>
                                                <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#4f46e5", marginTop: "8px" }}>
                                                    Your Equal Personal Share: ₹{individualShareAmount.toLocaleString()}
                                                </div>
                                            </div>
                                        )}

                                        <div
                                            style={{
                                                backgroundColor: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "14px",
                                                padding: "20px 24px",
                                                marginBottom: "24px",
                                            }}
                                        >
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "#334155" }}>
                                                    <span>Fixed Base Rent (Unit Total)</span>
                                                    <span style={{ fontWeight: 700 }}>₹{baseRentAmount.toLocaleString()}</span>
                                                </div>

                                                {utilityItems.map((u) => (
                                                    <div key={u.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#64748b" }}>
                                                        <span>{u.label}</span>
                                                        <span style={{ fontWeight: 600 }}>+ ₹{(u.amount || 0).toLocaleString()}</span>
                                                    </div>
                                                ))}

                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#64748b" }}>
                                                    <span>Payment Due Date</span>
                                                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{dueDate}</span>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        paddingTop: "12px",
                                                        marginTop: "6px",
                                                        borderTop: "2px dashed #cbd5e1",
                                                        fontSize: "1.15rem",
                                                        fontWeight: 800,
                                                        color: "#0f172a",
                                                    }}
                                                >
                                                    <span>{isSharingUnit ? "Your Personal Share to Pay" : "Total Payable Amount"}</span>
                                                    <span style={{ color: "#4f46e5" }}>₹{individualShareAmount.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                window.location.href = `/org/${orgId}/payment`;
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "14px",
                                                backgroundColor: "#4f46e5",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                fontSize: "0.95rem",
                                                fontWeight: 800,
                                                cursor: "pointer",
                                                boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                                            }}
                                        >
                                            Pay Your Personal Share (₹{individualShareAmount.toLocaleString()}) Now →
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                        <p style={{ margin: 0, fontSize: "0.825rem", color: "#94a3b8" }}>
                            Payment history and full workspace collection ledger can be viewed under Payments → Unit Wise.
                        </p>
                    </div>
                </div>
            )}

            {/* TAB 4: Chat */}
            {activeTab === "chat" && (
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "28px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                >
                    <div style={{ marginBottom: "20px" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                            Unit {unit.unitNumber} Chat & Messaging
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Direct communication between property management and Unit {unit.unitNumber} occupants.
                        </p>
                    </div>

                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "36px 20px", textAlign: "center" }}>
                        <h4 style={{ margin: "0 0 4px", color: "#0f172a" }}>Unit Communication Stream</h4>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                            Unit-level messaging, broadcast notices, and direct owner-tenant chat for Unit {unit.unitNumber} are active.
                        </p>
                    </div>
                </div>
            )}

            {/* TAB 5: Invoice & Payment Reminder System */}
            {activeTab === "invoice" && (
                <div>
                    {isScheduleConfigOpen ? (
                        <ReminderScheduleConfig
                            orgId={orgId}
                            unitId={unitId}
                            unitNumber={unit.unitNumber}
                            onBack={() => setIsScheduleConfigOpen(false)}
                            onSaveSuccess={() => {
                                loadInvoiceData();
                                setLogsRefreshKey((k) => k + 1);
                            }}
                        />
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {/* Invoice Header Card */}
                            <div
                                style={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "16px",
                                    padding: "24px",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                }}
                            >
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                                            Automated Invoice & Reminders — Unit {unit.unitNumber}
                                        </h3>
                                        <span
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 800,
                                                padding: "3px 10px",
                                                borderRadius: "9999px",
                                                backgroundColor:
                                                    invoiceData?.status === "PAID"
                                                        ? "#dcfce7"
                                                        : invoiceData?.status === "OVERDUE"
                                                        ? "#fee2e2"
                                                        : "#fef3c7",
                                                color:
                                                    invoiceData?.status === "PAID"
                                                        ? "#166534"
                                                        : invoiceData?.status === "OVERDUE"
                                                        ? "#991b1b"
                                                        : "#92400e",
                                            }}
                                        >
                                            {invoiceData?.status || "UNPAID"}
                                        </span>
                                    </div>
                                    <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                        Cycle: <strong>{invoiceData?.billingPeriod || "Current Month"}</strong> • Default Rent: ₹{unit.rentAmount.toLocaleString()}/mo
                                    </p>
                                </div>

                                {isOwnerOrAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setIsScheduleConfigOpen(true)}
                                        style={{
                                            backgroundColor: "#f1f5f9",
                                            color: "#4f46e5",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "10px",
                                            padding: "8px 16px",
                                            fontWeight: 700,
                                            fontSize: "0.85rem",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <span>⚙️</span>
                                        <span>Reminder Schedule Settings</span>
                                    </button>
                                )}
                            </div>

                            {invoiceMsg && (
                                <div
                                    style={{
                                        backgroundColor: "#f0fdf4",
                                        border: "1px solid #bbf7d0",
                                        color: "#166534",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontSize: "0.875rem",
                                        fontWeight: 700,
                                    }}
                                >
                                    ✓ {invoiceMsg}
                                </div>
                            )}

                            {invoiceError && (
                                <div
                                    style={{
                                        backgroundColor: "#fef2f2",
                                        border: "1px solid #fecaca",
                                        color: "#991b1b",
                                        padding: "12px 16px",
                                        borderRadius: "12px",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    ✕ {invoiceError}
                                </div>
                            )}



                            {/* Section 2: Action Toolbar (Issue Payment Demand & Mark as Paid) */}
                            {isOwnerOrAdmin && (
                                <div
                                    style={{
                                        backgroundColor: "#f8fafc",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "16px",
                                        padding: "20px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        flexWrap: "wrap",
                                        gap: "16px",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                                            Owner Dispatch & Collection Actions
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                            Issue payment demands manually anytime or record cash/online payments manually.
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                        {/* Issue Payment Action Button (Module 7) */}
                                        <button
                                            type="button"
                                            onClick={handleIssuePaymentDemand}
                                            disabled={isIssuingPayment}
                                            style={{
                                                backgroundColor: "#0284c7",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "10px 18px",
                                                fontWeight: 800,
                                                fontSize: "0.875rem",
                                                cursor: isIssuingPayment ? "not-allowed" : "pointer",
                                                boxShadow: "0 2px 6px rgba(2, 132, 199, 0.2)",
                                            }}
                                        >
                                            {isIssuingPayment ? "Issuing Demand..." : "🚀 Issue Payment Demand"}
                                        </button>

                                        {/* Mark as Paid Action Button (Module 5) */}
                                        <button
                                            type="button"
                                            onClick={() => setIsMarkPaidOpen(true)}
                                            style={{
                                                backgroundColor: "#059669",
                                                color: "#ffffff",
                                                border: "none",
                                                borderRadius: "10px",
                                                padding: "10px 18px",
                                                fontWeight: 800,
                                                fontSize: "0.875rem",
                                                cursor: "pointer",
                                                boxShadow: "0 2px 6px rgba(5, 150, 105, 0.2)",
                                            }}
                                        >
                                            💵 Mark as Paid
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Section 3: Read-Only Invoice Section Logs (Module 4) */}
                            <InvoiceLogsSection orgId={orgId} unitId={unitId} key={logsRefreshKey} />

                            {/* Mark as Paid Modal (Module 5) */}
                            <MarkPaidModal
                                orgId={orgId}
                                unitId={unitId}
                                currentAmount={invoiceData?.totalAmount || unit.rentAmount}
                                billingPeriod={invoiceData?.billingPeriod || "August 2026"}
                                isOpen={isMarkPaidOpen}
                                onClose={() => setIsMarkPaidOpen(false)}
                                onSuccess={() => {
                                    loadInvoiceData();
                                    setLogsRefreshKey((k) => k + 1);
                                    setInvoiceMsg("Invoice marked as Paid! Confirmation dispatched to tenant(s).");
                                    setTimeout(() => setInvoiceMsg(null), 5000);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const specCardStyle: React.CSSProperties = {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
};

const specLabelStyle: React.CSSProperties = {
    fontSize: "0.775rem",
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
};

const specValueStyle: React.CSSProperties = {
    fontSize: "0.95rem",
    fontWeight: 800,
    color: "#0f172a",
};

export default UnitDetailPage;
