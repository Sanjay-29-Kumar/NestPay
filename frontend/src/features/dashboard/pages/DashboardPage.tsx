import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { inviteUserApi } from "@/features/organization/services/organizationApi";

function DashboardPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<"ADMIN" | "TENANT" | "MEMBER">("TENANT");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState("");
    const [inviteError, setInviteError] = useState("");

    const role = activeMembership?.role || "MEMBER";
    const org = activeMembership?.organizationId;

    async function handleSendInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!org?._id || !inviteEmail) return;

        setIsInviting(true);
        setInviteSuccess("");
        setInviteError("");

        const result = await inviteUserApi(org._id, inviteEmail, inviteRole);
        setIsInviting(false);

        if (result.success) {
            setInviteSuccess(result.message || `Invitation sent to ${inviteEmail}!`);
            setInviteEmail("");
        } else {
            setInviteError(result.message || "Failed to send invitation");
        }
    }

    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header Banner */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "24px",
                        borderRadius: "12px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                            {org?.name || "Workspace Dashboard"}
                        </h1>
                        <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "0.9rem" }}>
                            Welcome back, <strong>{user?.name}</strong>. Logged in as{" "}
                            <span style={{ fontWeight: 700, color: "#2563eb" }}>{role}</span>.
                        </p>
                    </div>

                    {(role === "OWNER" || role === "ADMIN") && (
                        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
                            + Invite Member
                        </Button>
                    )}
                </div>

                {/* Invite Modal */}
                {showInviteModal && (
                    <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, color: "#0f172a" }}>Invite Member to {org?.name}</h3>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>✖</button>
                        </div>

                        {inviteSuccess ? (
                            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(22, 163, 74, 0.1)", border: "1px solid #16a34a", color: "#15803d", marginBottom: "16px" }}>
                                ✅ {inviteSuccess}
                            </div>
                        ) : null}

                        {inviteError ? (
                            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(220, 38, 38, 0.1)", border: "1px solid #dc2626", color: "#dc2626", marginBottom: "16px" }}>
                                ⚠️ {inviteError}
                            </div>
                        ) : null}

                        <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <Input
                                label="Member Email"
                                type="email"
                                placeholder="tenant@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                required
                            />

                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                                    Assign Role
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "TENANT" | "MEMBER")}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.9rem",
                                        backgroundColor: "#ffffff",
                                    }}
                                >
                                    <option value="TENANT">Tenant</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MEMBER">Member</option>
                                </select>
                            </div>

                            <Button type="submit" variant="primary" isLoading={isInviting}>
                                Send Invitation Link
                            </Button>
                        </form>
                    </div>
                )}

                {/* OWNER DASHBOARD VIEW */}
                {role === "OWNER" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                        <Card title="Revenue & Finances" subtitle="Overview of income and pending rent">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No transactions logged yet.</p>
                        </Card>
                        <Card title="Pending Payments" subtitle="Awaiting tenant payment approvals">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No pending payment requests.</p>
                        </Card>
                        <Card title="Expense Tracker" subtitle="Operating costs and maintenance">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No expenses recorded.</p>
                        </Card>
                    </div>
                )}

                {/* ADMIN DASHBOARD VIEW */}
                {role === "ADMIN" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                        <Card title="Customers & Tenants" subtitle="Manage tenant directory">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No active tenants added.</p>
                        </Card>
                        <Card title="Invoices" subtitle="Issued invoices and billing status">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No active invoices.</p>
                        </Card>
                        <Card title="Payments" subtitle="Payment verification queue">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No pending approvals.</p>
                        </Card>
                    </div>
                )}

                {/* TENANT DASHBOARD VIEW */}
                {role === "TENANT" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                        <Card title="Rent Payment" subtitle="Pay monthly rent and utility bills">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No due bills for current period.</p>
                        </Card>
                        <Card title="Payment History" subtitle="View receipts and invoices">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No past payments recorded.</p>
                        </Card>
                        <Card title="Maintenance & Support" subtitle="Submit maintenance requests">
                            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>No open support tickets.</p>
                        </Card>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default DashboardPage;