import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { logout } from "@/features/auth/store/authSlice";
import api from "@/services/api";

export function SettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state: RootState) => state.auth);
  const { activeMembership } = useSelector((state: RootState) => state.organization);
  const orgId = activeMembership?.organizationId?._id;
  const orgName = activeMembership?.organizationId?.name || "Active Workspace";


  // Dark / Light Mode state
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme_mode") as "light" | "dark") || "light";
  });

  // Mobile & Emergency Contact state
  const [phone, setPhone] = useState(user?.phone || "");
  const [emergencyContact, setEmergencyContact] = useState((user as any)?.emergencyContact || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  const toggleTheme = (mode: "light" | "dark") => {
    setThemeMode(mode);
    localStorage.setItem("theme_mode", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark-mode");
      document.body.style.backgroundColor = "#0f172a";
      document.body.style.color = "#f8fafc";
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.style.backgroundColor = "#f8fafc";
      document.body.style.color = "#0f172a";
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setProfileMsg("");
    try {
      await api.put("/auth/me", { phone, emergencyContact });
      setProfileMsg("Contact details updated successfully across the platform.");
    } catch (err: any) {
      setProfileMsg(err.response?.data?.message || "Failed updating contact details.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleDeleteSelfFromOrg = async () => {
    if (!orgId) return;
    if (!confirm(`Are you sure you want to remove yourself from ${orgName}?`)) return;

    try {
      await api.delete(`/organizations/${orgId}/members/me`);
      alert("You have left the organization.");
      navigate("/select-workspace");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed removing yourself from organization.");
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <MainLayout>
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px" }}>
        {/* Title */}
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Account & Workspace Settings
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
            Manage theme preferences, update contact info, or leave workspace
          </p>
        </div>

        {/* 1. Theme Toggle */}
        <Card style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
            🎨 Appearance Theme
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "16px" }}>
            Choose your preferred display mode for NestPay
          </p>

          <div style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={() => toggleTheme("light")}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                border: themeMode === "light" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                backgroundColor: themeMode === "light" ? "#eff6ff" : "#ffffff",
                color: themeMode === "light" ? "#2563eb" : "#475569",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              ☀️ Light Mode
            </button>

            <button
              onClick={() => toggleTheme("dark")}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                border: themeMode === "dark" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                backgroundColor: themeMode === "dark" ? "#1e293b" : "#ffffff",
                color: themeMode === "dark" ? "#60a5fa" : "#475569",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              🌙 Dark Mode
            </button>
          </div>
        </Card>

        {/* 2. Contact Details & Link to Profile */}
        <Card style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                📱 Mobile & Emergency Contact Details
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "4px 0 0 0" }}>
                Changes to mobile number or emergency contact propagate everywhere in units and user lists
              </p>
            </div>
            <Link to="/profile" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563eb", textDecoration: "none" }}>
              View Full Profile →
            </Link>
          </div>

          {profileMsg && (
            <div style={{ padding: "10px 14px", backgroundColor: "#f0fdf4", borderLeft: "4px solid #16a34a", borderRadius: "8px", color: "#166534", fontSize: "0.875rem", marginBottom: "16px" }}>
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateContact} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                Mobile Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: '6px' }}>
                Emergency Contact Number
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 9123456789 (Family / Guardian)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="submit" variant="primary" disabled={updatingProfile}>
                {updatingProfile ? "Updating..." : "Save Contact Info"}
              </Button>
            </div>
          </form>
        </Card>

        {/* 3. Delete Self from Organization & Sign Out */}
        <Card style={{ padding: "24px", border: "1px solid #fecdd3", backgroundColor: "#fff1f2" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#9f1239", marginBottom: "8px" }}>
            ⚠️ Danger Zone
          </h2>
          <p style={{ fontSize: "0.85rem", color: "#881337", marginBottom: "16px" }}>
            Manage workspace membership and session sign out
          </p>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <button
              onClick={handleDeleteSelfFromOrg}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#be123c",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Delete Myself from Organization ({orgName})
            </button>

            <button
              onClick={handleSignOut}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

export default SettingsPage;
