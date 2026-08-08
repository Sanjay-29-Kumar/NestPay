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
    getUnitsApi,
    createUnitApi,
    updateUnitApi,
    deleteUnitApi,
    assignUserToUnitApi,
    type UnitItem,
    type UnitStats,
} from "../services/unitsApi";
import { getPropertiesApi, type PropertyItem } from "@/features/properties/services/propertiesApi";

export function UnitsPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const currentUserRole = activeMembership?.role;
    const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

    const [units, setUnits] = useState<UnitItem[]>([]);
    const [propertiesList, setPropertiesList] = useState<PropertyItem[]>([]);
    const [stats, setStats] = useState<UnitStats>({ totalUnits: 0, occupiedUnits: 0, vacantUnits: 0, maintenanceUnits: 0 });
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Assign User / Tenant Drawer state
    const [assignDrawerOpen, setAssignDrawerOpen] = useState<boolean>(false);
    const [assigningUnit, setAssigningUnit] = useState<UnitItem | null>(null);
    const [assignFormData, setAssignFormData] = useState({ name: "", email: "", phone: "" });
    const [assigning, setAssigning] = useState<boolean>(false);

    const [formData, setFormData] = useState<Record<string, any>>({
        propertyId: "",
        unitNumber: "",
        unitType: "FLAT",
        floor: "G",
        areaSqFt: 500,
        bedrooms: 1,
        bathrooms: 1,
        rentAmount: 1000,
        depositAmount: 1000,
        status: "VACANT",
    });

    useEffect(() => {
        if (orgId) {
            fetchPropertiesList();
            fetchUnits();
        } else {
            setLoading(false);
        }
    }, [orgId, selectedPropertyId, statusFilter]);

    const fetchPropertiesList = async () => {
        if (!orgId) return;
        const res = await getPropertiesApi(orgId);
        if (res.success && res.data?.properties) {
            setPropertiesList(res.data.properties);
        }
    };

    const fetchUnits = async () => {
        if (!orgId) return;
        setLoading(true);
        const res = await getUnitsApi(orgId, selectedPropertyId, statusFilter, searchQuery);
        if (res.success && res.data) {
            setUnits(res.data.units);
            if (res.data.stats) setStats(res.data.stats);
        }
        setLoading(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUnits();
    };

    const handleOpenAdd = () => {
        setEditingUnit(null);
        setFormData({
            propertyId: selectedPropertyId || (propertiesList.length > 0 ? propertiesList[0]._id : ""),
            unitNumber: "",
            unitType: "FLAT",
            floor: "1",
            areaSqFt: 650,
            bedrooms: 1,
            bathrooms: 1,
            rentAmount: 1200,
            depositAmount: 1200,
            status: "VACANT",
        });
        setDrawerOpen(true);
    };

    const handleOpenEdit = (u: UnitItem) => {
        setEditingUnit(u);
        setFormData({
            propertyId: typeof u.propertyId === "object" ? u.propertyId._id : u.propertyId,
            unitNumber: u.unitNumber,
            unitType: u.unitType,
            floor: u.floor || "",
            areaSqFt: u.areaSqFt || 0,
            bedrooms: u.bedrooms || 0,
            bathrooms: u.bathrooms || 0,
            rentAmount: u.rentAmount,
            depositAmount: u.depositAmount || 0,
            status: u.status,
        });
        setDrawerOpen(true);
    };

    const handleOpenAssign = (u: UnitItem) => {
        setAssigningUnit(u);
        setAssignFormData({ name: "", email: "", phone: "" });
        setAssignDrawerOpen(true);
    };

    const handleSaveAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !assigningUnit) return;
        setAssigning(true);
        const res = await assignUserToUnitApi(orgId, assigningUnit._id, assignFormData);
        setAssigning(false);

        if (res.success) {
            setFeedback({ type: "success", message: res.message || "User assigned to unit successfully." });
            setAssignDrawerOpen(false);
            fetchUnits();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to assign user to unit." });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        setSaving(true);
        setFeedback(null);

        let res;
        if (editingUnit) {
            res = await updateUnitApi(orgId, editingUnit._id, formData);
        } else {
            res = await createUnitApi(orgId, formData);
        }
        setSaving(false);

        if (res.success) {
            setFeedback({ type: "success", message: editingUnit ? "Unit updated." : "Unit created." });
            setDrawerOpen(false);
            fetchUnits();
        } else {
            setFeedback({ type: "error", message: res.message || "Operation failed." });
        }
    };

    const handleDelete = async (unitId: string) => {
        if (!orgId) return;
        if (!window.confirm("Are you sure you want to delete this unit?")) return;

        const res = await deleteUnitApi(orgId, unitId);
        if (res.success) {
            setFeedback({ type: "success", message: "Unit deleted." });
            fetchUnits();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to delete unit." });
        }
    };

    if (!orgId) {
        return (
            <MainLayout>
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Units" }]} />
                <EmptyState
                    title="No Active Workspace"
                    description="Please select an organization workspace to manage units."
                    actionLabel="Select Workspace"
                    onAction={() => (window.location.href = "/select-workspace")}
                />
            </MainLayout>
        );
    }

    const selectedProp = propertiesList.find((p) => p._id === selectedPropertyId);

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Units" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Workspace Units Master Data
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Select property to view and add users to property units.
                            </p>
                        </div>
                        {canManage && (
                            <Button variant="primary" onClick={handleOpenAdd}>
                                + Add Unit
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
                        <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Total Units</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{stats.totalUnits}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>Occupied Units</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>{stats.occupiedUnits}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>Vacant Units</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>{stats.vacantUnits}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#d97706", fontWeight: 600 }}>Maintenance</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>{stats.maintenanceUnits}</div>
                    </Card>
                </div>

                {/* Filter & Property Selector Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1" }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "12px", flex: 1, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ flex: 1, minWidth: "220px" }}>
                            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                                1. Select Property:
                            </label>
                            <select
                                value={selectedPropertyId}
                                onChange={(e) => setSelectedPropertyId(e.target.value)}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "2px solid #2563eb", fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}
                            >
                                <option value="">All Properties</option>
                                {propertiesList.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        🏢 {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: "180px" }}>
                            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                                Search Unit:
                            </label>
                            <input
                                type="text"
                                placeholder="Unit number (e.g. 101)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9rem",
                                }}
                            />
                        </div>

                        <div style={{ minWidth: "150px" }}>
                            <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "4px" }}>
                                Status Filter:
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="">All Statuses</option>
                                <option value="VACANT">Vacant</option>
                                <option value="OCCUPIED">Occupied</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="RESERVED">Reserved</option>
                            </select>
                        </div>

                        <div style={{ marginTop: "20px" }}>
                            <Button variant="outline" type="submit">
                                Filter
                            </Button>
                        </div>
                    </form>
                </div>

                {selectedProp && (
                    <div style={{ padding: "12px 16px", backgroundColor: "#eef2ff", borderRadius: "8px", border: "1px solid #c7d2fe", color: "#3730a3", fontSize: "0.9rem", fontWeight: 600 }}>
                        📍 Showing units for <strong>{selectedProp.name}</strong>. Select a unit below to add/assign a user or tenant.
                    </div>
                )}

                {/* Units List Grid */}
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading units...</div>
                ) : units.length === 0 ? (
                    <EmptyState
                        title="No Units Found"
                        description="No units exist matching your selected property filter."
                        actionLabel={canManage ? "+ Add Unit to this Property" : undefined}
                        onAction={canManage ? handleOpenAdd : undefined}
                    />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                        {units.map((u) => {
                            const statusColor =
                                u.status === "VACANT"
                                    ? "#16a34a"
                                    : u.status === "OCCUPIED"
                                    ? "#2563eb"
                                    : u.status === "MAINTENANCE"
                                    ? "#d97706"
                                    : "#64748b";

                            return (
                                <Card key={u._id}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div>
                                                <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155", fontWeight: 700 }}>
                                                    {u.unitType}
                                                </span>
                                                <h3 style={{ margin: "4px 0 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                                                    Unit {u.unitNumber}
                                                </h3>
                                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                    {typeof u.propertyId === "object" ? u.propertyId?.name : "Property"}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.75rem",
                                                    fontWeight: 700,
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    backgroundColor: `${statusColor}15`,
                                                    color: statusColor,
                                                }}
                                            >
                                                {u.status}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                                            <span>Floor: <strong>{u.floor || "G"}</strong></span>
                                            <span>Area: <strong>{u.areaSqFt || 0} sq ft</strong></span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#475569" }}>
                                            <span>Beds: <strong>{u.bedrooms}</strong> | Baths: <strong>{u.bathrooms}</strong></span>
                                            <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>
                                                ${u.rentAmount}/mo
                                            </strong>
                                        </div>

                                        {canManage && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
                                                <Button variant="primary" size="sm" onClick={() => handleOpenAssign(u)}>
                                                    + Add / Assign User to Unit
                                                </Button>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(u)} style={{ flex: 1 }}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleDelete(u._id)} style={{ flex: 1 }}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Add/Edit Unit Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={editingUnit ? "Edit Unit" : "Add Unit"}
                    subtitle="Assign unit to property and set rent details."
                >
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Property *
                            </label>
                            <select
                                name="propertyId"
                                value={formData.propertyId}
                                onChange={handleFormChange}
                                required
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="" disabled>Select Property</option>
                                {propertiesList.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Unit Number *"
                                name="unitNumber"
                                placeholder="e.g. 101, B-4"
                                value={formData.unitNumber || ""}
                                onChange={handleFormChange}
                                required
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Unit Type *</label>
                                <select
                                    name="unitType"
                                    value={formData.unitType || "FLAT"}
                                    onChange={handleFormChange}
                                    style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                                >
                                    <option value="ONE_RK">1RK (1 Room Kitchen)</option>
                                    <option value="ONE_BHK">1BHK</option>
                                    <option value="TWO_BHK">2BHK</option>
                                    <option value="THREE_BHK">3BHK</option>
                                    <option value="SHARED_ROOM">Shared Room / Co-living</option>
                                    <option value="BED_SPACE">Bed Space / PG Seat</option>
                                    <option value="LINE_UNIT">Line House Unit</option>
                                    <option value="FLAT">Flat</option>
                                    <option value="ROOM">Single Room</option>
                                    <option value="SHOP">Shop</option>
                                    <option value="OFFICE">Office</option>
                                    <option value="SUITE">Suite</option>
                                    <option value="VILLA">Villa</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Floor"
                                name="floor"
                                value={formData.floor || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Area (sq ft)"
                                name="areaSqFt"
                                type="number"
                                value={formData.areaSqFt || 0}
                                onChange={handleFormChange}
                            />
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Status</label>
                                <select
                                    name="status"
                                    value={formData.status || "VACANT"}
                                    onChange={handleFormChange}
                                    style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                                >
                                    <option value="VACANT">Vacant</option>
                                    <option value="OCCUPIED">Occupied</option>
                                    <option value="MAINTENANCE">Maintenance</option>
                                    <option value="RESERVED">Reserved</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Bedrooms"
                                name="bedrooms"
                                type="number"
                                value={formData.bedrooms || 1}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Bathrooms"
                                name="bathrooms"
                                type="number"
                                value={formData.bathrooms || 1}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Rent Amount ($/mo) *"
                                name="rentAmount"
                                type="number"
                                value={formData.rentAmount || 0}
                                onChange={handleFormChange}
                                required
                            />
                            <Input
                                label="Deposit Amount ($)"
                                name="depositAmount"
                                type="number"
                                value={formData.depositAmount || 0}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : editingUnit ? "Update Unit" : "Create Unit"}
                            </Button>
                        </div>
                    </form>
                </Drawer>

                {/* Assign User / Tenant Drawer */}
                <Drawer
                    isOpen={assignDrawerOpen}
                    onClose={() => setAssignDrawerOpen(false)}
                    title={`Add / Assign User to Unit ${assigningUnit?.unitNumber || ""}`}
                    subtitle={`Assign a tenant or occupant to Unit ${assigningUnit?.unitNumber} in ${typeof assigningUnit?.propertyId === "object" ? assigningUnit.propertyId.name : "the selected property"}`}
                >
                    <form onSubmit={handleSaveAssign} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Input
                            label="User / Tenant Full Name *"
                            name="name"
                            value={assignFormData.name}
                            onChange={(e) => setAssignFormData({ ...assignFormData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="User Email Address *"
                            name="email"
                            type="email"
                            value={assignFormData.email}
                            onChange={(e) => setAssignFormData({ ...assignFormData, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Mobile / Phone Number *"
                            name="phone"
                            value={assignFormData.phone}
                            onChange={(e) => setAssignFormData({ ...assignFormData, phone: e.target.value })}
                            required
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setAssignDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={assigning}>
                                {assigning ? "Assigning..." : "Assign User to Unit"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default UnitsPage;
