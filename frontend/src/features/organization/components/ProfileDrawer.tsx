import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { updateUserProfileApi } from "../services/organizationApi";
import { setAuthenticatedUser } from "@/features/auth/store/authSlice";

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
    const [phone, setPhone] = useState(user?.phone || "");
    const [emergencyName, setEmergencyName] = useState(user?.emergencyContact?.name || "");
    const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContact?.phone || "");
    const [emergencyRel, setEmergencyRel] = useState(user?.emergencyContact?.relationship || "");

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const res = await updateUserProfileApi({
                fullName: fullName.trim(),
                phone: phone.trim(),
                emergencyContact: {
                    name: emergencyName.trim(),
                    phone: emergencyPhone.trim(),
                    relationship: emergencyRel.trim(),
                },
            });

            if (res.success && res.data) {
                dispatch(setAuthenticatedUser(res.data));
                setMessage({ type: "success", text: "Profile updated successfully!" });
                setIsEditing(false);
            } else {
                setMessage({ type: "error", text: res.message || "Failed to update profile." });
            }
        } catch (err: any) {
            setMessage({ type: "error", text: err.response?.data?.message || err.message || "Update failed." });
        } finally {
            setIsLoading(false);
        }
    };

    const initials = (user?.name || user?.email || "U").substring(0, 2).toUpperCase();

    return (
        <Drawer isOpen={isOpen} onClose={onClose} title="User Profile" subtitle="Manage your personal account & contact details">
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {message && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "0.875rem",
                            backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
                            color: message.type === "success" ? "#166534" : "#991b1b",
                            border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                    >
                        {message.text}
                    </div>
                )}

                {/* Profile Header Card */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        padding: "20px",
                        backgroundColor: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            borderRadius: "50%",
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            fontSize: "1.5rem",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            flexShrink: 0,
                        }}
                    >
                        {user?.photo ? (
                            <img src={user.photo} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            initials
                        )}
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                            {user?.fullName || user?.name || "NestPay User"}
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: "0.875rem", color: "#64748b" }}>{user?.email}</p>
                        <span
                            style={{
                                display: "inline-block",
                                marginTop: "6px",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                backgroundColor: user?.googleId ? "#e0f2fe" : "#f1f5f9",
                                color: user?.googleId ? "#0369a1" : "#475569",
                            }}
                        >
                            {user?.googleId ? "Google Account" : "Standard Account"}
                        </span>
                    </div>
                </div>

                {!isEditing ? (
                    /* Read-Only Details */
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
                            <h5 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Personal Information
                            </h5>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block" }}>Full Name</span>
                                    <strong style={{ color: "#0f172a" }}>{user?.fullName || user?.name || "Not set"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block" }}>Phone</span>
                                    <strong style={{ color: "#0f172a" }}>{user?.phone || "Not set"}</strong>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "16px", borderRadius: "10px", border: "1px solid #f1f5f9", backgroundColor: "#ffffff" }}>
                            <h5 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Emergency Contact
                            </h5>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.9rem" }}>
                                <div>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block" }}>Contact Name</span>
                                    <strong style={{ color: "#0f172a" }}>{user?.emergencyContact?.name || "Not set"}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block" }}>Contact Phone</span>
                                    <strong style={{ color: "#0f172a" }}>{user?.emergencyContact?.phone || "Not set"}</strong>
                                </div>
                                <div style={{ gridColumn: "span 2" }}>
                                    <span style={{ color: "#94a3b8", fontSize: "0.8rem", display: "block" }}>Relationship</span>
                                    <strong style={{ color: "#0f172a" }}>{user?.emergencyContact?.relationship || "Not set"}</strong>
                                </div>
                            </div>
                        </div>

                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            Edit Profile Details
                        </Button>
                    </div>
                ) : (
                    /* Edit Form */
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <h5 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                            Edit Personal & Emergency Info
                        </h5>

                        <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />

                        <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "8px 0" }} />

                        <h6 style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>
                            Emergency Contact Details
                        </h6>

                        <Input label="Contact Name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                        <Input label="Contact Phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                        <Input label="Relationship (e.g. Spouse, Parent)" value={emergencyRel} onChange={(e) => setEmergencyRel(e.target.value)} />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" isLoading={isLoading}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Drawer>
    );
};

export default ProfileDrawer;
