import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import api from "@/services/api";
import MessengerDrawer from "@/components/layout/MessengerDrawer";

export function UnitDetailPage() {
    const { unitId } = useParams<{ unitId: string }>();
    const navigate = useNavigate();
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const orgId = activeMembership?.organizationId?._id;

    const [unit, setUnit] = useState<any>(null);
    const [occupants, setOccupants] = useState<any[]>([]);
    const [rents, setRents] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [messengerOpen, setMessengerOpen] = useState<boolean>(false);

    useEffect(() => {
        if (orgId && unitId) {
            fetchUnitDetails();
        } else {
            setLoading(false);
        }
    }, [orgId, unitId]);

    const fetchUnitDetails = async () => {
        setLoading(true);
        try {
            // Fetch Unit info
            const unitRes = await api.get(`/organizations/${orgId}/units`);
            if (unitRes.data?.success && Array.isArray(unitRes.data.data?.units)) {
                const found = unitRes.data.data.units.find((u: any) => u._id === unitId);
                if (found) setUnit(found);
            }

            // Fetch occupants for this unit from customers
            const custRes = await api.get(`/organizations/${orgId}/customers?unitId=${unitId}`);
            if (custRes.data?.success && Array.isArray(custRes.data.data?.customers)) {
                setOccupants(custRes.data.data.customers);
            }

            // Fetch rent & invoice records for unit
            const rentRes = await api.get(`/organizations/${orgId}/payments/rents?unitId=${unitId}`);
            if (rentRes.data?.success && Array.isArray(rentRes.data.rents)) {
                setRents(rentRes.data.rents);
            }
        } catch {
            // Handled silently
        }
        setLoading(false);
    };

    if (!orgId) {
        return (
            <MainLayout title="Unit Workspace" subtitle="Please select an organization workspace">
                <EmptyState
                    title="No Workspace Selected"
                    description="Please select an organization workspace."
                    actionLabel="Select Workspace"
                    onAction={() => navigate("/select-workspace")}
                />
            </MainLayout>
        );
    }

    if (loading) {
        return (
            <MainLayout title="Unit Workspace" subtitle="Loading unit details...">
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading unit workspace details...
                </div>
            </MainLayout>
        );
    }

    if (!unit) {
        return (
            <MainLayout title="Unit Workspace">
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Units", path: "/units" }, { label: "Unit Workspace" }]} />
                <EmptyState
                    title="Unit Not Found"
                    description="The requested unit record could not be found."
                    actionLabel="Back to Units"
                    onAction={() => navigate("/units")}
                />
            </MainLayout>
        );
    }

    const primaryTenant = occupants.length > 0 ? occupants[0] : null;
    const familyOrSharedMembers = occupants.length > 1 ? occupants.slice(1) : [];

    return (
        <MainLayout title={`Unit ${unit.unitNumber} Workspace`} subtitle={`Full operational context for Unit ${unit.unitNumber}`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Top Navigation & Action Header */}
                <div>
                    <Breadcrumbs
                        items={[
                            { label: "Dashboard", path: "/dashboard" },
                            { label: "Units", path: "/units" },
                            { label: `Unit ${unit.unitNumber}` },
                        ]}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
                                Unit {unit.unitNumber}
                            </h1>
                            <span
                                style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 800,
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    backgroundColor: unit.status === "OCCUPIED" ? "#eff6ff" : "#f0fdf4",
                                    color: unit.status === "OCCUPIED" ? "#1e40af" : "#166534",
                                    border: `1px solid ${unit.status === "OCCUPIED" ? "#bfdbfe" : "#bbf7d0"}`,
                                }}
                            >
                                {unit.status}
                            </span>
                            <span
                                style={{
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    padding: "4px 10px",
                                    borderRadius: "12px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                }}
                            >
                                {unit.unitType || "1 BHK"}
                            </span>
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <Button variant="outline" onClick={() => navigate("/units")}>
                                ← Back to Units
                            </Button>
                            <Button variant="outline" onClick={() => setMessengerOpen(true)}>
                                💬 Unit Messenger
                            </Button>
                            <Button variant="primary" onClick={() => navigate(`/invoices?unitId=${unit._id}`)}>
                                View Invoices
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Primary Overview Stats Banner */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                    <Card>
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Monthly Rent</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#2563eb", marginTop: "4px" }}>
                            ₹{(unit.rentAmount || 0).toLocaleString()}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Deposit: ₹{(unit.depositAmount || 0).toLocaleString()}</span>
                    </Card>

                    <Card>
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Occupancy Model</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                            {unit.sharingType || "SINGLE / FAMILY"}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Max Capacity: {unit.maxCapacity || 1} Persons</span>
                    </Card>

                    <Card>
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Primary Occupant</div>
                        <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>
                            {primaryTenant ? primaryTenant.name : "None (Vacant)"}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                            {primaryTenant ? primaryTenant.phone || primaryTenant.email : "No occupants assigned"}
                        </span>
                    </Card>

                    <Card>
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>Total People</div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#7c3aed", marginTop: "4px" }}>
                            {occupants.length}
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Primary & Family/Shared</span>
                    </Card>
                </div>

                {/* Workspace Content Sections */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                    {/* People & Occupants Card */}
                    <Card title="Unit Occupants & Family Members" subtitle="Residents currently associated with Unit 101">
                        {occupants.length === 0 ? (
                            <EmptyState
                                title="No Occupants Assigned"
                                description="This unit is currently vacant. Assign a primary tenant or family to populate."
                            />
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                                {primaryTenant && (
                                    <div
                                        style={{
                                            padding: "14px",
                                            borderRadius: "10px",
                                            backgroundColor: "#eff6ff",
                                            border: "1px solid #bfdbfe",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{primaryTenant.name}</strong>
                                                <div style={{ fontSize: "0.82rem", color: "#2563eb", marginTop: "2px" }}>
                                                    Primary Tenant • {primaryTenant.phone} • {primaryTenant.email}
                                                </div>
                                            </div>
                                            <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 800 }}>
                                                PRIMARY
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {familyOrSharedMembers.map((member: any) => (
                                    <div
                                        key={member._id}
                                        style={{
                                            padding: "12px",
                                            borderRadius: "10px",
                                            backgroundColor: "#f8fafc",
                                            border: "1px solid #e2e8f0",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{member.name}</strong>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                                                {member.phone || member.email}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 700 }}>
                                            Occupant / Family
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Rent & Invoices Workspace */}
                    <Card title="Rent & Invoice Ledger" subtitle="Latest rent records and payment status for this unit">
                        {rents.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>
                                    No invoices generated for this unit yet.
                                </p>
                                <div style={{ marginTop: "12px" }}>
                                    <Link to="/invoices">
                                        <Button variant="outline" size="sm">+ Create Invoice</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                                {rents.map((rent: any) => (
                                    <div
                                        key={rent._id}
                                        style={{
                                            padding: "12px 14px",
                                            borderRadius: "10px",
                                            backgroundColor: "#ffffff",
                                            border: "1px solid #cbd5e1",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div>
                                            <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                                                Billing Period: {rent.billingPeriod}
                                            </strong>
                                            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                                                Due: {rent.dueDate ? new Date(rent.dueDate).toLocaleDateString() : "End of Month"}
                                            </div>
                                        </div>

                                        <div style={{ textAlign: "right" }}>
                                            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>
                                                ₹{(rent.totalPayableAmount || rent.baseAmount || 0).toLocaleString()}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.72rem",
                                                    fontWeight: 800,
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    backgroundColor: rent.status === "PAID" ? "#ecfdf5" : rent.status === "PARTIALLY_PAID" ? "#fff7ed" : "#fef2f2",
                                                    color: rent.status === "PAID" ? "#047857" : rent.status === "PARTIALLY_PAID" ? "#c2410c" : "#991b1b",
                                                }}
                                            >
                                                {rent.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <MessengerDrawer
                isOpen={messengerOpen}
                onClose={() => setMessengerOpen(false)}
                initialUnitId={unit._id}
                recipientName={`Unit ${unit.unitNumber}`}
            />
        </MainLayout>
    );
}

export default UnitDetailPage;
