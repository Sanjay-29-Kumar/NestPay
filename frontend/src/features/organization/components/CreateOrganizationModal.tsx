import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createOrganizationApi } from "../services/organizationApi";
import type { Membership } from "../types/organization.types";

interface CreateOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (newMembership: Membership) => void;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
    isOpen,
    onClose,
    onCreated,
}) => {
    const [name, setName] = useState("");
    const [organizationType, setOrganizationType] = useState("APARTMENT");
    const [currency, setCurrency] = useState("USD");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Organization name is required");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const res = await createOrganizationApi({
                name: name.trim(),
                organizationType,
                currency,
                description: description.trim(),
            });

            if (res.success && res.data) {
                const fullMembership: Membership = {
                    ...res.data.membership,
                    organizationId: res.data.organization,
                };
                onCreated(fullMembership);
                setName("");
                setDescription("");
                onClose();
            } else {
                setError(res.message || "Failed to create organization");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(4px)",
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "16px",
                    width: "100%",
                    maxWidth: "520px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f8fafc",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
                            Create Property Organization
                        </h3>
                        <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Setup a new workspace for managing properties and payments.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.5rem",
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "6px",
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
                    {error && (
                        <div
                            style={{
                                backgroundColor: "#fef2f2",
                                color: "#dc2626",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                fontSize: "0.875rem",
                                marginBottom: "16px",
                                border: "1px solid #fecaca",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: "16px" }}>
                        <Input
                            label="Organization Name *"
                            placeholder="e.g. Sunset Heights Apartments"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                                Property Type
                            </label>
                            <select
                                value={organizationType}
                                onChange={(e) => setOrganizationType(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.95rem",
                                    backgroundColor: "#ffffff",
                                    color: "#0f172a",
                                    outline: "none",
                                }}
                            >
                                <option value="APARTMENT">Apartment Complex</option>
                                <option value="RENTAL_PROPERTY">Rental Property</option>
                                <option value="BUSINESS">Commercial Business</option>
                                <option value="COMMUNITY">Housing Society / Community</option>
                                <option value="SCHOOL">School / Educational</option>
                                <option value="SERVICE_PROVIDER">Service Provider</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                                Currency
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.95rem",
                                    backgroundColor: "#ffffff",
                                    color: "#0f172a",
                                    outline: "none",
                                }}
                            >
                                <option value="USD">USD ($)</option>
                                <option value="INR">INR (₹)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="CAD">CAD ($)</option>
                                <option value="AUD">AUD ($)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                            Description (Optional)
                        </label>
                        <textarea
                            placeholder="Brief description of your organization or property group..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.95rem",
                                fontFamily: "inherit",
                                color: "#0f172a",
                                outline: "none",
                                resize: "vertical",
                            }}
                        />
                    </div>

                    {/* Modal Footer */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isLoading}>
                            Create Workspace
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrganizationModal;
