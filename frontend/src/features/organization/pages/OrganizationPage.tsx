import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Link } from "react-router-dom";

function OrganizationPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const org = activeMembership?.organizationId;

    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            Organization Settings
                        </h1>
                        <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                            Manage workspace profile and organization settings.
                        </p>
                    </div>

                    <Link to="/select-workspace" style={{ textDecoration: "none" }}>
                        <Button variant="outline">Switch Workspace</Button>
                    </Link>
                </div>

                {org ? (
                    <Card title={org.name} subtitle={`Slug: ${org.slug}`}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <strong>Status:</strong>{" "}
                                <span style={{ color: "#16a34a", fontWeight: 600 }}>{org.status}</span>
                            </div>
                            <div>
                                <strong>Your Role:</strong>{" "}
                                <span style={{ color: "#2563eb", fontWeight: 600 }}>{activeMembership?.role}</span>
                            </div>
                        </div>
                    </Card>
                ) : null}
            </div>
        </MainLayout>
    );
}

export default OrganizationPage;
