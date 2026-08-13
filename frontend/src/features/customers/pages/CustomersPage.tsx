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
    getCustomersApi,
    createCustomerApi,
    updateCustomerApi,
    deleteCustomerApi,
    type CustomerItem,
} from "../services/customersApi";
import { getUnitsApi, type UnitItem } from "@/features/units/services/unitsApi";

export function CustomersPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const role = activeMembership?.role;
    const canManage = role === "OWNER" || role === "ADMIN" || role === "MANAGER";

    const [customers, setCustomers] = useState<CustomerItem[]>([]);
    const [unitsList, setUnitsList] = useState<UnitItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Profile detail modal state
    const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
    const [selectedPerson, setSelectedPerson] = useState<CustomerItem | null>(null);

    // Add / Edit drawer state
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [formData, setFormData] = useState<Record<string, any>>({
        name: "",
        email: "",
        phone: "",
        unitId: "",
        occupation: "",
        emergencyContact: { name: "", phone: "", relationship: "" },
    });

    useEffect(() => {
        if (orgId) {
            fetchUnits();
            fetchPeople();
        } else {
            setLoading(false);
        }
    }, [orgId]);

    const fetchUnits = async () => {
        if (!orgId) return;
        const res = await getUnitsApi(orgId);
        if (res.success && res.data?.units) {
            setUnitsList(res.data.units);
        }
    };

    const fetchPeople = async () => {
        if (!orgId) return;
        setLoading(true);
        const res = await getCustomersApi(orgId);
        if (res.success && res.data?.customers) {
            setCustomers(res.data.customers);
        }
        setLoading(false);
    };

    const handleOpenAdd = () => {
        setEditingCustomer(null);
        setFormData({
            name: "",
            email: "",
            phone: "",
            unitId: unitsList.length > 0 ? unitsList[0]._id : "",
            occupation: "",
            emergencyContact: { name: "", phone: "", relationship: "" },
        });
        setDrawerOpen(true);
    };

    const handleOpenEdit = (person: CustomerItem) => {
        setEditingCustomer(person);
        setFormData({
            name: person.name,
            email: person.email,
            phone: person.phone,
            unitId: typeof person.unitId === "object" ? person.unitId?._id : person.unitId || "",
            occupation: person.occupation || "",
            emergencyContact: person.emergencyContact || { name: "", phone: "", relationship: "" },
        });
        setDrawerOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        setSaving(true);
        setFeedback(null);

        let res;
        if (editingCustomer) {
            res = await updateCustomerApi(orgId, editingCustomer._id, formData);
        } else {
            res = await createCustomerApi(orgId, formData);
        }
        setSaving(false);

        if (res.success) {
            setFeedback({ type: "success", message: editingCustomer ? "Person details updated." : "Person added to unit." });
            setDrawerOpen(false);
            fetchPeople();
        } else {
            setFeedback({ type: "error", message: res.message || "Operation failed." });
        }
    };

    const handleDelete = async (personId: string) => {
        if (!orgId) return;
        if (!window.confirm("Are you sure you want to remove this person from the unit record?")) return;

        const res = await deleteCustomerApi(orgId, personId);
        if (res.success) {
            setFeedback({ type: "success", message: "Person record removed." });
            fetchPeople();
            setProfileModalOpen(false);
        }
    };

    if (!orgId) {
        return (
            <MainLayout title="People Directory" subtitle="Please select an organization workspace">
                <EmptyState
                    title="No Workspace Selected"
                    description="Please select an organization workspace."
                    actionLabel="Select Workspace"
                    onAction={() => (window.location.href = "/select-workspace")}
                />
            </MainLayout>
        );
    }

    // Group people strictly Unit-Wise!
    const unitGroups: Record<string, { unit: any; occupants: CustomerItem[] }> = {};

    // First initialize groups from available units
    unitsList.forEach((u) => {
        unitGroups[u._id] = { unit: u, occupants: [] };
    });

    // Populate occupants into unit groups
    const unassignedOccupants: CustomerItem[] = [];
    customers.forEach((c) => {
        const uId = typeof c.unitId === "object" ? c.unitId?._id : c.unitId;
        if (uId && unitGroups[uId]) {
            unitGroups[uId].occupants.push(c);
        } else {
            unassignedOccupants.push(c);
        }
    });

    return (
        <MainLayout title="People Directory (Unit-Wise)" subtitle="Occupants and family members organized strictly by unit">
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div>
                        <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "People" }]} />
                        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
                            Unit-Wise Occupants & Family Directory
                        </h2>
                    </div>

                    {canManage && (
                        <Button variant="primary" onClick={handleOpenAdd}>
                            + Add Occupant to Unit
                        </Button>
                    )}
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

                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                        Loading unit-wise people directory...
                    </div>
                ) : Object.keys(unitGroups).length === 0 && unassignedOccupants.length === 0 ? (
                    <EmptyState
                        title="No Occupants Found"
                        description="No occupants or family members assigned to units yet."
                        actionLabel={canManage ? "+ Add Occupant" : undefined}
                        onAction={canManage ? handleOpenAdd : undefined}
                    />
                ) : (
                    /* Unit-Wise People Sections */
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {Object.values(unitGroups).map(({ unit, occupants }) => (
                            <Card key={unit._id}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {/* Unit Section Header */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#0f172a" }}>
                                                Unit {unit.unitNumber}
                                            </h3>
                                            <span style={{ fontSize: "0.78rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f1f5f9", fontWeight: 700, color: "#334155" }}>
                                                {unit.unitType || "1 BHK"}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                                            {occupants.length} {occupants.length === 1 ? "Person" : "People"}
                                        </span>
                                    </div>

                                    {/* Occupants List under Unit */}
                                    {occupants.length === 0 ? (
                                        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.88rem", fontStyle: "italic" }}>
                                            No occupants assigned to Unit {unit.unitNumber}.
                                        </p>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                                            {occupants.map((person, idx) => (
                                                <div
                                                    key={person._id}
                                                    onClick={() => {
                                                        setSelectedPerson(person);
                                                        setProfileModalOpen(true);
                                                    }}
                                                    style={{
                                                        padding: "12px 14px",
                                                        borderRadius: "10px",
                                                        backgroundColor: idx === 0 ? "#eff6ff" : "#ffffff",
                                                        border: `1px solid ${idx === 0 ? "#bfdbfe" : "#e2e8f0"}`,
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease",
                                                    }}
                                                >
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                                                            {person.name}
                                                        </strong>
                                                        <span
                                                            style={{
                                                                fontSize: "0.68rem",
                                                                fontWeight: 800,
                                                                padding: "2px 6px",
                                                                borderRadius: "10px",
                                                                backgroundColor: idx === 0 ? "#2563eb" : "#f1f5f9",
                                                                color: idx === 0 ? "#ffffff" : "#475569",
                                                            }}
                                                        >
                                                            {idx === 0 ? "Primary Tenant" : "Occupant"}
                                                        </span>
                                                    </div>

                                                    <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                                                        📞 {person.phone || "No phone"}
                                                    </div>
                                                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                        ✉️ {person.email || "No email"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Person Profile Modal */}
                {profileModalOpen && selectedPerson && (
                    <Drawer
                        isOpen={profileModalOpen}
                        onClose={() => setProfileModalOpen(false)}
                        title={`Profile: ${selectedPerson.name}`}
                        subtitle="Full tenant identity, rental details, & emergency info"
                    >
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ padding: "14px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "#0f172a" }}>Identity & Contact</h4>
                                <div style={{ fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                                    <div><strong>Full Name:</strong> {selectedPerson.name}</div>
                                    <div><strong>Email:</strong> {selectedPerson.email}</div>
                                    <div><strong>Phone / WhatsApp:</strong> {selectedPerson.phone}</div>
                                    <div><strong>Occupation:</strong> {selectedPerson.occupation || "Not specified"}</div>
                                </div>
                            </div>

                            <div style={{ padding: "14px", backgroundColor: "#eff6ff", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "#1e40af" }}>Emergency Contact</h4>
                                <div style={{ fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: "6px", color: "#1e3a8a" }}>
                                    <div><strong>Name:</strong> {selectedPerson.emergencyContact?.name || "None listed"}</div>
                                    <div><strong>Relationship:</strong> {selectedPerson.emergencyContact?.relationship || "N/A"}</div>
                                    <div><strong>Phone:</strong> {selectedPerson.emergencyContact?.phone || "N/A"}</div>
                                </div>
                            </div>

                            {canManage && (
                                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                                    <Button variant="outline" fullWidth onClick={() => handleOpenEdit(selectedPerson)}>
                                        Edit Person Info
                                    </Button>
                                    <Button variant="outline" fullWidth onClick={() => handleDelete(selectedPerson._id)}>
                                        Remove Person
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Drawer>
                )}

                {/* Add/Edit Person Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={editingCustomer ? "Edit Person Profile" : "Add Occupant to Unit"}
                    subtitle="Assign tenant or family member details to property unit."
                >
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Input
                            label="Full Name *"
                            name="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email Address *"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <Input
                            label="Phone Number *"
                            name="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Assign to Unit *
                            </label>
                            <select
                                name="unitId"
                                value={formData.unitId}
                                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                required
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="" disabled>Select Unit</option>
                                {unitsList.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        Unit {u.unitNumber} ({u.unitType})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Occupation"
                            name="occupation"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : editingCustomer ? "Update Person" : "Add to Unit"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default CustomersPage;
