import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getUserMembershipsApi, type Membership } from "../services/organizationApi";
import { setMemberships, setActiveMembership } from "../store/organizationSlice";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function SelectWorkspacePage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { memberships } = useSelector((state: RootState) => state.organization);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchMemberships() {
            const result = await getUserMembershipsApi();
            setIsLoading(false);
            if (result.success && result.data) {
                dispatch(setMemberships(result.data));
            }
        }

        fetchMemberships();
    }, [dispatch]);

    const handleSelectWorkspace = (membership: Membership) => {
        dispatch(setActiveMembership(membership));
        navigate("/dashboard");
    };

    return (
        <MainLayout title="NESTPAY Workspace" subtitle="Please select an organization workspace">
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
                <Card
                    style={{ width: "100%", maxWidth: "600px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)" }}
                    title="Select Workspace"
                    subtitle="Choose an organization workspace to manage or view"
                >
                    {isLoading && (
                        <div style={{ padding: "30px 0", textAlign: "center" }}>
                            <p style={{ color: "#64748b" }}>Loading your organization memberships...</p>
                        </div>
                    )}

                    {!isLoading && memberships.length === 0 && (
                        <div style={{ textAlign: "center", padding: "24px 0" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏢</div>
                            <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>No Organizations Found</h3>
                            <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.9rem" }}>
                                You do not belong to any organization yet. Create your first property organization to get started!
                            </p>
                            <Link to="/create-organization" style={{ textDecoration: "none" }}>
                                <Button variant="primary" fullWidth>
                                    + Create Organization
                                </Button>
                            </Link>
                        </div>
                    )}

                    {!isLoading && memberships.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {memberships.map((membership) => {
                                const org = membership.organizationId;
                                if (!org) return null;

                                const getRoleBadgeStyle = (role: string) => {
                                    switch (role) {
                                        case "OWNER":
                                            return { bg: "#eef2ff", color: "#4338ca", border: "#c7d2fe", label: "OWNER" };
                                        case "ADMIN":
                                            return { bg: "#fff7ed", color: "#c2410c", border: "#ffedd5", label: "ADMIN" };
                                        case "TENANT":
                                            return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", label: "TENANT" };
                                        default:
                                            return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1", label: role };
                                    }
                                };

                                const badge = getRoleBadgeStyle(membership.role);

                                return (
                                    <div
                                        key={membership._id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "16px 18px",
                                            borderRadius: "12px",
                                            border: "1px solid #cbd5e1",
                                            backgroundColor: "#ffffff",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                                            transition: "all 0.15s ease",
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.05rem", fontWeight: 800 }}>
                                                    {org.name}
                                                </h4>
                                                <span
                                                    style={{
                                                        backgroundColor: badge.bg,
                                                        color: badge.color,
                                                        border: `1px solid ${badge.border}`,
                                                        fontSize: "0.72rem",
                                                        fontWeight: 800,
                                                        padding: "2px 8px",
                                                        borderRadius: "12px",
                                                        letterSpacing: "0.03em",
                                                    }}
                                                >
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                                                Code: {org.slug} {org.city ? `• ${org.city}` : ""}
                                            </p>
                                        </div>

                                        <Button
                                            variant="primary"
                                            style={{ padding: "8px 16px", fontSize: "0.85rem", fontWeight: 700 }}
                                            onClick={() => handleSelectWorkspace(membership)}
                                        >
                                            Open Workspace
                                        </Button>
                                    </div>
                                );
                            })}

                            <div style={{ marginTop: "16px", textAlign: "center" }}>
                                <Link to="/create-organization" style={{ textDecoration: "none" }}>
                                    <Button variant="outline" fullWidth>
                                        + Create New Organization
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
}

export default SelectWorkspacePage;
