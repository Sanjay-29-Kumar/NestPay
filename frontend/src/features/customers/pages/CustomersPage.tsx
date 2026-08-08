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
    assignCustomerUnitApi,
    type CustomerItem,
    type CustomerStats,
} from "../services/customersApi";
import { getPropertiesApi, type PropertyItem } from "@/features/properties/services/propertiesApi";
import { getUnitsApi, type UnitItem } from "@/features/units/services/unitsApi";
import { sendWhatsAppRentReminderApi } from "@/features/notifications/services/notificationsApi";

export function CustomersPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const currentUserRole = activeMembership?.role;
    const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || currentUserRole === "MANAGER" || currentUserRole === "STAFF";

    const [customers, setCustomers] = useState<CustomerItem[]>([]);
    const [stats, setStats] = useState<CustomerStats>({ totalCount: 0, activeCount: 0 });
    const [propertiesList, setPropertiesList] = useState<PropertyItem[]>([]);
    const [unitsList, setUnitsList] = useState<UnitItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");

    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [assignDrawerOpen, setAssignDrawerOpen] = useState<boolean>(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
    const [selectedCustomerForAssign, setSelectedCustomerForAssign] = useState<CustomerItem | null>(null);

    // WhatsApp Rent Reminder Drawer state
    const [reminderDrawerOpen, setReminderDrawerOpen] = useState<boolean>(false);
    const [selectedCustomerForReminder, setSelectedCustomerForReminder] = useState<CustomerItem | null>(null);
    const [reminderFormData, setReminderFormData] = useState({
        tenantPhone: "",
        tenantName: "",
        rentAmount: "1200",
        unitNumber: "101",
        dueDate: "10th August 2026",
        reminderEvent: "7TH",
    });
    const [reminderSending, setReminderSending] = useState<boolean>(false);
    const [reminderFeedback, setReminderFeedback] = useState<{ type: "success" | "error"; message: string; messageId?: string } | null>(null);

    const [saving, setSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Add/Edit Form
    const [formData, setFormData] = useState<Record<string, any>>({
        name: "",
        email: "",
        phone: "",
        occupation: "",
        nationality: "",
        emergencyContact: { name: "", phone: "", relationship: "" },
    });

    // Assign Form
    const [assignPropId, setAssignPropId] = useState<string>("");
    const [assignUnitId, setAssignUnitId] = useState<string>("");

    useEffect(() => {
        if (orgId) {
            fetchCustomers();
            fetchPropertiesAndUnits();
        } else {
            setLoading(false);
        }
    }, [orgId, statusFilter]);

    const fetchPropertiesAndUnits = async () => {
        if (!orgId) return;
        const pRes = await getPropertiesApi(orgId);
        if (pRes.success && pRes.data?.properties) setPropertiesList(pRes.data.properties);

        const uRes = await getUnitsApi(orgId);
        if (uRes.success && uRes.data?.units) setUnitsList(uRes.data.units);
    };

    const fetchCustomers = async () => {
        if (!orgId) return;
        setLoading(true);
        const res = await getCustomersApi(orgId, searchQuery, undefined, undefined, statusFilter);
        if (res.success && res.data) {
            setCustomers(res.data.customers);
            if (res.data.stats) setStats(res.data.stats);
        }
        setLoading(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCustomers();
    };

    const handleOpenAdd = () => {
        setEditingCustomer(null);
        setFormData({
            name: "",
            email: "",
            phone: "",
            occupation: "",
            nationality: "",
            emergencyContact: { name: "", phone: "", relationship: "" },
        });
        setDrawerOpen(true);
    };

    const handleOpenEdit = (c: CustomerItem) => {
        setEditingCustomer(c);
        setFormData({
            name: c.name,
            email: c.email,
            phone: c.phone,
            occupation: c.occupation || "",
            nationality: c.nationality || "",
            emergencyContact: {
                name: c.emergencyContact?.name || "",
                phone: c.emergencyContact?.phone || "",
                relationship: c.emergencyContact?.relationship || "",
            },
        });
        setDrawerOpen(true);
    };

    const handleOpenAssign = (c: CustomerItem) => {
        setSelectedCustomerForAssign(c);
        setAssignPropId(typeof c.propertyId === "object" ? c.propertyId?._id || "" : c.propertyId || "");
        setAssignUnitId(typeof c.unitId === "object" ? c.unitId?._id || "" : c.unitId || "");
        setAssignDrawerOpen(true);
    };

    const handleOpenReminder = (c: CustomerItem) => {
        setSelectedCustomerForReminder(c);
        setReminderFeedback(null);
        setReminderFormData({
            tenantPhone: c.phone || "919677708612",
            tenantName: c.name || "Tenant",
            rentAmount: c.unitId?.rentAmount ? String(c.unitId.rentAmount) : "1200",
            unitNumber: c.unitId?.unitNumber ? String(c.unitId.unitNumber) : "101",
            dueDate: "10th August 2026",
            reminderEvent: "7TH",
        });
        setReminderDrawerOpen(true);
    };

    const handleSendRentReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        setReminderSending(true);
        setReminderFeedback(null);

        const res = await sendWhatsAppRentReminderApi({
            organizationId: orgId,
            tenantPhone: reminderFormData.tenantPhone,
            tenantName: reminderFormData.tenantName,
            rentAmount: reminderFormData.rentAmount,
            unitNumber: reminderFormData.unitNumber,
            dueDate: reminderFormData.dueDate,
            reminderEvent: reminderFormData.reminderEvent,
        });

        setReminderSending(false);

        if (res.success) {
            setReminderFeedback({
                type: "success",
                message: res.message || "Rent reminder dispatched successfully via WhatsApp!",
                messageId: res.messageId,
            });
        } else {
            setReminderFeedback({
                type: "error",
                message: res.message || "Failed to dispatch WhatsApp rent reminder.",
            });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name.startsWith("emergencyContact.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                emergencyContact: {
                    ...(prev.emergencyContact || {}),
                    [field]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveCustomer = async (e: React.FormEvent) => {
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
            setFeedback({ type: "success", message: editingCustomer ? "Customer updated." : "Customer created." });
            setDrawerOpen(false);
            fetchCustomers();
        } else {
            setFeedback({ type: "error", message: res.message || "Operation failed." });
        }
    };

    const handleSaveAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !selectedCustomerForAssign) return;

        setSaving(true);
        const res = await assignCustomerUnitApi(orgId, selectedCustomerForAssign._id, assignPropId, assignUnitId);
        setSaving(false);

        if (res.success) {
            setFeedback({ type: "success", message: "Unit assigned successfully." });
            setAssignDrawerOpen(false);
            fetchCustomers();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to assign unit." });
        }
    };

    const handleDelete = async (customerId: string) => {
        if (!orgId) return;
        if (!window.confirm("Are you sure you want to delete this customer record?")) return;

        const res = await deleteCustomerApi(orgId, customerId);
        if (res.success) {
            setFeedback({ type: "success", message: "Customer deleted." });
            fetchCustomers();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to delete customer." });
        }
    };

    if (!orgId) {
        return (
            <MainLayout>
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Customers" }]} />
                <EmptyState
                    title="No Active Workspace"
                    description="Please select an organization workspace to manage customers and tenants."
                    actionLabel="Select Workspace"
                    onAction={() => (window.location.href = "/select-workspace")}
                />
            </MainLayout>
        );
    }

    const availableUnitsForSelectedProp = unitsList.filter((u) => {
        if (!assignPropId) return true;
        const propIdStr = typeof u.propertyId === "object" ? u.propertyId?._id : u.propertyId;
        return propIdStr === assignPropId;
    });

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Customers" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Customers & Tenants Directory
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Manage workspace tenants, unit allocations, and automated WhatsApp rent reminders.
                            </p>
                        </div>
                        {canManage && (
                            <Button variant="primary" onClick={handleOpenAdd}>
                                + Add Customer
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Total Customers</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{stats.totalCount}</div>
                    </Card>
                    <Card>
                        <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>Active Tenants</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>{stats.activeCount}</div>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                        <input
                            type="text"
                            placeholder="Search customer name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                flex: 1,
                                minWidth: "240px",
                            }}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAST">Past</option>
                            <option value="PENDING">Pending</option>
                        </select>
                        <Button variant="outline" type="submit">
                            Filter
                        </Button>
                    </form>
                </div>

                {/* Customers Grid */}
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading customers...</div>
                ) : customers.length === 0 ? (
                    <EmptyState
                        title="No Customers Found"
                        description="Start by adding your first customer or tenant."
                        actionLabel={canManage ? "+ Add First Customer" : undefined}
                        onAction={canManage ? handleOpenAdd : undefined}
                    />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                        {customers.map((c) => (
                            <Card key={c._id}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div
                                                style={{
                                                    width: "42px",
                                                    height: "42px",
                                                    borderRadius: "50%",
                                                    backgroundColor: "#0284c7",
                                                    color: "#ffffff",
                                                    fontWeight: 700,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {c.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>{c.name}</h3>
                                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{c.email}</span>
                                            </div>
                                        </div>
                                        <span
                                            style={{
                                                fontSize: "0.75rem",
                                                fontWeight: 700,
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                backgroundColor: c.status === "ACTIVE" ? "#f0fdf4" : "#fef2f2",
                                                color: c.status === "ACTIVE" ? "#166534" : "#991b1b",
                                            }}
                                        >
                                            {c.status}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: "0.85rem", color: "#475569", background: "#f8fafc", padding: "10px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <div><strong>Phone:</strong> {c.phone}</div>
                                        <div><strong>Assigned Property:</strong> {typeof c.propertyId === 'object' ? c.propertyId?.name : "Unassigned"}</div>
                                        <div><strong>Assigned Unit:</strong> {typeof c.unitId === 'object' && c.unitId?.unitNumber ? `Unit ${c.unitId.unitNumber} ($${c.unitId.rentAmount}/mo)` : "Unassigned"}</div>
                                    </div>

                                    {c.emergencyContact?.name && (
                                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                            <strong>Emergency Contact:</strong> {c.emergencyContact.name} ({c.emergencyContact.phone})
                                        </div>
                                    )}

                                    {canManage && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                                            <Button variant="primary" size="sm" onClick={() => handleOpenReminder(c)}>
                                                💬 Send WhatsApp Rent Reminder
                                            </Button>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenAssign(c)} style={{ flex: 1 }}>
                                                    Assign Unit
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(c)} style={{ flex: 1 }}>
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => handleDelete(c._id)} style={{ flex: 1 }}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Add/Edit Customer Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title={editingCustomer ? "Edit Customer Record" : "Add New Customer"}
                    subtitle="Enter personal information and emergency contact details."
                >
                    <form onSubmit={handleSaveCustomer} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Input
                            label="Full Name *"
                            name="name"
                            value={formData.name || ""}
                            onChange={handleFormChange}
                            required
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Email Address *"
                                type="email"
                                name="email"
                                value={formData.email || ""}
                                onChange={handleFormChange}
                                required
                            />
                            <Input
                                label="Phone Number *"
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleFormChange}
                                required
                            />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Occupation"
                                name="occupation"
                                value={formData.occupation || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Nationality"
                                name="nationality"
                                value={formData.nationality || ""}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a" }}>Emergency Contact</h4>
                            <Input
                                label="Contact Name"
                                name="emergencyContact.name"
                                value={formData.emergencyContact?.name || ""}
                                onChange={handleFormChange}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <Input
                                    label="Contact Phone"
                                    name="emergencyContact.phone"
                                    value={formData.emergencyContact?.phone || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="Relationship"
                                    name="emergencyContact.relationship"
                                    value={formData.emergencyContact?.relationship || ""}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : editingCustomer ? "Update Customer" : "Create Customer"}
                            </Button>
                        </div>
                    </form>
                </Drawer>

                {/* Assign Unit Drawer */}
                <Drawer
                    isOpen={assignDrawerOpen}
                    onClose={() => setAssignDrawerOpen(false)}
                    title={`Assign Unit for ${selectedCustomerForAssign?.name || ""}`}
                    subtitle="Associate customer with property and unit."
                >
                    <form onSubmit={handleSaveAssign} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Property</label>
                            <select
                                value={assignPropId}
                                onChange={(e) => {
                                    setAssignPropId(e.target.value);
                                    setAssignUnitId("");
                                }}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="">Select Property</option>
                                {propertiesList.map((p) => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} ({p.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Unit</label>
                            <select
                                value={assignUnitId}
                                onChange={(e) => setAssignUnitId(e.target.value)}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="">Select Unit</option>
                                {availableUnitsForSelectedProp.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        Unit {u.unitNumber} - ${u.rentAmount}/mo ({u.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setAssignDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Assignment"}
                            </Button>
                        </div>
                    </form>
                </Drawer>

                {/* Send WhatsApp Rent Reminder Drawer */}
                <Drawer
                    isOpen={reminderDrawerOpen}
                    onClose={() => setReminderDrawerOpen(false)}
                    title={`Send WhatsApp Rent Reminder`}
                    subtitle={`Dispatch official Meta Cloud API WhatsApp reminder for ${selectedCustomerForReminder?.name || "tenant"}`}
                >
                    <form onSubmit={handleSendRentReminder} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {reminderFeedback && (
                            <div
                                style={{
                                    padding: "12px 14px",
                                    borderRadius: "8px",
                                    fontSize: "0.88rem",
                                    backgroundColor: reminderFeedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                                    color: reminderFeedback.type === "success" ? "#166534" : "#991b1b",
                                    border: `1px solid ${reminderFeedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                                }}
                            >
                                <div style={{ fontWeight: 700 }}>{reminderFeedback.message}</div>
                                {reminderFeedback.messageId && (
                                    <div style={{ marginTop: "4px", fontSize: "0.78rem", wordBreak: "break-all" }}>
                                        Meta Message ID: <code>{reminderFeedback.messageId}</code>
                                    </div>
                                )}
                            </div>
                        )}

                        <Input
                            label="Tenant Full Name *"
                            name="tenantName"
                            value={reminderFormData.tenantName}
                            onChange={(e) => setReminderFormData({ ...reminderFormData, tenantName: e.target.value })}
                            required
                        />

                        <Input
                            label="Tenant WhatsApp Phone Number (with Country Code) *"
                            name="tenantPhone"
                            value={reminderFormData.tenantPhone}
                            onChange={(e) => setReminderFormData({ ...reminderFormData, tenantPhone: e.target.value })}
                            required
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Rent Amount ($) *"
                                name="rentAmount"
                                value={reminderFormData.rentAmount}
                                onChange={(e) => setReminderFormData({ ...reminderFormData, rentAmount: e.target.value })}
                                required
                            />
                            <Input
                                label="Unit Number *"
                                name="unitNumber"
                                value={reminderFormData.unitNumber}
                                onChange={(e) => setReminderFormData({ ...reminderFormData, unitNumber: e.target.value })}
                                required
                            />
                        </div>

                        <Input
                            label="Rent Due Date *"
                            name="dueDate"
                            value={reminderFormData.dueDate}
                            onChange={(e) => setReminderFormData({ ...reminderFormData, dueDate: e.target.value })}
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Schedule Event Event
                            </label>
                            <select
                                value={reminderFormData.reminderEvent}
                                onChange={(e) => setReminderFormData({ ...reminderFormData, reminderEvent: e.target.value })}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="1ST">1st of Month (Initial Advance Notice)</option>
                                <option value="7TH">7th of Month (Upcoming Rent Reminder)</option>
                                <option value="10TH">10th of Month (Due Date Today)</option>
                                <option value="11TH">11th of Month (Overdue +1 Day)</option>
                                <option value="12TH">12th of Month (Overdue +2 Days)</option>
                                <option value="13TH">13th of Month (Overdue +3 Days)</option>
                                <option value="14TH">14th of Month (Overdue +4 Days)</option>
                                <option value="15TH">15th of Month (Final Overdue Notice)</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                            <Button variant="outline" type="button" onClick={() => setReminderDrawerOpen(false)}>
                                Close
                            </Button>
                            <Button variant="primary" type="submit" disabled={reminderSending}>
                                {reminderSending ? "Dispatching via WhatsApp..." : "💬 Send Rent Reminder"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default CustomersPage;
