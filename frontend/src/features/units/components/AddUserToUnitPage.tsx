import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getUnitByIdApi, addUserToUnitApi, type UnitData } from "../services/unitsApi";
import { createFamilyRequestApi } from "@/features/organization/services/familyRequestsApi";

interface AddUserToUnitPageProps {
    orgId: string;
    unitId: string;
    onBack: () => void;
}

export const AddUserToUnitPage: React.FC<AddUserToUnitPageProps> = ({ orgId, unitId, onBack }) => {
    const { memberships } = useSelector((state: RootState) => state.organization);
    const activeMembership = memberships.find((m) => {
        const org = typeof m.organizationId === "object" ? m.organizationId : null;
        return org?._id === orgId;
    });
    const currentRole = activeMembership?.role || "MEMBER";
    const isOwnerOrAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(currentRole);

    const [unit, setUnit] = useState<UnitData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [addedCount, setAddedCount] = useState<number>(0);

    // Form states
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [occupancyType, setOccupancyType] = useState<"Single" | "Family Head" | "Sharing">("Single");
    const [relationship, setRelationship] = useState<string>("Spouse");

    useEffect(() => {
        loadUnit();
    }, [orgId, unitId]);

    const loadUnit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getUnitByIdApi(orgId, unitId);
            if (res.success && res.data) {
                setUnit(res.data);
                // Default occupancy type based on unit occupancyType & sharing settings
                if (res.data.occupancyType === "Family") {
                    setOccupancyType("Family Head");
                } else if (res.data.occupancyType === "Sharing" || (res.data.sharingType && res.data.sharingType !== "PRIVATE")) {
                    setOccupancyType("Sharing");
                } else {
                    setOccupancyType("Single");
                }
            } else {
                setError(res.message || "Failed to load unit details.");
            }
        } catch {
            setError("Error loading unit.");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !phone.trim()) {
            setError("Please fill in all required fields (Name, Email, Phone).");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (!isOwnerOrAdmin) {
                // Tenant flow: submit family member request for owner approval
                const res = await createFamilyRequestApi(orgId, {
                    unitId,
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    relationship,
                });

                if (res.success) {
                    setSuccessMsg("Family member request submitted successfully! Workspace management has been notified for approval.");
                    setName("");
                    setEmail("");
                    setPhone("");
                } else {
                    setError(res.message || "Failed to submit request.");
                }
            } else {
                // Owner/Admin flow: direct user assignment
                const res = await addUserToUnitApi(orgId, unitId, {
                    name: name.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    occupancyType,
                });

                if (res.success) {
                    const newCount = addedCount + 1;
                    setAddedCount(newCount);

                    if (occupancyType === "Sharing") {
                        setSuccessMsg(`Added ${name} successfully! You can add another occupant or click 'Done Adding'.`);
                        setName("");
                        setEmail("");
                        setPhone("");
                    } else {
                        setSuccessMsg(res.message || `Successfully added ${name} to Unit ${unit?.unitNumber || ""}. Redirecting...`);
                        setTimeout(() => {
                            onBack();
                        }, 1200);
                    }
                } else {
                    setError(res.message || "Failed to add user to unit.");
                }
            }
        } catch {
            setError("Error submitting request.");
        } finally {
            setSubmitting(false);
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
                <p style={{ margin: 0, fontSize: "0.925rem", fontWeight: 500 }}>Loading unit context...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ maxWidth: "680px", margin: "0 auto" }}>
            {/* Navigation & Header */}
            <div style={{ marginBottom: "24px" }}>
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: 0,
                        marginBottom: "12px",
                    }}
                >
                    ← Back to Units List
                </button>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                            {isOwnerOrAdmin ? `Add User to Unit ${unit?.unitNumber || ""}` : `Request Family Member — Unit ${unit?.unitNumber || ""}`}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#64748b" }}>
                            {isOwnerOrAdmin ? "Assign a tenant or family head to this property space." : "Submit family occupant details for workspace owner approval."}
                        </p>
                    </div>

                    {isOwnerOrAdmin && occupancyType === "Sharing" && (
                        <button
                            type="button"
                            onClick={onBack}
                            style={{
                                backgroundColor: "#10b981",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                padding: "8px 18px",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                boxShadow: "0 2px 6px rgba(16, 185, 129, 0.25)",
                            }}
                        >
                            Done Adding ({addedCount} added)
                        </button>
                    )}
                </div>
            </div>

            {/* Context Badge */}
            {unit && (
                <div
                    style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "14px 18px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
                            Unit {unit.unitNumber} {unit.blockWing ? `(${unit.blockWing})` : ""}
                        </div>
                        <div style={{ fontSize: "0.825rem", color: "#64748b", marginTop: "2px" }}>
                            Type: {unit.roomType || "Flat"} • Rent: ₹{unit.rentAmount?.toLocaleString() || 0}/mo •{" "}
                            {unit.occupancyType === "Family"
                                ? unit.maxCapacity && unit.maxCapacity > 1
                                    ? `Max Capacity: ${unit.maxCapacity}`
                                    : "Occupancy: Family Space"
                                : unit.occupancyType === "Sharing"
                                ? `Max Capacity: ${unit.maxCapacity || 1} occupants`
                                : "Max Capacity: 1 (Single Occupant)"}
                        </div>
                    </div>
                </div>
            )}

            {/* Error / Success Notifications */}
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
                    {error}
                </div>
            )}

            {successMsg && (
                <div
                    style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        color: "#166534",
                        fontSize: "0.9rem",
                        marginBottom: "20px",
                    }}
                >
                    ✅ {successMsg}
                </div>
            )}

            {/* Form Container */}
            <form
                onSubmit={handleSubmit}
                style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    padding: "28px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Full Name */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Full Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Rahul Sharma"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.925rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Email Address <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="e.g. rahul.sharma@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.925rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                            Phone Number <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="e.g. +91 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.925rem",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* Conditional Field based on Role */}
                    {isOwnerOrAdmin ? (
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                Occupancy Type <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <select
                                value={occupancyType}
                                onChange={(e) => setOccupancyType(e.target.value as any)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.925rem",
                                    outline: "none",
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <option value="Single">Single Occupant</option>
                                <option value="Family Head">Family Head (Family Unit)</option>
                                <option value="Sharing">Sharing Occupant</option>
                            </select>
                            <div style={{ fontSize: "0.785rem", color: "#64748b", marginTop: "6px", lineHeight: 1.4 }}>
                                {occupancyType === "Single" && "ℹ️ Single occupant renting the entire unit alone."}
                                {occupancyType === "Family Head" && "ℹ️ Primary family head. Additional family members can be invited by the head later once logged in."}
                                {occupancyType === "Sharing" && "ℹ️ Sharing tenant. You can submit and continue adding other sharing roommates."}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                                Relationship <span style={{ color: "#ef4444" }}>*</span>
                            </label>
                            <select
                                value={relationship}
                                onChange={(e) => setRelationship(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.925rem",
                                    outline: "none",
                                    backgroundColor: "#ffffff",
                                }}
                            >
                                <option value="Spouse">Spouse</option>
                                <option value="Child">Child</option>
                                <option value="Parent">Parent</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Other">Other</option>
                            </select>
                            <div style={{ fontSize: "0.785rem", color: "#64748b", marginTop: "6px" }}>
                                ℹ️ Submitting this request sends an in-app notification to the workspace owner for review and approval.
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                        <button
                            type="button"
                            onClick={onBack}
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
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                border: "none",
                                padding: "10px 24px",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.7 : 1,
                                boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                            }}
                        >
                            {submitting
                                ? "Submitting..."
                                : isOwnerOrAdmin
                                ? occupancyType === "Sharing"
                                    ? "+ Add Occupant"
                                    : "Assign User"
                                : "Submit Request"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddUserToUnitPage;
