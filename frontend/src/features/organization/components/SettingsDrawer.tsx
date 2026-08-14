import React, { useState } from "react";
import { useDispatch } from "react-redux";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { logout } from "@/features/auth/store/authSlice";
import { clearOrganizationState } from "@/features/organization/store/organizationSlice";

interface SettingsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
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
        <Drawer isOpen={isOpen} onClose={onClose} title="Workspace Settings" subtitle="System preferences & account options">
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* 1. Theme Setting */}
                <div
                    style={{
                        padding: "16px 20px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                            Appearance Theme
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                            Switch between Light mode and Dark mode
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "20px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                            color: isDarkMode ? "#f8fafc" : "#0f172a",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
                    </button>
                </div>

                {/* 2. Account Actions */}
                <div
                    style={{
                        padding: "16px 20px",
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                        Account Actions
                    </h4>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <span style={{ fontSize: "0.9rem", color: "#334155", fontWeight: 500 }}>Sign Out</span>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>Log out of your current session</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* 3. Danger Zone */}
                <div
                    style={{
                        padding: "16px 20px",
                        backgroundColor: "#fef2f2",
                        borderRadius: "12px",
                        border: "1px solid #fecaca",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                    }}
                >
                    <div>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#991b1b" }}>
                            Danger Zone
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#b91c1c" }}>
                            Permanently delete your user account and all personal data.
                        </p>
                    </div>

                    {!showDeleteConfirm ? (
                        <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                            Delete Account
                        </Button>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#7f1d1d", fontWeight: 600 }}>
                                Type "DELETE" below to confirm account deletion:
                            </p>
                            <input
                                type="text"
                                placeholder='Type "DELETE"'
                                value={deleteInput}
                                onChange={(e) => setDeleteInput(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #fca5a5",
                                    fontSize: "0.9rem",
                                    outline: "none",
                                }}
                            />
                            <div style={{ display: "flex", gap: "8px" }}>
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
                                    Confirm Delete
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    );
};

export default SettingsDrawer;
