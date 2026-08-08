import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Drawer from "@/components/ui/Drawer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import {
    getOrganizationDetailsApi,
    updateOrganizationApi,
    type Organization,
} from "../services/organizationApi";
import { Link } from "react-router-dom";

export function OrganizationPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const currentOrgId = activeMembership?.organizationId?._id;

    const [orgData, setOrgData] = useState<Organization | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [successMsg, setSuccessMsg] = useState<string>("");

    // Form state
    const [formData, setFormData] = useState<Partial<Organization>>({});

    const isOwnerOrAdmin = activeMembership?.role === "OWNER" || activeMembership?.role === "ADMIN";

    useEffect(() => {
        if (currentOrgId) {
            fetchOrganizationData(currentOrgId);
        } else {
            setLoading(false);
        }
    }, [currentOrgId]);

    const fetchOrganizationData = async (orgId: string) => {
        setLoading(true);
        const res = await getOrganizationDetailsApi(orgId);
        if (res.success && res.data?.organization) {
            setOrgData(res.data.organization);
            setFormData(res.data.organization);
        }
        setLoading(false);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentOrgId) return;

        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        const res = await updateOrganizationApi(currentOrgId, formData);
        setSaving(false);

        if (res.success && res.data) {
            setOrgData(res.data);
            setSuccessMsg("Organization profile updated successfully.");
            setDrawerOpen(false);
            // Refresh memberships state if name changed
            fetchOrganizationData(currentOrgId);
        } else {
            setErrorMsg(res.message || "Failed to update organization profile.");
        }
    };

    if (!currentOrgId) {
        return (
            <MainLayout>
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Organization" }]} />
                <EmptyState
                    title="No Workspace Selected"
                    description="Please select or create an organization workspace to view its master data profile."
                    actionLabel="Select Workspace"
                    onAction={() => window.location.href = "/select-workspace"}
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Organization Profile" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Organization Master Data
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Complete enterprise profile and settings for {orgData?.name || "your organization"}.
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <Link to="/select-workspace" style={{ textDecoration: "none" }}>
                                <Button variant="outline">Switch Workspace</Button>
                            </Link>
                            {isOwnerOrAdmin && (
                                <Button variant="primary" onClick={() => setDrawerOpen(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {successMsg && (
                    <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        {successMsg}
                    </div>
                )}

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                        Loading organization profile...
                    </div>
                ) : orgData ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                        {/* Overview Card */}
                        <Card title="General Profile" subtitle="Basic identity & organization classification">
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Organization Name: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.name}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Display Name: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.displayName || "-"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Type: </span>
                                    <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, fontSize: "0.8rem" }}>
                                        {orgData.organizationType || "APARTMENT"}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Status: </span>
                                    <span style={{ color: orgData.status === "ACTIVE" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                        {orgData.status}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Your Role: </span>
                                    <strong style={{ color: "#2563eb" }}>{activeMembership?.role}</strong>
                                </div>
                                {orgData.description && (
                                    <div style={{ marginTop: "4px" }}>
                                        <span style={{ color: "#64748b", display: "block", marginBottom: "4px" }}>Description:</span>
                                        <p style={{ margin: 0, color: "#334155", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                                            {orgData.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Legal & Tax Card */}
                        <Card title="Legal & Registration" subtitle="Registration IDs and tax information">
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Registration No: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.registrationNumber || "-"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>GST / VAT ID: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.gstVat || "-"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>System Slug: </span>
                                    <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{orgData.slug}</code>
                                </div>
                            </div>
                        </Card>

                        {/* Contact Card */}
                        <Card title="Contact Details" subtitle="Communication channels for workspace">
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Official Email: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.email || "-"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Phone Number: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.phone || "-"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Website: </span>
                                    {orgData.website ? (
                                        <a href={orgData.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>
                                            {orgData.website}
                                        </a>
                                    ) : (
                                        <strong style={{ color: "#0f172a" }}>-</strong>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Address Card */}
                        <Card title="Location & Address" subtitle="Physical address details">
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Street Address: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.address || "-"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>City / State: </span>
                                    <strong style={{ color: "#0f172a" }}>
                                        {[orgData.city, orgData.state].filter(Boolean).join(", ") || "-"}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Country & Postal: </span>
                                    <strong style={{ color: "#0f172a" }}>
                                        {[orgData.country, orgData.postalCode].filter(Boolean).join(" - ") || "-"}
                                    </strong>
                                </div>
                            </div>
                        </Card>

                        {/* Preferences & Locale */}
                        <Card title="Localization & Currency" subtitle="System operational defaults">
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Currency: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.currency || "USD"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Timezone: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.timezone || "UTC"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Language: </span>
                                    <strong style={{ color: "#0f172a" }}>{orgData.language || "en"}</strong>
                                </div>
                            </div>
                        </Card>
                    </div>
                ) : null}

                {/* Edit Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title="Edit Organization Profile"
                    subtitle="Update master profile information for your workspace."
                >
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {errorMsg && (
                            <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "0.85rem" }}>
                                {errorMsg}
                            </div>
                        )}

                        <Input
                            label="Organization Name *"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleFormChange}
                            required
                        />

                        <Input
                            label="Display Name"
                            name="displayName"
                            value={formData.displayName || ""}
                            onChange={handleFormChange}
                            placeholder="Public display name"
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Organization Type
                            </label>
                            <select
                                name="organizationType"
                                value={formData.organizationType || "APARTMENT"}
                                onChange={handleFormChange}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem",
                                }}
                            >
                                <option value="APARTMENT">Apartment / Residential Building</option>
                                <option value="RENTAL_PROPERTY">Rental Property Portfolio</option>
                                <option value="BUSINESS">Commercial Business</option>
                                <option value="SCHOOL">School / Educational Inst.</option>
                                <option value="COMMUNITY">Gated Community / HOA</option>
                                <option value="SMALL_ORGANIZATION">Small Organization</option>
                                <option value="SERVICE_PROVIDER">Service Provider</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description || ""}
                                onChange={handleFormChange}
                                rows={3}
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem",
                                    resize: "vertical",
                                }}
                                placeholder="Short overview of the organization"
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Registration Number"
                                name="registrationNumber"
                                value={formData.registrationNumber || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="GST / VAT ID"
                                name="gstVat"
                                value={formData.gstVat || ""}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Official Email"
                                name="email"
                                type="email"
                                value={formData.email || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Phone Number"
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleFormChange}
                            />
                        </div>

                        <Input
                            label="Website URL"
                            name="website"
                            value={formData.website || ""}
                            onChange={handleFormChange}
                            placeholder="https://example.com"
                        />

                        <Input
                            label="Address"
                            name="address"
                            value={formData.address || ""}
                            onChange={handleFormChange}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="City"
                                name="city"
                                value={formData.city || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="State / Province"
                                name="state"
                                value={formData.state || ""}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Country"
                                name="country"
                                value={formData.country || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Postal Code"
                                name="postalCode"
                                value={formData.postalCode || ""}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                    Default Currency
                                </label>
                                <select
                                    name="currency"
                                    value={formData.currency || "USD"}
                                    onChange={handleFormChange}
                                    style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                                >
                                    <option value="USD">USD ($ - US Dollar)</option>
                                    <option value="INR">INR (₹ - Indian Rupee)</option>
                                    <option value="EUR">EUR (€ - Euro)</option>
                                    <option value="GBP">GBP (£ - British Pound)</option>
                                    <option value="AED">AED (AED - UAE Dirham)</option>
                                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                                    <option value="AUD">AUD ($ - Australian Dollar)</option>
                                    <option value="SGD">SGD ($ - Singapore Dollar)</option>
                                    <option value="JPY">JPY (¥ - Japanese Yen)</option>
                                </select>
                            </div>
                            <Input
                                label="Timezone"
                                name="timezone"
                                value={formData.timezone || "UTC"}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Language"
                                name="language"
                                value={formData.language || "en"}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a" }}>Tenant Privacy Settings</h4>
                            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "#334155", cursor: "pointer" }}>
                                <input
                                    type="checkbox"
                                    name="allowTenantRoommateVisibility"
                                    checked={formData.allowTenantRoommateVisibility ?? true}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, allowTenantRoommateVisibility: e.target.checked }))}
                                />
                                <span>Allow tenants to see co-residents / roommates in their assigned unit & property</span>
                            </label>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default OrganizationPage;
