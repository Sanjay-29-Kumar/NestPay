import React, { useState } from "react";
import { createUnitApi } from "../services/unitsApi";

interface AddUnitPageProps {
    orgId: string;
    onCancel: () => void;
    onCreated: (unitId: string) => void;
}

const ROOM_TYPE_OPTIONS = ["1BHK", "1RK", "2BHK", "3BHK", "4BHK", "Studio", "Villa", "Shop", "Office", "Other"];

export const AddUnitPage: React.FC<AddUnitPageProps> = ({ orgId, onCancel, onCreated }) => {
    const [unitNumber, setUnitNumber] = useState<string>("");
    const [blockWing, setBlockWing] = useState<string>("");
    const [floor, setFloor] = useState<string>("");
    const [roomType, setRoomType] = useState<string>("1BHK");
    const [customRoomType, setCustomRoomType] = useState<string>("");

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitNumber.trim()) {
            setError("Unit Name / Number is required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const finalRoomType = roomType === "Other" ? (customRoomType.trim() || "Custom") : roomType;

        try {
            const res = await createUnitApi(orgId, {
                unitNumber: unitNumber.trim(),
                blockWing: blockWing.trim(),
                floor: floor.trim(),
                roomType: finalRoomType,
                status: "VACANT",
            });

            if (res.success && res.data) {
                onCreated(res.data._id);
            } else {
                setError(res.message || "Failed to create unit.");
            }
        } catch {
            setError("An error occurred while creating the unit.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: "680px", margin: "0 auto" }}>
            {/* Header & Back Button */}
            <div style={{ marginBottom: "24px" }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: 0,
                        marginBottom: "12px",
                    }}
                >
                    <span>←</span>
                    <span>Cancel & Back to Units</span>
                </button>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                    Add New Unit
                </h2>
                <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "4px 0 0" }}>
                    Create a new unit space in your organization. Occupancy status will default to Vacant.
                </p>
            </div>

            {/* Error Banner */}
            {error && (
                <div
                    style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        color: "#991b1b",
                        fontSize: "0.9rem",
                        marginBottom: "20px",
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Creation Form Card */}
            <form
                onSubmit={handleSubmit}
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}
            >
                {/* 1. Unit Name/Number (Required) */}
                <div>
                    <label style={labelStyle}>
                        Unit Name / Number <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Unit 101, Flat A-204, Room 3B"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                {/* 2. Block/Wing & Floor Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                        <label style={labelStyle}>
                            Block / Wing <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Block A, East Wing"
                            value={blockWing}
                            onChange={(e) => setBlockWing(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Floor <span style={{ color: "#94a3b8", fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. 1st Floor, Ground Floor"
                            value={floor}
                            onChange={(e) => setFloor(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                </div>

                {/* 3. Room Type Dropdown */}
                <div>
                    <label style={labelStyle}>Room Type</label>
                    <select
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        style={inputStyle}
                    >
                        {ROOM_TYPE_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>

                {/* If "Other" selected: Free-text input for custom room type */}
                {roomType === "Other" && (
                    <div className="fade-in">
                        <label style={labelStyle}>
                            Custom Room Type <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Penthouse, Duplex, Bed Space, Storage"
                            value={customRoomType}
                            onChange={(e) => setCustomRoomType(e.target.value)}
                            required={roomType === "Other"}
                            style={inputStyle}
                        />
                    </div>
                )}

                {/* Form Actions (Submit & Cancel) */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "12px",
                        paddingTop: "16px",
                        borderTop: "1px solid #f1f5f9",
                    }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "10px 20px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "#475569",
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "10px 24px",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            cursor: isSubmitting ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 12px 0 rgba(79, 70, 229, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                    >
                        {isSubmitting ? "Creating Unit..." : "Create Unit"}
                    </button>
                </div>
            </form>
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "0.925rem",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
};

export default AddUnitPage;
