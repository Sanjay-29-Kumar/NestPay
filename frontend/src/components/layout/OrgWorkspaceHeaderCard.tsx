import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "@/store";
import { setActiveMembership } from "@/features/organization/store/organizationSlice";

export function OrgWorkspaceHeaderCard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { activeMembership, memberships } = useSelector((state: RootState) => state.organization);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (!activeMembership || !activeMembership.organizationId) {
        return null;
    }

    const org = activeMembership.organizationId;
    const role = activeMembership.role;

    // Generate 2-letter initials from org name (e.g. Main Corp HQ -> MH, ABC Apartments -> AA)
    const getInitials = (name: string) => {
        if (!name) return "NP";
        const words = name.trim().split(/\s+/);
        if (words.length >= 2) {
            return (words[0][0] + words[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(org.name);

    const handleSelectOrg = (m: any) => {
        dispatch(setActiveMembership(m));
        setDropdownOpen(false);
        // Refresh page or trigger workspace change
        window.location.href = "/dashboard";
    };

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <div
                onClick={() => setDropdownOpen((prev) => !prev)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 14px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    userSelect: "none",
                }}
            >
                {/* Initials Badge Box */}
                <div
                    style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "6px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: 800,
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        letterSpacing: "0.02em",
                        flexShrink: 0,
                    }}
                >
                    {initials}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0f172a" }}>
                            {org.name}
                        </span>
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#64748b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                            }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 500 }}>
                        Current Organization ({role})
                    </span>
                </div>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        width: "280px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                        zIndex: 50,
                        padding: "8px",
                    }}
                >
                    <div
                        style={{
                            padding: "6px 10px 8px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            borderBottom: "1px solid #f1f5f9",
                        }}
                    >
                        Switch Organization Workspace
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                        {memberships.map((m) => {
                            if (!m.organizationId) return null;
                            const isSelected = m._id === activeMembership._id;
                            const itemInitials = getInitials(m.organizationId.name);

                            const roleColor =
                                m.role === "OWNER"
                                    ? { bg: "#eef2ff", text: "#4338ca" }
                                    : m.role === "ADMIN"
                                    ? { bg: "#fff7ed", text: "#c2410c" }
                                    : { bg: "#ecfdf5", text: "#047857" };

                            return (
                                <div
                                    key={m._id}
                                    onClick={() => handleSelectOrg(m)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "8px 10px",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        backgroundColor: isSelected ? "#eff6ff" : "transparent",
                                        border: `1px solid ${isSelected ? "#bfdbfe" : "transparent"}`,
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div
                                            style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "4px",
                                                backgroundColor: isSelected ? "#2563eb" : "#e2e8f0",
                                                color: isSelected ? "#ffffff" : "#334155",
                                                fontWeight: 700,
                                                fontSize: "0.75rem",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {itemInitials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0f172a" }}>
                                                {m.organizationId.name}
                                            </div>
                                        </div>
                                    </div>

                                    <span
                                        style={{
                                            fontSize: "0.68rem",
                                            fontWeight: 700,
                                            padding: "2px 6px",
                                            borderRadius: "10px",
                                            backgroundColor: roleColor.bg,
                                            color: roleColor.text,
                                        }}
                                    >
                                        {m.role}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div
                        onClick={() => navigate("/select-workspace")}
                        style={{
                            marginTop: "8px",
                            padding: "8px",
                            textAlign: "center",
                            borderTop: "1px solid #f1f5f9",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#2563eb",
                            cursor: "pointer",
                        }}
                    >
                        View All Workspaces →
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrgWorkspaceHeaderCard;
