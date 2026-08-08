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
    getMembersApi,
    updateMemberRoleApi,
    updateMemberStatusApi,
    removeMemberApi,
    transferOwnershipApi,
    getPendingInvitationsApi,
    cancelInvitationApi,
    type WorkspaceMember,
    type PendingInvitation,
} from "../services/membersApi";
import { inviteUserApi } from "@/features/organization/services/organizationApi";

export function MembersPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const currentUserRole = activeMembership?.role;
    const isOwnerOrAdmin = currentUserRole === "OWNER" || currentUserRole === "ADMIN";

    const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [roleFilter, setRoleFilter] = useState<string>("");

    // Drawers & Dialog states
    const [inviteDrawerOpen, setInviteDrawerOpen] = useState<boolean>(false);
    const [editRoleDrawerOpen, setEditRoleDrawerOpen] = useState<boolean>(false);
    const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);

    // Form inputs
    const [inviteEmail, setInviteEmail] = useState<string>("");
    const [inviteRole, setInviteRole] = useState<string>("MEMBER");
    const [newRole, setNewRole] = useState<string>("MEMBER");
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (orgId) {
            fetchMembersData();
            fetchInvitationsData();
        } else {
            setLoading(false);
        }
    }, [orgId, roleFilter]);

    const fetchMembersData = async () => {
        if (!orgId) return;
        setLoading(true);
        const res = await getMembersApi(orgId, searchQuery, roleFilter);
        if (res.success && res.data) {
            setMembers(res.data);
        }
        setLoading(false);
    };

    const fetchInvitationsData = async () => {
        if (!orgId) return;
        const res = await getPendingInvitationsApi(orgId);
        if (res.success && res.data) {
            setInvitations(res.data);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchMembersData();
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !inviteEmail) return;

        setActionLoading(true);
        setFeedbackMsg(null);

        const res = await inviteUserApi(orgId, inviteEmail, inviteRole);
        setActionLoading(false);

        if (res.success) {
            setFeedbackMsg({ type: "success", message: `Invitation sent to ${inviteEmail}` });
            setInviteEmail("");
            setInviteDrawerOpen(false);
            fetchInvitationsData();
        } else {
            setFeedbackMsg({ type: "error", message: res.message || "Failed to send invitation" });
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !selectedMember) return;

        setActionLoading(true);
        const res = await updateMemberRoleApi(orgId, selectedMember._id, newRole);
        setActionLoading(false);

        if (res.success) {
            setFeedbackMsg({ type: "success", message: "Member role updated successfully." });
            setEditRoleDrawerOpen(false);
            fetchMembersData();
        } else {
            setFeedbackMsg({ type: "error", message: res.message || "Failed to update role" });
        }
    };

    const handleToggleStatus = async (member: WorkspaceMember) => {
        if (!orgId) return;
        const targetStatus = member.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
        const res = await updateMemberStatusApi(orgId, member._id, targetStatus);
        if (res.success) {
            setFeedbackMsg({ type: "success", message: `Member status updated to ${targetStatus}` });
            fetchMembersData();
        } else {
            setFeedbackMsg({ type: "error", message: res.message || "Failed to update status" });
        }
    };

    const handleRemoveMember = async (member: WorkspaceMember) => {
        if (!orgId) return;
        if (!window.confirm(`Are you sure you want to remove ${member.userId?.name || "this member"} from the workspace?`)) return;

        const res = await removeMemberApi(orgId, member._id);
        if (res.success) {
            setFeedbackMsg({ type: "success", message: "Member removed." });
            fetchMembersData();
        } else {
            setFeedbackMsg({ type: "error", message: res.message || "Failed to remove member" });
        }
    };

    const handleTransferOwnership = async (member: WorkspaceMember) => {
        if (!orgId) return;
        if (!window.confirm(`WARNING: Are you sure you want to transfer Organization Ownership to ${member.userId?.name}? You will be demoted to ADMIN.`)) return;

        const res = await transferOwnershipApi(orgId, member.userId._id);
        if (res.success) {
            setFeedbackMsg({ type: "success", message: "Ownership transferred successfully." });
            window.location.reload();
        } else {
            setFeedbackMsg({ type: "error", message: res.message || "Transfer failed." });
        }
    };

    const handleCancelInvite = async (invitationId: string) => {
        if (!orgId) return;
        const res = await cancelInvitationApi(orgId, invitationId);
        if (res.success) {
            setFeedbackMsg({ type: "success", message: "Invitation cancelled." });
            fetchInvitationsData();
        } else {
            setFeedbackMsg({ type: "error", message: res.message || "Failed to cancel invitation" });
        }
    };

    if (!orgId) {
        return (
            <MainLayout>
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Members" }]} />
                <EmptyState
                    title="No Active Workspace"
                    description="Please select an organization workspace to view and manage members."
                    actionLabel="Select Workspace"
                    onAction={() => window.location.href = "/select-workspace"}
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Members" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Workspace Members
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Manage user roles, invite team members, and manage access permissions.
                            </p>
                        </div>
                        {isOwnerOrAdmin && (
                            <Button variant="primary" onClick={() => setInviteDrawerOpen(true)}>
                                + Invite Member
                            </Button>
                        )}
                    </div>
                </div>

                {feedbackMsg && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            backgroundColor: feedbackMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                            color: feedbackMsg.type === "success" ? "#166534" : "#991b1b",
                            border: `1px solid ${feedbackMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                    >
                        {feedbackMsg.message}
                    </div>
                )}

                {/* Tabs & Search Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            onClick={() => setActiveTab("members")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "none",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                backgroundColor: activeTab === "members" ? "#2563eb" : "#f1f5f9",
                                color: activeTab === "members" ? "#ffffff" : "#475569",
                            }}
                        >
                            Active Members ({members.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("invitations")}
                            style={{
                                padding: "8px 16px",
                                borderRadius: "6px",
                                border: "none",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                backgroundColor: activeTab === "invitations" ? "#2563eb" : "#f1f5f9",
                                color: activeTab === "invitations" ? "#ffffff" : "#475569",
                            }}
                        >
                            Pending Invitations ({invitations.length})
                        </button>
                    </div>

                    {activeTab === "members" && (
                        <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.85rem",
                                    width: "220px",
                                }}
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <option value="">All Roles</option>
                                <option value="OWNER">Owner</option>
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ACCOUNTANT">Accountant</option>
                                <option value="STAFF">Staff</option>
                                <option value="TENANT">Tenant</option>
                                <option value="MEMBER">Member</option>
                            </select>
                            <Button variant="outline" type="submit">
                                Search
                            </Button>
                        </form>
                    )}
                </div>

                {/* Tab 1: Active Members */}
                {activeTab === "members" && (
                    <>
                        {loading ? (
                            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                                Loading workspace members...
                            </div>
                        ) : members.length === 0 ? (
                            <EmptyState
                                title="No Members Found"
                                description="No active members match your search query or filter selection."
                            />
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {members.map((member) => {
                                    const u = member.userId;
                                    const isTargetOwner = member.role === "OWNER";
                                    return (
                                        <Card key={member._id}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                    <div
                                                        style={{
                                                            width: "44px",
                                                            height: "44px",
                                                            borderRadius: "50%",
                                                            backgroundColor: "#2563eb",
                                                            color: "#ffffff",
                                                            fontWeight: 700,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "1.1rem",
                                                        }}
                                                    >
                                                        {u?.name ? u.name.charAt(0).toUpperCase() : "U"}
                                                    </div>
                                                    <div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <strong style={{ fontSize: "1rem", color: "#0f172a" }}>
                                                                {u?.fullName || u?.name || "User"}
                                                            </strong>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.75rem",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "4px",
                                                                    fontWeight: 600,
                                                                    backgroundColor: isTargetOwner ? "#fef3c7" : "#e0f2fe",
                                                                    color: isTargetOwner ? "#b45309" : "#0369a1",
                                                                }}
                                                            >
                                                                {member.role}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: "0.75rem",
                                                                    fontWeight: 600,
                                                                    color: member.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                                                                }}
                                                            >
                                                                • {member.status}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
                                                            {u?.email} {u?.phone ? `• ${u.phone}` : ""}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isOwnerOrAdmin && !isTargetOwner && (
                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedMember(member);
                                                                setNewRole(member.role);
                                                                setEditRoleDrawerOpen(true);
                                                            }}
                                                        >
                                                            Edit Role
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleToggleStatus(member)}
                                                        >
                                                            {member.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleRemoveMember(member)}
                                                        >
                                                            Remove
                                                        </Button>
                                                        {currentUserRole === "OWNER" && (
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => handleTransferOwnership(member)}
                                                            >
                                                                Transfer Ownership
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Tab 2: Pending Invitations */}
                {activeTab === "invitations" && (
                    <>
                        {invitations.length === 0 ? (
                            <EmptyState
                                title="No Pending Invitations"
                                description="There are currently no pending workspace invitations."
                                actionLabel={isOwnerOrAdmin ? "+ Send Invitation" : undefined}
                                onAction={isOwnerOrAdmin ? () => setInviteDrawerOpen(true) : undefined}
                            />
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {invitations.map((inv) => (
                                    <Card key={inv._id}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{inv.email}</strong>
                                                    <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f3e8ff", color: "#6b21a8", fontWeight: 600 }}>
                                                        {inv.role}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "4px" }}>
                                                    Invited by: {inv.invitedByUserId?.name || "Admin"} • Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            {isOwnerOrAdmin && (
                                                <Button variant="outline" onClick={() => handleCancelInvite(inv._id)}>
                                                    Cancel Invitation
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Drawer 1: Invite Member */}
                <Drawer
                    isOpen={inviteDrawerOpen}
                    onClose={() => setInviteDrawerOpen(false)}
                    title="Invite Workspace Member"
                    subtitle="Send an email invitation link with assigned workspace role."
                >
                    <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Input
                            label="Email Address *"
                            type="email"
                            placeholder="colleague@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Workspace Role *
                            </label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ACCOUNTANT">Accountant</option>
                                <option value="STAFF">Staff</option>
                                <option value="TENANT">Tenant</option>
                                <option value="MEMBER">Member</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setInviteDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={actionLoading}>
                                {actionLoading ? "Sending..." : "Send Invitation"}
                            </Button>
                        </div>
                    </form>
                </Drawer>

                {/* Drawer 2: Edit Role */}
                <Drawer
                    isOpen={editRoleDrawerOpen}
                    onClose={() => setEditRoleDrawerOpen(false)}
                    title="Edit Member Role"
                    subtitle={`Change assigned workspace role for ${selectedMember?.userId?.name}`}
                >
                    <form onSubmit={handleUpdateRole} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                New Workspace Role *
                            </label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ACCOUNTANT">Accountant</option>
                                <option value="STAFF">Staff</option>
                                <option value="TENANT">Tenant</option>
                                <option value="MEMBER">Member</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setEditRoleDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={actionLoading}>
                                {actionLoading ? "Updating..." : "Save Role"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default MembersPage;
