import React, { useEffect, useState } from "react";
import { getUnitByIdApi, updateUnitApi, type UnitData } from "../services/unitsApi";

interface EditUnitPageProps {
    orgId: string;
    unitId: string;
    onBack: () => void;
}

const ROOM_TYPE_OPTIONS = ["1BHK", "1RK", "2BHK", "3BHK", "4BHK", "Studio", "Villa", "Shop", "Office", "Other"];
const OCCUPANCY_OPTIONS = ["Family", "Single", "Sharing"];
const FURNISHING_OPTIONS = ["Unfurnished", "Semi-Furnished", "Fully Furnished"];

export const EditUnitPage: React.FC<EditUnitPageProps> = ({ orgId, unitId, onBack }) => {
    const [unit, setUnit] = useState<UnitData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);

    // Form fields
    const [unitNumber, setUnitNumber] = useState<string>("");
    const [blockWing, setBlockWing] = useState<string>("");
    const [floor, setFloor] = useState<string>("");
    const [roomType, setRoomType] = useState<string>("1BHK");
    const [customRoomType, setCustomRoomType] = useState<string>("");
    const [occupancyType, setOccupancyType] = useState<string>("Family");
    const [rentAmount, setRentAmount] = useState<string>("");
    const [depositAmount, setDepositAmount] = useState<string>("");
    const [maintenanceCharge, setMaintenanceCharge] = useState<string>("");
    const [furnishingStatus, setFurnishingStatus] = useState<string>("Unfurnished");
    const [areaSqFt, setAreaSqFt] = useState<string>("");
    const [amenities, setAmenities] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    useEffect(() => {
        loadUnitDetails();
    }, [orgId, unitId]);

    const loadUnitDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUnitByIdApi(orgId, unitId);
            if (res.success && res.data) {
                const u = res.data;
                setUnit(u);
                setUnitNumber(u.unitNumber || "");
                setBlockWing(u.blockWing || "");
                setFloor(u.floor || "");

                // Room Type handling
                const rType = u.roomType || "1BHK";
                if (ROOM_TYPE_OPTIONS.includes(rType)) {
                    setRoomType(rType);
                    setCustomRoomType("");
                } else {
                    setRoomType("Other");
                    setCustomRoomType(rType);
                }

                setOccupancyType(u.occupancyType || "Family");
                setRentAmount(u.rentAmount ? String(u.rentAmount) : "");
                setDepositAmount(u.depositAmount ? String(u.depositAmount) : "");
                setMaintenanceCharge(u.maintenanceCharge ? String(u.maintenanceCharge) : "");
                setFurnishingStatus(u.furnishingStatus || "Unfurnished");
                setAreaSqFt(u.areaSqFt ? String(u.areaSqFt) : "");
                setAmenities(u.amenities ? u.amenities.join(", ") : "");
                setNotes(u.notes || "");
            } else {
                setError(res.message || "Unit details not found.");
            }
        } catch {
            setError("Failed loading unit details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!unitNumber.trim()) {
            setError("Unit Name / Number cannot be empty.");
            return;
        }

        if (unit?.occupancyType === "Family" && occupancyType !== "Family") {
            const confirmed = window.confirm(
                "This unit is currently set to Family. Changing occupancy type away from Family will demote tenant access and update family member permissions. Do you want to proceed?"
            );
            if (!confirmed) {
                return;
            }
        }

        setIsSaving(true);
        setError(null);
        setSaveSuccess(false);

        const finalRoomType = roomType === "Other" ? (customRoomType.trim() || "Custom") : roomType;
        const parsedAmenities = amenities
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const payload: Partial<UnitData> = {
            unitNumber: unitNumber.trim(),
            blockWing: blockWing.trim(),
            floor: floor.trim(),
            roomType: finalRoomType,
            occupancyType,
            rentAmount: rentAmount ? parseFloat(rentAmount) : 0,
            depositAmount: depositAmount ? parseFloat(depositAmount) : 0,
            maintenanceCharge: maintenanceCharge ? parseFloat(maintenanceCharge) : 0,
            furnishingStatus,
            areaSqFt: areaSqFt ? parseFloat(areaSqFt) : 0,
            amenities: parsedAmenities,
            notes: notes.trim(),
        };

        try {
            const res = await updateUnitApi(orgId, unitId, payload);
            if (res.success && res.data) {
                setUnit(res.data);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
            } else {
                setError(res.message || "Failed to update unit.");
            }
        } catch {
            setError("Error saving unit changes.");
        } finally {
            setIsSaving(false);
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
                <p style={{ margin: 0, fontSize: "0.925rem", fontWeight: 500 }}>Loading unit details...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error && !unit) {
        return (
            <div style={{ maxWidth: "680px", margin: "0 auto" }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}
                >
                    ← Back to Units List
                </button>
                <div style={{ backgroundColor: "#fef2f2", padding: "20px", borderRadius: "12px", marginTop: "16px", color: "#991b1b" }}>
                    ⚠️ {error}
                </div>
            </div>
        );
    }

    const isOccupied = unit?.status === "OCCUPIED";

    return (
        <div className="fade-in" style={{ maxWidth: "780px", margin: "0 auto" }}>
            {/* Header section with Back Button & Status Badge */}
            <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <button
                        type="button"
                        onClick={onBack}
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
                            marginBottom: "8px",
                        }}
                    >
                        <span>←</span>
                        <span>Back to Units</span>
                    </button>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                        Edit Unit: {unit?.unitNumber}
                    </h2>
                    <p style={{ fontSize: "0.9rem", color: "#64748b", margin: "4px 0 0" }}>
                        Update unit details, rent structure, amenities, and room parameters.
                    </p>
                </div>

                {/* Read-Only Status Indicator */}
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>
                        Occupancy Status
                    </div>
                    <span
                        style={{
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            padding: "5px 14px",
                            borderRadius: "9999px",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            backgroundColor: isOccupied ? "#e0e7ff" : "#dcfce7",
                            color: isOccupied ? "#3730a3" : "#166534",
                            border: isOccupied ? "1px solid #c7d2fe" : "1px solid #bbf7d0",
                        }}
                    >
                        {isOccupied ? "OCCUPIED" : "VACANT"}
                    </span>
                    <div style={{ fontSize: "0.725rem", color: "#94a3b8", marginTop: "4px" }}>
                        (Status updates automatically on tenant assignment)
                    </div>
                </div>
            </div>

            {/* Notification Banners */}
            {saveSuccess && (
                <div
                    style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        color: "#166534",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: "20px",
                    }}
                >
                    Unit updated successfully!
                </div>
            )}
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

            {/* Main Edit Form Container */}
            <form
                onSubmit={handleSave}
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "32px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "28px",
                }}
            >
                {/* SECTION 1: Basic Unit Parameters */}
                <div>
                    <h3 style={sectionHeadingStyle}>1. Basic Information</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>
                                Unit Name / Number <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={unitNumber}
                                onChange={(e) => setUnitNumber(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Block / Wing</label>
                            <input
                                type="text"
                                placeholder="e.g. Block B"
                                value={blockWing}
                                onChange={(e) => setBlockWing(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Floor</label>
                            <input
                                type="text"
                                placeholder="e.g. 2nd Floor"
                                value={floor}
                                onChange={(e) => setFloor(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
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
                    </div>

                    {roomType === "Other" && (
                        <div style={{ marginTop: "14px" }}>
                            <label style={labelStyle}>Custom Room Type</label>
                            <input
                                type="text"
                                value={customRoomType}
                                onChange={(e) => setCustomRoomType(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    )}
                </div>

                {/* SECTION 2: Financial & Rental Details */}
                <div style={{ paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                    <h3 style={sectionHeadingStyle}>2. Rent & Billing Structure</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Monthly Rent Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={rentAmount}
                                onChange={(e) => setRentAmount(e.target.value)}
                                min="0"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Security Deposit (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                min="0"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Maintenance Charge (₹)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={maintenanceCharge}
                                onChange={(e) => setMaintenanceCharge(e.target.value)}
                                min="0"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Additional Specifications (Deferred Stubbed Section) */}
                <div style={{ paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                    <h3 style={sectionHeadingStyle}>3. Specifications & Amenities</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div>
                            <label style={labelStyle}>Occupancy Type</label>
                            <select
                                value={occupancyType}
                                onChange={(e) => setOccupancyType(e.target.value)}
                                style={inputStyle}
                            >
                                {OCCUPANCY_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Furnishing Status</label>
                            <select
                                value={furnishingStatus}
                                onChange={(e) => setFurnishingStatus(e.target.value)}
                                style={inputStyle}
                            >
                                {FURNISHING_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Unit Size (sq. ft.)</label>
                            <input
                                type="number"
                                placeholder="e.g. 850"
                                value={areaSqFt}
                                onChange={(e) => setAreaSqFt(e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <label style={labelStyle}>Amenities (comma separated)</label>
                        <input
                            type="text"
                            placeholder="e.g. WiFi, Parking, Air Conditioner, Balcony, Power Backup"
                            value={amenities}
                            onChange={(e) => setAmenities(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ marginTop: "16px" }}>
                        <label style={labelStyle}>Notes & Internal Remarks</label>
                        <textarea
                            rows={3}
                            placeholder="Add internal notes about this unit..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
                        />
                    </div>
                </div>

                {/* Form Actions */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: "20px",
                        borderTop: "1px solid #f1f5f9",
                    }}
                >
                    <button
                        type="button"
                        onClick={onBack}
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "10px",
                            padding: "10px 20px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "#475569",
                            cursor: "pointer",
                        }}
                    >
                        ← Back to List
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "10px 28px",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            cursor: isSaving ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 12px 0 rgba(79, 70, 229, 0.3)",
                            opacity: isSaving ? 0.7 : 1,
                        }}
                    >
                        {isSaving ? "Saving Changes..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
};

const sectionHeadingStyle: React.CSSProperties = {
    fontSize: "1.05rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: "0 0 16px",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#334155",
    marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "0.9rem",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
};

export default EditUnitPage;
