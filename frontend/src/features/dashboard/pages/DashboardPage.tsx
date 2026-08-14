import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import {
    setMemberships,
    setCurrentOrgId,
    setOrganizationLoading,
} from "@/features/organization/store/organizationSlice";
import { getUserMembershipsApi } from "@/features/organization/services/organizationApi";

export const DashboardPage: React.FC = () => {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user } = useSelector((state: RootState) => state.auth);
    const { memberships, isLoading } = useSelector((state: RootState) => state.organization);

    useEffect(() => {
        if (orgId) {
            dispatch(setCurrentOrgId(orgId));
        }

        if (memberships.length === 0) {
            loadMemberships();
        }
    }, [orgId, memberships.length, dispatch]);

    const loadMemberships = async () => {
        dispatch(setOrganizationLoading(true));
        try {
            const res = await getUserMembershipsApi();
            if (res.success && res.data) {
                dispatch(setMemberships(res.data));
            }
        } catch {
            // handle error silently
        } finally {
            dispatch(setOrganizationLoading(false));
        }
    };

    // Find current active organization
    const activeMembership = memberships.find((m) => {
        const org = typeof m.organizationId === "object" ? m.organizationId : null;
        return org?._id === orgId;
    });

    const activeOrg = typeof activeMembership?.organizationId === "object"
        ? activeMembership.organizationId
        : null;

    const orgName = activeOrg?.name || "Organization Workspace";
    const orgType = activeOrg?.organizationType
        ? activeOrg.organizationType.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "Workspace";

    // User initials helper
    const getInitials = (name?: string, email?: string) => {
        if (name && name.trim()) {
            const parts = name.trim().split(" ");
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return parts[0].substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return "NP";
    };

    const initials = getInitials(user?.name || user?.fullName || user?.displayName, user?.email);
    const userPhoto = user?.photo;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
            {/* Organization Dashboard Navbar */}
            <header
                style={{
                    height: "64px",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 28px",
                    position: "sticky",
                    top: 0,
                    zIndex: 40,
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
                }}
            >
                {/* Left: NestPay Branding + Organization Name */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                        style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", cursor: "pointer" }}
                        onClick={() => navigate("/workspace")}
                        title="Back to Workspace Selection"
                    >
                        <span style={{ color: "#0f172a" }}>Nest</span>
                        <span style={{ color: "#4f46e5" }}>Pay</span>
                    </div>

                    <span style={{ color: "#cbd5e1", fontSize: "1.2rem", fontWeight: 300 }}>/</span>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                            {isLoading && !activeOrg ? "Loading..." : orgName}
                        </h2>
                        {activeOrg && (
                            <span
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    backgroundColor: "#eef2ff",
                                    color: "#4f46e5",
                                    padding: "2px 8px",
                                    borderRadius: "9999px",
                                }}
                            >
                                {orgType}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right: Back to Workspace Link + Profile Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <button
                        type="button"
                        onClick={() => navigate("/workspace")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#64748b",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f1f5f9";
                            e.currentTarget.style.color = "#0f172a";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#64748b";
                        }}
                    >
                        &larr; Switch Workspace
                    </button>

                    {/* Profile Avatar Icon */}
                    <button
                        type="button"
                        onClick={() => navigate("/workspace")}
                        title={user?.name || user?.email || "Account Profile"}
                        style={{
                            background: "none",
                            border: "2px solid #e2e8f0",
                            borderRadius: "50%",
                            padding: 0,
                            cursor: "pointer",
                            outline: "none",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            width: "40px",
                            height: "40px",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#4f46e5";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        {userPhoto ? (
                            <img
                                src={userPhoto}
                                alt={user?.name || "User Avatar"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "#4f46e5",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {initials}
                            </div>
                        )}
                    </button>
                </div>
            </header>

            {/* Blank Placeholder Content Area */}
            <main style={{ flex: 1, padding: "40px 32px" }}>
                <div style={{ maxWidth: "1000px", margin: "0 auto" }} className="fade-in">
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "16px",
                            padding: "48px 32px",
                            textAlign: "center",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
                        }}
                    >
                        <div
                            style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "16px",
                                backgroundColor: "#eef2ff",
                                color: "#4f46e5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "2rem",
                                margin: "0 auto 20px",
                            }}
                        >
                            🏢
                        </div>

                        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
                            Welcome to {isLoading && !activeOrg ? "Organization" : orgName}
                        </h1>

                        <p style={{ fontSize: "1rem", color: "#64748b", maxWidth: "520px", margin: "0 auto 24px", lineHeight: 1.6 }}>
                            This is the Organization Dashboard shell. The upcoming modules (Units, Tenants, Payments, and Invoices) will be loaded here.
                        </p>

                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                fontSize: "0.875rem",
                                color: "#475569",
                                fontWeight: 500,
                            }}
                        >
                            <span>📌 Organization ID:</span>
                            <code style={{ color: "#4f46e5", fontWeight: 600 }}>{orgId || "N/A"}</code>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
