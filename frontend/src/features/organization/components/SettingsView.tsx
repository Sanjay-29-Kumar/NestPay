import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Button from "@/components/ui/Button";
import { logout } from "@/features/auth/store/authSlice";
import { clearOrganizationState } from "@/features/organization/store/organizationSlice";

export const SettingsView: React.FC = () => {
    const dispatch = useDispatch();

    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute("data-theme") === "dark"
    );
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const toggleTheme = () => {
        const nextTheme = isDarkMode ? "light" : "dark";
        setIsDarkMode(!isDarkMode);
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("theme", nextTheme);
    };

    const handleSignOut = () => {
        dispatch(logout());
        dispatch(clearOrganizationState());
    };

    const handleDeleteAccount = () => {
        if (deleteInput !== "DELETE") return;
        setIsDeleting(true);
        setTimeout(() => {
            setIsDeleting(false);
            dispatch(logout());
            dispatch(clearOrganizationState());
        }, 1200);
    };

    return (
        <div
            className="fade-in"
            style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "32px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
            }}
        >
            <div style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                    Workspace Settings
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                    Configure system preferences and manage account settings.
                </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* 1. Theme Preference */}
                <div
                    style={{
                        padding: "20px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                            Appearance Mode
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                            Switch between Light mode and Dark mode for your workspace.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        style={{
                            padding: "8px 18px",
                            borderRadius: "20px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                            color: isDarkMode ? "#f8fafc" : "#0f172a",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>
                </div>

                {/* 2. Session Actions */}
                <div
                    style={{
                        padding: "20px",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                            Direct Sign Out
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.875rem", color: "#64748b" }}>
                            Sign out of your active session safely.
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleSignOut}>
                        Sign Out
                    </Button>
                </div>

                {/* 3. Danger Zone */}
                <div
                    style={{
                        padding: "20px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "12px",
                        border: "1px solid #fecaca",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#991b1b" }}>
                            Danger Zone
                        </h3>
                        <p style={{ margin: "2px 0 0", fontSize: "0.875rem", color: "#b91c1c" }}>
                            Permanently delete your account and remove all personal information.
                        </p>
                    </div>

                    {!showDeleteConfirm ? (
                        <div>
                            <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                                Delete Account
                            </Button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "#7f1d1d", fontWeight: 600 }}>
                                Type "DELETE" below to confirm permanent deletion:
                            </p>
                            <input
                                type="text"
                                placeholder='Type "DELETE"'
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "8px",
                                    border: "1px solid #fca5a5",
                                    fontSize: "0.95rem",
                                    outline: "none",
                                    maxWidth: "320px",
                                }}
                            />
                            <div style={{ display: "flex", gap: "10px" }}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteInput("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    disabled={deleteInput !== "DELETE"}
                                    isLoading={isDeleting}
                                    onClick={handleDeleteAccount}
                                >
                                    Confirm Account Deletion
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsView;
