import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Drawer from "@/components/ui/Drawer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { updateProfileApi, getBuildingTenantsApi } from "../services/authApi";
import { setAuthenticatedUser } from "../store/authSlice";

export function MyProfilePage() {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;

    const [saving, setSaving] = useState<boolean>(false);
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [successMsg, setSuccessMsg] = useState<string>("");
    const [buildingTenants, setBuildingTenants] = useState<any[]>([]);
    const [loadingTenants, setLoadingTenants] = useState<boolean>(false);

    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || user.name || "",
                displayName: user.displayName || user.name || "",
                photo: user.photo || "",
                gender: user.gender || "PREFER_NOT_TO_SAY",
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
                phone: user.phone || "",
                alternatePhone: user.alternatePhone || "",
                emergencyContact: {
                    name: user.emergencyContact?.name || "",
                    phone: user.emergencyContact?.phone || "",
                    relationship: user.emergencyContact?.relationship || "",
                },
                address: user.address || "",
                country: user.country || "",
                state: user.state || "",
                city: user.city || "",
                postalCode: user.postalCode || "",
                preferredLanguage: user.preferredLanguage || "en",
                theme: user.theme || "SYSTEM",
                timezone: user.timezone || "UTC",
            });
        }
    }, [user]);

    useEffect(() => {
        async function fetchTenants() {
            setLoadingTenants(true);
            const res = await getBuildingTenantsApi(orgId);
            if (res.success && Array.isArray(res.data)) {
                setBuildingTenants(res.data);
            }
            setLoadingTenants(false);
        }
        fetchTenants();
    }, [orgId]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith("emergencyContact.")) {
            const field = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                emergencyContact: {
                    ...(prev.emergencyContact || {}),
                    [field]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        const res = await updateProfileApi(formData);
        setSaving(false);

        if (res.success && res.data) {
            dispatch(setAuthenticatedUser(res.data));
            setSuccessMsg("Profile updated successfully.");
            setDrawerOpen(false);
        } else {
            setErrorMsg(res.message || "Failed to update profile.");
        }
    };

    const completion = user?.profileCompletionPercentage || 10;
    const hasHistory = (user?.previousNames && user.previousNames.length > 0) || (user?.previousPhones && user.previousPhones.length > 0);

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Page Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "My Profile" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                User Profile Master Data
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Personal information, emergency contacts, profile history, and building directory.
                            </p>
                        </div>
                        <Button variant="primary" onClick={() => setDrawerOpen(true)}>
                            Edit My Profile
                        </Button>
                    </div>
                </div>

                {successMsg && (
                    <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", color: "#166534", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                        {successMsg}
                    </div>
                )}

                {/* Profile Completion Indicator */}
                <Card title="Profile Completion Status" subtitle="Completing your profile ensures seamless account verification and workspace access.">
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600 }}>
                            <span style={{ color: "#334155" }}>Profile Progress</span>
                            <span style={{ color: completion >= 80 ? "#16a34a" : "#d97706" }}>{completion}%</span>
                        </div>
                        <div style={{ height: "10px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                            <div
                                style={{
                                    height: "100%",
                                    width: `${completion}%`,
                                    backgroundColor: completion >= 80 ? "#16a34a" : "#2563eb",
                                    transition: "width 0.4s ease",
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {/* Profile Grid Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                    {/* Basic Info */}
                    <Card title="Personal Details" subtitle="Full name, email, and identity">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>Full Name: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.fullName || user?.name || "-"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Display Name: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.displayName || user?.name || "-"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Official Email: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.email}</strong>
                                <span style={{ marginLeft: "8px", fontSize: "0.75rem", backgroundColor: "#e2e8f0", color: "#475569", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>Read-Only</span>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Gender: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.gender || "PREFER_NOT_TO_SAY"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Date of Birth: </span>
                                <strong style={{ color: "#0f172a" }}>
                                    {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "-"}
                                </strong>
                            </div>
                        </div>
                    </Card>

                    {/* Contact Info */}
                    <Card title="Contact Numbers" subtitle="Phone numbers for communications & SMS">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>Primary Phone: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.phone || "-"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Alternate Phone: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.alternatePhone || "-"}</strong>
                            </div>
                        </div>
                    </Card>

                    {/* Emergency Contact */}
                    <Card title="Emergency Contact" subtitle="Primary emergency contact details">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>Contact Name: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.emergencyContact?.name || "-"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Contact Phone: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.emergencyContact?.phone || "-"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Relationship: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.emergencyContact?.relationship || "-"}</strong>
                            </div>
                        </div>
                    </Card>

                    {/* Residential Address */}
                    <Card title="Residential Address" subtitle="Home address information">
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                            <div>
                                <span style={{ color: "#64748b" }}>Street Address: </span>
                                <strong style={{ color: "#0f172a" }}>{user?.address || "-"}</strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>City / State: </span>
                                <strong style={{ color: "#0f172a" }}>
                                    {[user?.city, user?.state].filter(Boolean).join(", ") || "-"}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: "#64748b" }}>Country & Postal: </span>
                                <strong style={{ color: "#0f172a" }}>
                                    {[user?.country, user?.postalCode].filter(Boolean).join(" - ") || "-"}
                                </strong>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Name & Phone Change History Card */}
                {hasHistory && (
                    <Card title="Name & Mobile Number Change History" subtitle="Audit history of previously used names and primary phone numbers">
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                            {user?.previousNames && user.previousNames.length > 0 && (
                                <div>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#475569" }}>Previous Names</h4>
                                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155", fontSize: "0.88rem" }}>
                                        {user.previousNames.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: "4px" }}>
                                                <strong>{item.name}</strong> <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>({new Date(item.updatedAt).toLocaleDateString()})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {user?.previousPhones && user.previousPhones.length > 0 && (
                                <div>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#475569" }}>Previous Mobile Numbers</h4>
                                    <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155", fontSize: "0.88rem" }}>
                                        {user.previousPhones.map((item, idx) => (
                                            <li key={idx} style={{ marginBottom: "4px" }}>
                                                <strong>{item.phone}</strong> <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>({new Date(item.updatedAt).toLocaleDateString()})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Building / Property Co-Tenants Directory */}
                <Card title="Building Tenants & Co-Occupants Directory" subtitle="Existing occupants and tenants of the same property / building workspace">
                    {loadingTenants ? (
                        <p style={{ color: "#64748b", margin: 0 }}>Loading building tenants directory...</p>
                    ) : buildingTenants.length === 0 ? (
                        <p style={{ color: "#94a3b8", margin: 0 }}>No other active tenants found in this building.</p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #e2e8f0", color: "#475569" }}>
                                        <th style={{ padding: "10px" }}>Tenant Name</th>
                                        <th style={{ padding: "10px" }}>Mobile Number</th>
                                        <th style={{ padding: "10px" }}>Email</th>
                                        <th style={{ padding: "10px" }}>Property</th>
                                        <th style={{ padding: "10px" }}>Unit Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buildingTenants.map((t) => (
                                        <tr key={t._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "10px", fontWeight: 600, color: "#0f172a" }}>{t.name}</td>
                                            <td style={{ padding: "10px", color: "#334155" }}>{t.phone || "-"}</td>
                                            <td style={{ padding: "10px", color: "#64748b" }}>{t.email}</td>
                                            <td style={{ padding: "10px", color: "#334155" }}>{t.propertyId?.name || "-"}</td>
                                            <td style={{ padding: "10px", fontWeight: 700, color: "#2563eb" }}>{t.unitId?.unitNumber || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Edit Profile Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title="Complete / Edit My Profile"
                    subtitle="Update personal information, emergency contact, and location."
                >
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {errorMsg && (
                            <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "6px", fontSize: "0.85rem" }}>
                                {errorMsg}
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
                                Official Email Address (Immutable)
                            </label>
                            <input
                                type="text"
                                value={user?.email || ""}
                                disabled
                                style={{
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    backgroundColor: "#f1f5f9",
                                    color: "#64748b",
                                    fontSize: "0.9rem",
                                    cursor: "not-allowed",
                                }}
                            />
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                Official email address cannot be changed.
                            </span>
                        </div>

                        <Input
                            label="Full Name"
                            name="fullName"
                            value={formData.fullName || ""}
                            onChange={handleFormChange}
                        />

                        <Input
                            label="Display Name"
                            name="displayName"
                            value={formData.displayName || ""}
                            onChange={handleFormChange}
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={formData.gender || "PREFER_NOT_TO_SAY"}
                                onChange={handleFormChange}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="PREFER_NOT_TO_SAY">Prefer Not To Say</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <Input
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth || ""}
                            onChange={handleFormChange}
                        />

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <Input
                                label="Primary Phone"
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleFormChange}
                            />
                            <Input
                                label="Alternate Phone"
                                name="alternatePhone"
                                value={formData.alternatePhone || ""}
                                onChange={handleFormChange}
                            />
                        </div>

                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a" }}>
                                Emergency Contact Information
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <Input
                                    label="Contact Full Name"
                                    name="emergencyContact.name"
                                    value={formData.emergencyContact?.name || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="Contact Phone Number"
                                    name="emergencyContact.phone"
                                    value={formData.emergencyContact?.phone || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="Relationship"
                                    name="emergencyContact.relationship"
                                    value={formData.emergencyContact?.relationship || ""}
                                    onChange={handleFormChange}
                                    placeholder="e.g. Spouse, Parent, Sibling"
                                />
                            </div>
                        </div>

                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "4px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem", color: "#0f172a" }}>
                                Address Information
                            </h4>
                            <Input
                                label="Street Address"
                                name="address"
                                value={formData.address || ""}
                                onChange={handleFormChange}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <Input
                                    label="City"
                                    name="city"
                                    value={formData.city || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="State"
                                    name="state"
                                    value={formData.state || ""}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                                <Input
                                    label="Country"
                                    name="country"
                                    value={formData.country || ""}
                                    onChange={handleFormChange}
                                />
                                <Input
                                    label="Postal Code"
                                    name="postalCode"
                                    value={formData.postalCode || ""}
                                    onChange={handleFormChange}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Profile"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default MyProfilePage;

