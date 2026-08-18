import React, { useEffect, useState } from "react";
import {
    getReminderScheduleApi,
    updateReminderScheduleApi,
} from "../services/invoiceApi";

interface ReminderScheduleConfigProps {
    orgId: string;
    unitId: string;
    unitNumber?: string;
    onBack?: () => void;
    onSaveSuccess?: () => void;
}

const AVAILABLE_DAYS = [1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 28, 30];

export const ReminderScheduleConfig: React.FC<ReminderScheduleConfigProps> = ({
    orgId,
    unitId,
    unitNumber,
    onBack,
    onSaveSuccess,
}) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const [isCustom, setIsCustom] = useState<boolean>(false);
    const [primaryDays, setPrimaryDays] = useState<number[]>([1, 10, 15]);
    const [allDays, setAllDays] = useState<number[]>([10, 15]);

    useEffect(() => {
        loadSettings();
    }, [orgId, unitId]);

    const loadSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getReminderScheduleApi(orgId, unitId);
            if (res.success && res.data) {
                setIsCustom(res.data.isCustom);
                setPrimaryDays(res.data.primaryTenantDays || [1, 10, 15]);
                setAllDays(res.data.allTenantsDays || [10, 15]);
            } else {
                setError(res.message || "Failed to load schedule settings.");
            }
        } catch {
            setError("Error retrieving unit schedule config.");
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (target: "primary" | "all", day: number) => {
        if (target === "primary") {
            if (primaryDays.includes(day)) {
                if (primaryDays.length === 1) return; // Must have at least 1 day
                setPrimaryDays(primaryDays.filter((d) => d !== day));
            } else {
                setPrimaryDays([...primaryDays, day].sort((a, b) => a - b));
            }
        } else {
            if (allDays.includes(day)) {
                if (allDays.length === 1) return;
                setAllDays(allDays.filter((d) => d !== day));
            } else {
                setAllDays([...allDays, day].sort((a, b) => a - b));
            }
        }
    };

    const handleResetDefault = () => {
        setPrimaryDays([1, 10, 15]);
        setAllDays([10, 15]);
        setIsCustom(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await updateReminderScheduleApi(orgId, unitId, {
                primaryTenantDays: primaryDays,
                allTenantsDays: allDays,
            });

            if (res.success) {
                setSuccessMsg("Reminder schedule saved successfully for this unit!");
                setIsCustom(true);
                if (onSaveSuccess) onSaveSuccess();
                setTimeout(() => setSuccessMsg(null), 4000);
            } else {
                setError(res.message || "Failed to update schedule.");
            }
        } catch {
            setError("Failed to communicate with server.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b" }}>
                <div
                    style={{
                        width: "32px",
                        height: "32px",
                        border: "3px solid #cbd5e1",
                        borderTopColor: "#4f46e5",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 12px",
                    }}
                />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading schedule configuration...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "12px 0" }}>
            {/* Header Navigation */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                    gap: "12px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                padding: "6px 12px",
                                color: "#4f46e5",
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            ← Back to Unit
                        </button>
                    )}
                    <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                        Reminder Schedule Config {unitNumber ? `— Unit ${unitNumber}` : ""}
                    </h2>
                </div>

                <span
                    style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        backgroundColor: isCustom ? "#e0e7ff" : "#f1f5f9",
                        color: isCustom ? "#3730a3" : "#475569",
                        padding: "4px 12px",
                        borderRadius: "9999px",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                    }}
                >
                    {isCustom ? "Custom Schedule Active" : "Default Schedule (1/10/15 & 10/15)"}
                </span>
            </div>

            {error && (
                <div
                    style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#991b1b",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        marginBottom: "16px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                    }}
                >
                    {error}
                </div>
            )}

            {successMsg && (
                <div
                    style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#166534",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        marginBottom: "16px",
                        fontSize: "0.875rem",
                        fontWeight: 700,
                    }}
                >
                    ✓ {successMsg}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "16px",
                        padding: "24px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
                        marginBottom: "20px",
                    }}
                >
                    {/* Default Schedule Info Banner */}
                    <div
                        style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: "12px",
                            padding: "16px",
                            marginBottom: "24px",
                        }}
                    >
                        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#334155", marginBottom: "4px" }}>
                            ⚙️ Per-Unit Reminder Day Controls
                        </div>
                        <div style={{ fontSize: "0.825rem", color: "#64748b", lineHeight: 1.5 }}>
                            Select the days of the month when automated payment reminders should fire. Schedules are stored per-unit so different units can have different notification rules.
                        </div>
                    </div>

                    {/* Section A: Primary Tenant Schedule */}
                    <div style={{ marginBottom: "28px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                                    (a) Primary Tenant Reminders
                                </h3>
                                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                    Applies to Primary Tenant / Head of Family (Default: Days 1, 10, and 15)
                                </p>
                            </div>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4f46e5", backgroundColor: "#eef2ff", padding: "2px 10px", borderRadius: "6px" }}>
                                Selected: Day {primaryDays.join(", ")}
                            </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                            {AVAILABLE_DAYS.map((day) => {
                                const active = primaryDays.includes(day);
                                return (
                                    <button
                                        key={`primary-${day}`}
                                        type="button"
                                        onClick={() => toggleDay("primary", day)}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "10px",
                                            border: active ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                                            backgroundColor: active ? "#4f46e5" : "#ffffff",
                                            color: active ? "#ffffff" : "#334155",
                                            fontWeight: 800,
                                            fontSize: "0.875rem",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        Day {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section B: All Tenants Schedule */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                                    (b) All Tenants Reminders
                                </h3>
                                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                                    Applies to all occupants (Primary + Family/Sharing) (Default: Days 10 and 15)
                                </p>
                            </div>
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#059669", backgroundColor: "#ecfdf5", padding: "2px 10px", borderRadius: "6px" }}>
                                Selected: Day {allDays.join(", ")}
                            </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                            {AVAILABLE_DAYS.map((day) => {
                                const active = allDays.includes(day);
                                return (
                                    <button
                                        key={`all-${day}`}
                                        type="button"
                                        onClick={() => toggleDay("all", day)}
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "10px",
                                            border: active ? "2px solid #059669" : "1px solid #cbd5e1",
                                            backgroundColor: active ? "#059669" : "#ffffff",
                                            color: active ? "#ffffff" : "#334155",
                                            fontWeight: 800,
                                            fontSize: "0.875rem",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        Day {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Form Action Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                    <button
                        type="button"
                        onClick={handleResetDefault}
                        style={{
                            backgroundColor: "#f1f5f9",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "10px 18px",
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            cursor: "pointer",
                        }}
                    >
                        Reset to Default Schedule (1/10/15 & 10/15)
                    </button>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px 28px",
                            fontWeight: 800,
                            fontSize: "0.925rem",
                            cursor: saving ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                        }}
                    >
                        {saving ? "Saving Schedule..." : "Save Per-Unit Schedule"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReminderScheduleConfig;
