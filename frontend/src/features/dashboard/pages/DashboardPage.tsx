import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { getOrganizationDetailsApi } from "@/features/organization/services/organizationApi";
import { getPropertiesApi } from "@/features/properties/services/propertiesApi";
import { getUnitsApi } from "@/features/units/services/unitsApi";
import { getCustomersApi, getMyResidenceApi } from "@/features/customers/services/customersApi";

export function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const orgId = activeMembership?.organizationId?._id;
    const role = activeMembership?.role || "MEMBER";

    const [loading, setLoading] = useState<boolean>(true);
    const [orgData, setOrgData] = useState<any>(null);
    const [propertyStats, setPropertyStats] = useState({ totalCount: 0, activeCount: 0 });
    const [unitStats, setUnitStats] = useState({ totalUnits: 0, occupiedUnits: 0, vacantUnits: 0 });
    const [customerStats, setCustomerStats] = useState({ totalCount: 0, activeCount: 0 });
    const [residenceInfo, setResidenceInfo] = useState<any>(null);

    useEffect(() => {
        if (orgId) {
            fetchDashboardMetrics(orgId);
        } else {
            setLoading(false);
        }
    }, [orgId]);

    const fetchDashboardMetrics = async (targetOrgId: string) => {
        setLoading(true);

        const [orgRes, propRes, unitRes, custRes, resRes] = await Promise.all([
            getOrganizationDetailsApi(targetOrgId),
            getPropertiesApi(targetOrgId),
            getUnitsApi(targetOrgId),
            getCustomersApi(targetOrgId),
            getMyResidenceApi(targetOrgId),
        ]);

        if (orgRes.success && orgRes.data?.organization) setOrgData(orgRes.data.organization);
        if (propRes.success && propRes.data?.stats) setPropertyStats(propRes.data.stats);
        if (unitRes.success && unitRes.data?.stats) setUnitStats(unitRes.data.stats);
        if (custRes.success && custRes.data?.stats) setCustomerStats(custRes.data.stats);
        if (resRes.success && resRes.data) setResidenceInfo(resRes.data);

        setLoading(false);
    };

    if (!orgId) {
        return (
            <MainLayout title="NESTPAY Workspace" subtitle="Please select an organization workspace">
                <EmptyState
                    title="No Workspace Selected"
                    description="Please select or create an organization workspace to access your rental dashboard."
                    actionLabel="Select Workspace"
                    onAction={() => navigate("/select-workspace")}
                />
            </MainLayout>
        );
    }

    if (loading) {
        return (
            <MainLayout title="Dashboard" subtitle="Loading workspace metrics...">
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading organization metrics...
                </div>
            </MainLayout>
        );
    }

    const isOwnerOrAdmin = role === "OWNER" || role === "ADMIN" || role === "MANAGER";

    return (
        <MainLayout
            title={orgData?.name || "Workspace Dashboard"}
            subtitle={`Welcome back, ${user?.name || "User"}. Operational overview.`}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* OWNER / ADMIN DASHBOARD */}
                {isOwnerOrAdmin ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                                Organization Overview & Real Metrics
                            </h2>
                            <span
                                style={{
                                    backgroundColor: role === "OWNER" ? "#eef2ff" : "#fff7ed",
                                    color: role === "OWNER" ? "#4338ca" : "#c2410c",
                                    fontWeight: 800,
                                    fontSize: "0.75rem",
                                    padding: "3px 10px",
                                    borderRadius: "12px",
                                }}
                            >
                                {role} WORKSPACE
                            </span>
                        </div>

                        {/* Real Metrics Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Properties</div>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
                                    {propertyStats.totalCount}
                                </div>
                                <Link to="/properties" style={{ fontSize: "0.82rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block", fontWeight: 600 }}>
                                    Manage Properties →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Total Units</div>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
                                    {unitStats.totalUnits}
                                </div>
                                <Link to="/units" style={{ fontSize: "0.82rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block", fontWeight: 600 }}>
                                    Manage Units →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>Occupied Units</div>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#2563eb", marginTop: "4px" }}>
                                    {unitStats.occupiedUnits}
                                </div>
                                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Active tenancies</span>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>Vacant Units</div>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#16a34a", marginTop: "4px" }}>
                                    {unitStats.vacantUnits}
                                </div>
                                <Link to="/units" style={{ fontSize: "0.82rem", color: "#16a34a", textDecoration: "none", marginTop: "8px", display: "inline-block", fontWeight: 600 }}>
                                    + Assign Tenants →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#7c3aed", fontWeight: 600 }}>Total Occupants</div>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#7c3aed", marginTop: "4px" }}>
                                    {customerStats.activeCount}
                                </div>
                                <Link to="/customers" style={{ fontSize: "0.82rem", color: "#7c3aed", textDecoration: "none", marginTop: "8px", display: "inline-block", fontWeight: 600 }}>
                                    View Unit-wise People →
                                </Link>
                            </Card>
                        </div>

                        {/* Graceful Empty State for 0 Properties */}
                        {propertyStats.totalCount === 0 && (
                            <div style={{ marginTop: "12px" }}>
                                <EmptyState
                                    title="No Properties Added Yet"
                                    description="Start by adding your physical apartment, building, or line property to manage units and rental payments."
                                    actionLabel="+ Add Property"
                                    onAction={() => navigate("/properties")}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* TENANT LANDING DASHBOARD */
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                                Your Assigned Unit Workspace
                            </h2>
                            <span
                                style={{
                                    backgroundColor: "#ecfdf5",
                                    color: "#047857",
                                    fontWeight: 800,
                                    fontSize: "0.75rem",
                                    padding: "3px 10px",
                                    borderRadius: "12px",
                                }}
                            >
                                TENANT DASHBOARD
                            </span>
                        </div>

                        {residenceInfo?.assigned ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                                {/* Assigned Unit Details Card */}
                                <Card title={`Unit ${residenceInfo.unit?.unitNumber || "101"}`}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Property Name:</span>
                                            <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>
                                                {residenceInfo.property?.name || "Property"}
                                            </strong>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Room Type:</span>
                                            <span style={{ fontSize: "0.85rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f1f5f9", fontWeight: 700 }}>
                                                {residenceInfo.unit?.unitType || "1 BHK"}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Occupancy Model:</span>
                                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563eb" }}>
                                                {residenceInfo.unit?.sharingType || "Family / Shared"}
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                                            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>Monthly Rent:</span>
                                            <strong style={{ fontSize: "1.2rem", color: "#2563eb" }}>
                                                ₹{(residenceInfo.unit?.rentAmount || 0).toLocaleString()}
                                            </strong>
                                        </div>

                                        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                onClick={() => navigate("/payments")}
                                            >
                                                Pay Rent Now
                                            </Button>
                                            <Button
                                                variant="outline"
                                                fullWidth
                                                onClick={() => navigate("/units")}
                                            >
                                                View Unit Details
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                {/* Co-Residents / Family occupants Card */}
                                <Card title="People in your Unit">
                                    <div style={{ marginTop: "8px" }}>
                                        {residenceInfo.coResidents && residenceInfo.coResidents.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                {residenceInfo.coResidents.map((person: any) => (
                                                    <div
                                                        key={person._id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            padding: "10px 12px",
                                                            borderRadius: "8px",
                                                            backgroundColor: "#f8fafc",
                                                            border: "1px solid #e2e8f0",
                                                        }}
                                                    >
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>
                                                                {person.name}
                                                            </div>
                                                            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                                                                {person.phone || person.email}
                                                            </div>
                                                        </div>
                                                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#ecfdf5", color: "#047857", fontWeight: 700 }}>
                                                            Occupant
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                                                No other co-residents assigned to your unit.
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <EmptyState
                                title="No Unit Assigned"
                                description="You have not been assigned to a property unit in this organization yet."
                            />
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default DashboardPage;