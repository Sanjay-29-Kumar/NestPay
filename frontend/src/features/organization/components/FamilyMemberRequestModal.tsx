import React, { useState } from "react";
import { createFamilyRequestApi } from "../services/familyRequestsApi";

interface FamilyMemberRequestModalProps {
    orgId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const FamilyMemberRequestModal: React.FC<FamilyMemberRequestModalProps> = ({
    orgId,
    onClose,
    onSuccess,
}) => {
    const [name, setName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [relationship, setRelationship] = useState<string>("Spouse");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !phone.trim()) {
            setError("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        setError(null);

        const res = await createFamilyRequestApi(orgId, {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            relationship,
        });

        setSubmitting(false);

        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1200);
        } else {
            setError(res.message || "Failed to submit request.");
        }
    };

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
                    maxWidth: "480px",
                    width: "100%",
                    padding: "28px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                            Request Family Member
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Submit family occupant request for workspace approval
                        </p>
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
                        }}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "16px" }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{ backgroundColor: "#f0fdf4", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "16px" }}>
                        Request submitted! Awaiting owner approval.
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Full Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Priya Sharma"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Email Address <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="e.g. priya.sharma@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Phone Number <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="e.g. +91 9876543211"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                            Relationship <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <select
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                backgroundColor: "#ffffff",
                            }}
                        >
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #cbd5e1",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "#475569",
                                cursor: "pointer",
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                backgroundColor: "#4f46e5",
                                color: "#ffffff",
                                border: "none",
                                padding: "8px 20px",
                                borderRadius: "8px",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >
                            {submitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FamilyMemberRequestModal;
