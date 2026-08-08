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
    getPropertiesApi,
    createPropertyApi,
    updatePropertyApi,
    deletePropertyApi,
    type PropertyItem,
    type PropertyStats,
} from "../services/propertiesApi";

export function PropertiesPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const currentUserRole = activeMembership?.role;
    const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

    const [properties, setProperties] = useState<PropertyItem[]>([]);
    const [stats, setStats] = useState<PropertyStats>({ totalCount: 0, activeCount: 0, maintenanceCount: 0 });
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [editingProperty, setEditingProperty] = useState<PropertyItem | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [formData, setFormData] = useState<Partial<PropertyItem>>({
        name: "",
        code: "",
        propertyType: "APARTMENT",
        description: "",
        address: { street: "", city: "", state: "", country: "", postalCode: "" },
        status: "ACTIVE",
    });

    useEffect(() => {
        if (orgId) {
            fetchProperties();
        } else {
            setLoading(false);
        }
    }, [orgId, typeFilter, statusFilter]);

    const fetchProperties = async () => {
        if (!orgId) return;
        setLoading(true);
        const res = await getPropertiesApi(orgId, searchQuery, typeFilter, statusFilter);
        if (res.success && res.data) {
            setProperties(res.data.properties);
            if (res.data.stats) setStats(res.data.stats);
        }
        setLoading(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchProperties();
    };

    const handleOpenAdd = () => {
        setEditingProperty(null);
        setFormData({
            name: "",
            code: "",
            propertyType: "APARTMENT",
            description: "",
            address: { street: "", city: "", state: "", country: "", postalCode: "" },
            status: "ACTIVE",
        });
        setDrawerOpen(true);
    };

    const handleOpenEdit = (prop: PropertyItem) => {
        setEditingProperty(prop);
        setFormData({
            name: prop.name,
            code: prop.code,
            propertyType: prop.propertyType,
            description: prop.description || "",
            address: prop.address || { street: "", city: "", state: "", country: "", postalCode: "" },
            status: prop.status,
        });
        setDrawerOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith("address.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                address: {
                    ...(prev.address || {}),
                    [field]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        setSaving(true);
        setFeedback(null);

        let res;
        if (editingProperty) {
            res = await updatePropertyApi(orgId, editingProperty._id, formData);
        } else {
            res = await createPropertyApi(orgId, formData);
        }
        setSaving(false);

        if (res.success) {
            setFeedback({ type: "success", message: editingProperty ? "Property updated." : "Property created." });
            setDrawerOpen(false);
            fetchProperties();
        } else {
            setFeedback({ type: "error", message: res.message || "Operation failed." });
        }
    };

    const handleDelete = async (propId: string) => {
        if (!orgId) return;
        if (!window.confirm("Are you sure you want to delete this property?")) return;

        const res = await deletePropertyApi(orgId, propId);
        if (res.success) {
            setFeedback({ type: "success", message: "Property deleted." });
            fetchProperties();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to delete property." });
        }
    };

    if (!orgId) {
        return (
            <MainLayout>
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Properties" }]} />
                <EmptyState
                    title="No Active Workspace"
                    description="Please select an organization workspace to manage properties."
                    actionLabel="Select Workspace"
                    onAction={() => (window.location.href = "/select-workspace")}
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Properties" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Properties Portfolio
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Manage real estate assets, buildings, villas, commercial units, and land properties.
                            </p>
                        </div>
                        {canManage && (
                            <Button variant="primary" onClick={handleOpenAdd}>
                                + Add Property
                            </Button>
                        )}
                    </div>
                </div>

                {feedback && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                            color: feedback.type === "success" ? "#166534" : "#991b1b",
                            border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                    >
                        {feedback.message}
                    </div>
                )}

                {/* Metrics Banner */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Total Properties</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{stats.totalCount}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>Active Properties</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>{stats.activeCount}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: 600 }}>Under Maintenance</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>{stats.maintenanceCount}</div>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                        <input
                            type="text"
                            placeholder="Search by name, code, or city..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                flex: 1,
                                minWidth: "220px",
                            }}
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                        >
                            <option value="">All Property Types</option>
                            <option value="APARTMENT">Apartment</option>
                            <option value="BUILDING">Building Complex</option>
                            <option value="LINE_HOUSE">Line House / Row Houses</option>
                            <option value="ROW_HOUSE">Row House</option>
                            <option value="CHAWL">Chawl / Tenement</option>
                            <option value="PG_HOSTEL">PG / Hostel</option>
                            <option value="CO_LIVING">Co-Living Space</option>
                            <option value="VILLA">Villa / Bungalow</option>
                            <option value="HOUSE">Independent House</option>
                            <option value="COMMERCIAL">Commercial Building</option>
                            <option value="OFFICE">Office Premises</option>
                            <option value="WAREHOUSE">Warehouse</option>
                            <option value="LAND">Land / Plot</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                        </select>
                        <Button variant="outline" type="submit">
                            Filter
                        </Button>
                    </form>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading properties...</div>
                ) : properties.length === 0 ? (
                    <EmptyState
                        title="No Properties Found"
                        description="Start by adding your first property or reset your search filters."
                        actionLabel={canManage ? "+ Add First Property" : undefined}
                        onAction={canManage ? handleOpenAdd : undefined}
                    />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                        {properties.map((prop) => {
                            const bannerImage = prop.images && prop.images.length > 0 ? prop.images[0] : null;
                            return (
                                <Card key={prop._id}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {bannerImage && (
                                            <div style={{ width: "100%", height: "140px", borderRadius: "8px", overflow: "hidden", marginBottom: "4px" }}>
                                                <img src={bannerImage} alt={prop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            </div>
                                        )}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div>
                                                <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                                                    {prop.propertyType}
                                                </span>
                                                <h3 style={{ margin: "6px 0 0 0", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                                                    {prop.name}
                                                </h3>
                                                <code style={{ fontSize: "0.8rem", color: "#64748b" }}>CODE: {prop.code}</code>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    backgroundColor: prop.status === "ACTIVE" ? "#f0fdf4" : prop.status === "UNDER_MAINTENANCE" ? "#fffbeb" : "#fef2f2",
                                                    color: prop.status === "ACTIVE" ? "#166534" : prop.status === "UNDER_MAINTENANCE" ? "#b45309" : "#991b1b",
                                                }}
                                            >
                                                {prop.status}
                                            </span>
                                        </div>

                                    {prop.description && (
                                        <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {prop.description}
                                        </p>
                                    )}

                                    <div style={{ fontSize: "0.85rem", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                                        <strong>Location:</strong> {[prop.address?.city, prop.address?.state, prop.address?.country].filter(Boolean).join(", ") || "No location listed"}
                                    </div>

                                    {canManage && (
                                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                            <Button variant="outline" onClick={() => handleOpenEdit(prop)}>
                                                Edit
                                            </Button>
                                            <Button variant="outline" onClick={() => handleDelete(prop._id)}>
                                                Delete
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                    </div>
                )}

                {/* Add/Edit Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={editingProperty ? "Edit Property" : "Add Property"}
                    subtitle="Enter property master details."
                >
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Input
                            label="Property Name *"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleFormChange}
                            required
                        />

                        <Input
                            label="Property Code * (Unique identifier)"
                            name="code"
                            value={formData.code || ""}
                            onChange={handleFormChange}
                            placeholder="e.g. BLD-01"
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Property Type *
                            </label>
                            <select
                                name="propertyType"
                                value={formData.propertyType || "APARTMENT"}
                                onChange={handleFormChange}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                            <option value="APARTMENT">Apartment</option>
                            <option value="BUILDING">Building Complex</option>
                            <option value="LINE_HOUSE">Line House / Row Houses</option>
                            <option value="ROW_HOUSE">Row House</option>
                            <option value="CHAWL">Chawl / Tenement</option>
                            <option value="PG_HOSTEL">PG / Hostel</option>
                            <option value="CO_LIVING">Co-Living Space</option>
                            <option value="VILLA">Villa / Bungalow</option>
                            <option value="HOUSE">Independent House</option>
                            <option value="COMMERCIAL">Commercial Building</option>
                            <option value="OFFICE">Office Premises</option>
                            <option value="WAREHOUSE">Warehouse</option>
                            <option value="LAND">Land / Plot</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status || "ACTIVE"}
                                onChange={handleFormChange}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                            </select>
                        </div>

                        <Input
                            label="Property Image Banner URL"
                            name="imageUrl"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={formData.images && formData.images.length > 0 ? formData.images[0] : ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFormData((prev) => ({ ...prev, images: val ? [val] : [] }));
                            }}
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ""}
                                onChange={handleFormChange}
                                rows={3}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            />
                        </div>

                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a" }}>Location & Address</h4>
                            <Input
                                label="Street Address"
                                name="address.street"
                                value={formData.address?.street || ""}
                                onChange={handleFormChange}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <Input
                                    label="City"
                                    name="address.city"
                                    value={formData.address?.city || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="State"
                                    name="address.state"
                                    value={formData.address?.state || ""}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <Input
                                    label="Country"
                                    name="address.country"
                                    value={formData.address?.country || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="Postal Code"
                                    name="address.postalCode"
                                    value={formData.address?.postalCode || ""}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Property"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default PropertiesPage;
