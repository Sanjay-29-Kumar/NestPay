import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { getOrganizationDetailsApi } from "@/features/organization/services/organizationApi";
import { getPropertiesApi } from "@/features/properties/services/propertiesApi";
import { getUnitsApi } from "@/features/units/services/unitsApi";
import { getCustomersApi } from "@/features/customers/services/customersApi";
import { getMembersApi } from "@/features/members/services/membersApi";
import { getDocumentsApi } from "@/features/documents/services/documentsApi";
import { getMyResidenceApi } from "@/features/customers/services/customersApi";

export function DashboardPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const orgId = activeMembership?.organizationId?._id;
    const role = activeMembership?.role || "MEMBER";

    const [loading, setLoading] = useState<boolean>(true);
    const [orgData, setOrgData] = useState<any>(null);
    const [propertyStats, setPropertyStats] = useState({ totalCount: 0, activeCount: 0 });
    const [unitStats, setUnitStats] = useState({ totalUnits: 0, occupiedUnits: 0, vacantUnits: 0 });
    const [customerStats, setCustomerStats] = useState({ totalCount: 0, activeCount: 0 });
    const [memberCount, setMemberCount] = useState<number>(0);
    const [documentCount, setDocumentCount] = useState<number>(0);
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

        const [orgRes, propRes, unitRes, custRes, memRes, docRes, resRes] = await Promise.all([
            getOrganizationDetailsApi(targetOrgId),
            getPropertiesApi(targetOrgId),
            getUnitsApi(targetOrgId),
            getCustomersApi(targetOrgId),
            getMembersApi(targetOrgId),
            getDocumentsApi(targetOrgId),
            getMyResidenceApi(targetOrgId),
        ]);

        if (orgRes.success && orgRes.data?.organization) setOrgData(orgRes.data.organization);
        if (propRes.success && propRes.data?.stats) setPropertyStats(propRes.data.stats);
        if (unitRes.success && unitRes.data?.stats) setUnitStats(unitRes.data.stats);
        if (custRes.success && custRes.data?.stats) setCustomerStats(custRes.data.stats);
        if (memRes.success && memRes.data) setMemberCount(memRes.data.length);
        if (docRes.success && docRes.data) setDocumentCount(docRes.data.totalDocs || 0);
        if (resRes.success && resRes.data) setResidenceInfo(resRes.data);

        setLoading(false);
    };

    // Calculate Setup Wizard Checklist Progress
    const isOrgProfileComplete = Boolean(orgData?.registrationNumber || orgData?.phone || orgData?.displayName);
    const isMyProfileComplete = Boolean(user?.phone || user?.address || user?.fullName);
    const isInviteMembersDone = memberCount > 1;
    const isAddPropertyDone = propertyStats.totalCount > 0;
    const isAddUnitDone = unitStats.totalUnits > 0;
    const isAddCustomerDone = customerStats.totalCount > 0;

    const checklist = [
        { label: "Complete Organization Profile", done: isOrgProfileComplete, link: "/organization" },
        { label: "Complete My Profile", done: isMyProfileComplete, link: "/profile" },
        { label: "Invite Workspace Members", done: isInviteMembersDone, link: "/members" },
        { label: "Add First Property", done: isAddPropertyDone, link: "/properties" },
        { label: "Add First Unit", done: isAddUnitDone, link: "/units" },
        { label: "Add First Customer", done: isAddCustomerDone, link: "/customers" },
    ];

    const completedStepsCount = checklist.filter((item) => item.done).length;
    const setupProgressPercent = Math.round((completedStepsCount / checklist.length) * 100);
    const isSetupFinished = setupProgressPercent === 100;

    if (!orgId) {
        return (
            <MainLayout>
                <EmptyState
                    title="No Workspace Selected"
                    description="Please select or create an organization workspace to access your dashboard."
                    actionLabel="Select Workspace"
                    onAction={() => (window.location.href = "/select-workspace")}
                />
            </MainLayout>
        );
    }

    if (loading) {
        return (
            <MainLayout>
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                    Loading workspace dashboard metrics...
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header Welcome Banner - Pure Light Theme */}
                <div
                    style={{
                        padding: "24px 28px",
                        borderRadius: "16px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e0e7ff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                        boxShadow: "0 4px 20px -2px rgba(99, 102, 241, 0.06)",
                    }}
                >
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" }}>
                                {orgData?.name || "Workspace Dashboard"}
                            </h1>
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    padding: "3px 10px",
                                    borderRadius: "20px",
                                    backgroundColor: "#eef2ff",
                                    color: "#4338ca",
                                    fontWeight: 700,
                                    border: "1px solid #c7d2fe",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                {role} ROLE
                            </span>
                        </div>
                        <p style={{ margin: "6px 0 0 0", color: "#64748b", fontSize: "0.95rem" }}>
                            Welcome back, <strong>{user?.name}</strong>. Enterprise workspace overview and live statistics.
                        </p>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <Link to="/organization" style={{ textDecoration: "none" }}>
                            <Button variant="outline">Organization Profile</Button>
                        </Link>
                        <Link to="/select-workspace" style={{ textDecoration: "none" }}>
                            <Button variant="primary">Switch Workspace</Button>
                        </Link>
                    </div>
                </div>

                {/* OWNER SETUP WIZARD (Visible if setup is incomplete for OWNER / ADMIN) */}
                {(role === "OWNER" || role === "ADMIN") && !isSetupFinished && (
                    <Card>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                                        Organization Setup Wizard
                                    </h3>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                        Complete these master data steps to set up your enterprise SaaS workspace.
                                    </p>
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#2563eb" }}>
                                    {setupProgressPercent}% Completed
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ height: "6px", width: "100%", backgroundColor: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${setupProgressPercent}%`,
                                        background: "linear-gradient(90deg, #4f46e5 0%, #2563eb 100%)",
                                        borderRadius: "10px",
                                        transition: "width 0.4s ease",
                                    }}
                                />
                            </div>

                            {/* Checklist Items Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginTop: "4px" }}>
                                {checklist.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.link}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            padding: "14px 16px",
                                            borderRadius: "12px",
                                            backgroundColor: item.done ? "#ecfdf5" : "#f8fafc",
                                            border: `1px solid ${item.done ? "#a7f3d0" : "#e2e8f0"}`,
                                            textDecoration: "none",
                                            fontSize: "0.88rem",
                                            fontWeight: 600,
                                            color: item.done ? "#047857" : "#334155",
                                            transition: "all 0.15s ease-in-out",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-flex",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                backgroundColor: item.done ? "#10b981" : "#e2e8f0",
                                                color: "#ffffff",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.75rem",
                                                fontWeight: 900,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {item.done ? "✓" : ""}
                                        </span>
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* OWNER DASHBOARD VIEW */}
                {role === "OWNER" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                            Master Overview Metrics
                        </h2>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Total Properties</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{propertyStats.totalCount}</div>
                                <Link to="/properties" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
                                    Manage Properties →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>Occupied Units</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>{unitStats.occupiedUnits}</div>
                                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Out of {unitStats.totalUnits} total units</span>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>Vacant Units</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>{unitStats.vacantUnits}</div>
                                <Link to="/units" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
                                    Manage Units →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: 600 }}>Active Customers</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0284c7", marginTop: "4px" }}>{customerStats.activeCount}</div>
                                <Link to="/customers" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
                                    Manage Customers →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#7c3aed", fontWeight: 600 }}>Workspace Members</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>{memberCount}</div>
                                <Link to="/members" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
                                    Manage Members →
                                </Link>
                            </Card>

                            <Card>
                                <div style={{ fontSize: "0.85rem", color: "#059669", fontWeight: 600 }}>Vault Documents</div>
                                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>{documentCount}</div>
                                <Link to="/documents" style={{ fontSize: "0.8rem", color: "#2563eb", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
                                    Document Vault →
                                </Link>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ADMIN DASHBOARD VIEW */}
                {role === "ADMIN" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                            Admin Workspace Overview
                        </h2>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                            <Card title="Properties" subtitle={`${propertyStats.totalCount} registered assets`}>
                                <Link to="/properties" style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>
                                    View Properties List →
                                </Link>
                            </Card>
                            <Card title="Units" subtitle={`${unitStats.vacantUnits} vacant, ${unitStats.occupiedUnits} occupied`}>
                                <Link to="/units" style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>
                                    View Units Directory →
                                </Link>
                            </Card>
                            <Card title="Customers" subtitle={`${customerStats.activeCount} active residents`}>
                                <Link to="/customers" style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>
                                    View Customers →
                                </Link>
                            </Card>
                            <Card title="Members" subtitle={`${memberCount} active workspace users`}>
                                <Link to="/members" style={{ fontSize: "0.85rem", color: "#2563eb", textDecoration: "none" }}>
                                    Manage Members →
                                </Link>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TENANT DASHBOARD VIEW */}
                {(role === "TENANT" || role === "MEMBER") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                            My Residence & Co-Living Details
                        </h2>

                        {residenceInfo?.assigned ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                                {/* Assigned Property & Unit Card */}
                                <Card title="Assigned Property & Unit" subtitle={`${residenceInfo.property?.name || "Property"} (${residenceInfo.property?.propertyType || ""})`}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
                                        <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#334155" }}>
                                            <div><strong>Property:</strong> {residenceInfo.property?.name} ({residenceInfo.property?.code})</div>
                                            <div style={{ marginTop: "4px" }}><strong>Location:</strong> {[residenceInfo.property?.address?.street, residenceInfo.property?.address?.city, residenceInfo.property?.address?.state].filter(Boolean).join(", ") || "Main Address"}</div>
                                        </div>

                                        <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.9rem", color: "#1e40af" }}>
                                            <div><strong>Unit Number:</strong> Unit {residenceInfo.unit?.unitNumber}</div>
                                            <div style={{ marginTop: "4px" }}><strong>Unit Category:</strong> {residenceInfo.unit?.unitType}</div>
                                            <div style={{ marginTop: "4px" }}><strong>Sharing Model:</strong> {residenceInfo.unit?.sharingType || "PRIVATE"} (Max Capacity: {residenceInfo.unit?.maxCapacity || 1})</div>
                                            <div style={{ marginTop: "4px" }}><strong>Monthly Rent:</strong> ${residenceInfo.unit?.rentAmount}/mo</div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Co-Residents / Roommates Card */}
                                <Card title="Co-Residents & Roommates" subtitle="Occupants sharing your unit or property">
                                    <div style={{ marginTop: "12px" }}>
                                        {!residenceInfo.allowVisibility ? (
                                            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                                                Co-resident directory is kept private by organization privacy policy.
                                            </p>
                                        ) : residenceInfo.coResidents && residenceInfo.coResidents.length > 0 ? (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                {residenceInfo.coResidents.map((r: any) => (
                                                    <div key={r._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{r.name}</div>
                                                            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{r.occupation || "Resident"} • {r.phone}</div>
                                                        </div>
                                                        <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f0fdf4", color: "#166534", fontWeight: 700 }}>
                                                            Active
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
                                                No other co-residents currently assigned to your unit.
                                            </p>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ) : (
                            <EmptyState
                                title="No Unit Assigned Yet"
                                description="Your organization manager has not assigned a property unit or line house to your user record yet."
                            />
                        )}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default DashboardPage;