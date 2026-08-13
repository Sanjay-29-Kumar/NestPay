import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import api from "@/services/api";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  emergencyContact?: string;
  roleInUnit?: string;
}

interface UnitWithUsers {
  _id: string;
  unitNumber: string;
  floor?: number;
  configuration?: string;
  status: "VACANT" | "OCCUPIED" | "UNDER_MAINTENANCE";
  propertyName?: string;
  primaryTenantName?: string;
  primaryTenantPhone?: string;
  primaryTenantEmergencyContact?: string;
  users: UserItem[];
}

export function UsersPage() {
  const { activeMembership } = useSelector((state: RootState) => state.organization);

  const orgId = activeMembership?.organizationId?._id;
  const userRole = activeMembership?.role || "MEMBER";
  const isOwner = userRole === "OWNER";
  const isAdmin = userRole === "ADMIN";
  const isOwnerOrAdmin = isOwner || isAdmin;

  const [unitsWithUsers, setUnitsWithUsers] = useState<UnitWithUsers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [selectedUserModal, setSelectedUserModal] = useState<UserItem | null>(null);

  useEffect(() => {
    if (orgId) {
      fetchUsersGroupedByUnit();
    } else {
      setLoading(false);
    }
  }, [orgId]);

  const fetchUsersGroupedByUnit = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [unitsRes] = await Promise.all([
        api.get(`/organizations/${orgId}/units`),
        api.get(`/organizations/${orgId}/members`),
      ]);

      const rawUnits = unitsRes.data?.units || unitsRes.data?.data?.units || unitsRes.data?.data || [];

      const grouped: UnitWithUsers[] = rawUnits.map((unit: any) => {
        const occupants: UserItem[] = Array.isArray(unit.occupants)
          ? unit.occupants.map((occ: any) => ({
              _id: occ.userId?._id || occ._id || String(Math.random()),
              name: occ.name || occ.userId?.name || "Occupant",
              email: occ.email || occ.userId?.email || "",
              phone: occ.phone || occ.userId?.phone || "",
              emergencyContact: occ.emergencyContact || occ.userId?.emergencyContact || "",
              roleInUnit: occ.relationship || "Occupant",
            }))
          : [];

        // Add primary tenant if present
        if (unit.primaryTenantId && !occupants.some((u) => u._id === (unit.primaryTenantId._id || unit.primaryTenantId))) {
          occupants.unshift({
            _id: unit.primaryTenantId._id || unit.primaryTenantId,
            name: unit.primaryTenantId.name || unit.tenantName || "Primary Tenant",
            email: unit.primaryTenantId.email || "",
            phone: unit.primaryTenantId.phone || unit.tenantPhone || "",
            emergencyContact: unit.tenantEmergencyContact || "",
            roleInUnit: "Primary Tenant",
          });
        }

        return {
          _id: unit._id,
          unitNumber: unit.unitNumber,
          floor: unit.floor,
          configuration: unit.configuration || unit.type || "Standard",
          status: unit.status || (occupants.length > 0 ? "OCCUPIED" : "VACANT"),
          propertyName: unit.propertyId?.name || "Property",
          primaryTenantName: unit.tenantName || (occupants[0]?.name) || "N/A",
          primaryTenantPhone: unit.tenantPhone || (occupants[0]?.phone) || "N/A",
          primaryTenantEmergencyContact: unit.tenantEmergencyContact || (occupants[0]?.emergencyContact) || "N/A",
          users: occupants,
        };
      });

      setUnitsWithUsers(grouped);
    } catch (err: any) {
      console.error("Failed fetching users by unit:", err);
      setErrorMsg(err.response?.data?.message || err.message || "Failed loading users.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isOwner) {
      alert("Unauthorized: Only the Owner can delete a user from the workspace.");
      return;
    }

    if (!confirm("Are you sure you want to delete this user from the organization?")) return;

    try {
      await api.delete(`/organizations/${orgId}/members/${userId}`);
      setSuccessMsg("User removed successfully.");
      fetchUsersGroupedByUnit();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed removing user.");
    }
  };

  return (
    <MainLayout>
      <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Top Title */}
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Workspace Users (Organized by Unit)
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
            View members, tenants, and sharing individuals listed under their respective property units
          </p>
        </div>

        {errorMsg && (
          <div style={{ padding: "12px 16px", backgroundColor: "#fef2f2", borderLeft: "4px solid #ef4444", borderRadius: "8px", color: "#991b1b", fontSize: "0.875rem" }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ padding: "12px 16px", backgroundColor: "#f0fdf4", borderLeft: "4px solid #16a34a", borderRadius: "8px", color: "#166534", fontSize: "0.875rem" }}>
            {successMsg}
          </div>
        )}

        {/* Units Accordions / Cards List */}
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading units and users...</div>
        ) : unitsWithUsers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#ffffff" }}>
            <p style={{ color: "#94a3b8", margin: 0 }}>No units or users created in this organization yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {unitsWithUsers.map((unit) => (
              <div
                key={unit._id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                {/* Unit Accordion Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                      Unit {unit.unitNumber} ({unit.propertyName})
                    </span>
                    <span style={{ marginLeft: "10px", fontSize: "0.8rem", color: "#64748b" }}>
                      Floor: {unit.floor ?? 0} • Config: {unit.configuration}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "12px",
                      backgroundColor: unit.status === "OCCUPIED" ? "#dcfce7" : "#fef3c7",
                      color: unit.status === "OCCUPIED" ? "#15803d" : "#b45309",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                    }}
                  >
                    {unit.status} ({unit.users.length} {unit.users.length === 1 ? "User" : "Users"})
                  </span>
                </div>

                {/* Users List Sub-Items */}
                {unit.users.length === 0 ? (
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                    No users assigned to this unit yet. (Vacant)
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                    {unit.users.map((u) => (
                      <div
                        key={u._id}
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: "10px",
                          border: "1px solid #e2e8f0",
                          padding: "14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                            {u.name}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#2563eb", fontWeight: 600 }}>
                            {u.roleInUnit}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          {isOwnerOrAdmin && (
                            <button
                              onClick={() => setSelectedUserModal(u)}
                              style={{
                                padding: "5px 10px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#ffffff",
                                color: "#1e293b",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              View Profile
                            </button>
                          )}

                          {/* Owner only delete user feature */}
                          {isOwner && (
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              style={{

                                padding: "5px 10px",
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "#fee2e2",
                                color: "#b91c1c",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Selected User Modal (Owner / Admin view full user details) */}
        {selectedUserModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                maxWidth: "480px",
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  User Profile — {selectedUserModal.name}
                </h3>
                <button onClick={() => setSelectedUserModal(null)} style={{ border: "none", background: "transparent", fontSize: "1.2rem", cursor: "pointer" }}>
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Role in Unit: </span>
                  <strong style={{ color: "#2563eb" }}>{selectedUserModal.roleInUnit}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Email Address: </span>
                  <strong>{selectedUserModal.email || "Not provided"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Mobile Phone: </span>
                  <strong>{selectedUserModal.phone || "Not provided"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontWeight: 600 }}>Emergency Contact: </span>
                  <strong style={{ color: "#dc2626" }}>{selectedUserModal.emergencyContact || "Not provided"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                <button
                  onClick={() => setSelectedUserModal(null)}
                  style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", cursor: "pointer" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default UsersPage;
