import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getUserMembershipsApi, type Membership } from "../services/organizationApi";
import { setMemberships, setActiveMembership } from "../store/organizationSlice";
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
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "520px" }}
                title="Select Workspace"
                subtitle="Choose an organization to manage"
            >
                {isLoading && (
                    <div style={{ padding: "20px 0", textAlign: "center" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>⏳</div>
                        <p style={{ color: "#64748b" }}>Loading your workspaces...</p>
                    </div>
                )}

                {!isLoading && memberships.length === 0 && (
                    <div style={{ textAlign: "center", padding: "20px 0" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏢</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>No Workspace Found</h3>
                        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "0.9rem" }}>
                            You do not belong to any organization yet. Create one to get started!
                        </p>
                        <Link to="/create-organization" style={{ textDecoration: "none" }}>
                            <Button variant="primary" fullWidth>
                                Create First Organization
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
                                        return { bg: "#dbeafe", color: "#1e40af", label: "Owner" };
                                    case "ADMIN":
                                        return { bg: "#fef3c7", color: "#92400e", label: "Admin" };
                                    case "TENANT":
                                        return { bg: "#dcfce7", color: "#166534", label: "Tenant" };
                                    default:
                                        return { bg: "#f1f5f9", color: "#475569", label: role };
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
                                        padding: "16px",
                                        borderRadius: "10px",
                                        border: "1px solid #e2e8f0",
                                        backgroundColor: "#f8fafc",
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1rem" }}>{org.name}</h4>
                                            <span
                                                style={{
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    padding: "2px 8px",
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
                                            Slug: {org.slug}
                                        </p>
                                    </div>

                                    <Button
                                        variant="primary"
                                        style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                                        onClick={() => handleSelectWorkspace(membership)}
                                    >
                                        Enter Workspace
                                    </Button>
                                </div>
                            );
                        })}

                        <div style={{ marginTop: "12px", textAlign: "center" }}>
                            <Link to="/create-organization" style={{ textDecoration: "none" }}>
                                <Button variant="outline" fullWidth>
                                    + Create Another Organization
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default SelectWorkspacePage;
