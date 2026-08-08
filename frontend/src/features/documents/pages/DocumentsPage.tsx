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
    getDocumentsApi,
    createDocumentApi,
    deleteDocumentApi,
    type DocumentItem,
} from "../services/documentsApi";

export function DocumentsPage() {
    const { activeMembership } = useSelector((state: RootState) => state.organization);
    const orgId = activeMembership?.organizationId?._id;
    const currentUserRole = activeMembership?.role;
    const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");

    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [formData, setFormData] = useState<Record<string, any>>({
        title: "",
        documentType: "PROPERTY_DOCUMENT",
        fileUrl: "",
        fileType: "PDF",
    });

    useEffect(() => {
        if (orgId) {
            fetchDocuments();
        } else {
            setLoading(false);
        }
    }, [orgId, typeFilter]);

    const fetchDocuments = async () => {
        if (!orgId) return;
        setLoading(true);
        const res = await getDocumentsApi(orgId, searchQuery, typeFilter);
        if (res.success && res.data?.documents) {
            setDocuments(res.data.documents);
        }
        setLoading(false);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDocuments();
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveDocument = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId) return;

        setSaving(true);
        setFeedback(null);

        const res = await createDocumentApi(orgId, formData);
        setSaving(false);

        if (res.success) {
            setFeedback({ type: "success", message: "Document record uploaded successfully." });
            setDrawerOpen(false);
            setFormData({ title: "", documentType: "PROPERTY_DOCUMENT", fileUrl: "", fileType: "PDF" });
            fetchDocuments();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to save document." });
        }
    };

    const handleDelete = async (docId: string) => {
        if (!orgId) return;
        if (!window.confirm("Are you sure you want to remove this document record?")) return;

        const res = await deleteDocumentApi(orgId, docId);
        if (res.success) {
            setFeedback({ type: "success", message: "Document record removed." });
            fetchDocuments();
        } else {
            setFeedback({ type: "error", message: res.message || "Failed to remove document." });
        }
    };

    if (!orgId) {
        return (
            <MainLayout>
                <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Documents" }]} />
                <EmptyState
                    title="No Active Workspace"
                    description="Please select an organization workspace to view document vault."
                    actionLabel="Select Workspace"
                    onAction={() => (window.location.href = "/select-workspace")}
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {/* Header */}
                <div>
                    <Breadcrumbs items={[{ label: "Dashboard", path: "/dashboard" }, { label: "Document Vault" }]} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                        <div>
                            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                                Workspace Document Vault
                            </h1>
                            <p style={{ color: "#64748b", fontSize: "0.95rem", margin: "4px 0 0 0" }}>
                                Secure storage for agreements, government IDs, insurance policies, and property documents.
                            </p>
                        </div>
                        <Button variant="primary" onClick={() => setDrawerOpen(true)}>
                            + Upload Document
                        </Button>
                    </div>
                </div>

                {feedback && (
                    <div
                        style={{
                            padding: "12px 16px",
                            borderRadius: "8px",
                            fontSize: "0.9rem",
                            backgroundColor: feedback.type === "success" ? "#f0fdf4" : "#fef2f2",
                            color: feedback.type === "success" ? "#166534" : "#991b1b",
                            border: `1px solid ${feedback.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                        }}
                    >
                        {feedback.message}
                    </div>
                )}

                {/* Filter & Search Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                        <input
                            type="text"
                            placeholder="Search document title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9rem",
                                flex: 1,
                                minWidth: "220px",
                            }}
                        />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                        >
                            <option value="">All Document Types</option>
                            <option value="RENTAL_AGREEMENT">Rental Agreement</option>
                            <option value="PAN">PAN Card</option>
                            <option value="AADHAAR">Aadhaar Card</option>
                            <option value="PASSPORT">Passport</option>
                            <option value="DRIVING_LICENSE">Driving License</option>
                            <option value="INSURANCE">Insurance Policy</option>
                            <option value="PROPERTY_DOCUMENT">Property Document</option>
                            <option value="OTHER">Other Document</option>
                        </select>
                        <Button variant="outline" type="submit">
                            Filter
                        </Button>
                    </form>
                </div>

                {/* Document Cards */}
                {loading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading documents...</div>
                ) : documents.length === 0 ? (
                    <EmptyState
                        title="No Documents Found"
                        description="Upload rental agreements, property papers, or identity documents to this workspace vault."
                        actionLabel="+ Upload First Document"
                        onAction={() => setDrawerOpen(true)}
                    />
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                        {documents.map((doc) => (
                            <Card key={doc._id}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "4px", backgroundColor: "#f3e8ff", color: "#6b21a8", fontWeight: 700 }}>
                                                {doc.documentType}
                                            </span>
                                            <h3 style={{ margin: "6px 0 0 0", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                                                {doc.title}
                                            </h3>
                                        </div>
                                        <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                                            {doc.fileType || "FILE"}
                                        </span>
                                    </div>

                                    <div style={{ fontSize: "0.8rem", color: "#64748b", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                                        Uploaded: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "-"} by {doc.uploadedByUserId?.name || "Member"}
                                    </div>

                                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                                            <Button variant="primary">View / Download</Button>
                                        </a>
                                        {canManage && (
                                            <Button variant="outline" onClick={() => handleDelete(doc._id)}>
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Upload Drawer */}
                <Drawer
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    title="Upload Document"
                    subtitle="Record document metadata and storage link."
                >
                    <form onSubmit={handleSaveDocument} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <Input
                            label="Document Title *"
                            name="title"
                            placeholder="e.g. Lease Agreement - Unit 101"
                            value={formData.title}
                            onChange={handleFormChange}
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Document Type *</label>
                            <select
                                name="documentType"
                                value={formData.documentType}
                                onChange={handleFormChange}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="RENTAL_AGREEMENT">Rental Agreement</option>
                                <option value="PAN">PAN Card</option>
                                <option value="AADHAAR">Aadhaar Card</option>
                                <option value="PASSPORT">Passport</option>
                                <option value="DRIVING_LICENSE">Driving License</option>
                                <option value="INSURANCE">Insurance Policy</option>
                                <option value="PROPERTY_DOCUMENT">Property Document</option>
                                <option value="OTHER">Other Document</option>
                            </select>
                        </div>

                        <Input
                            label="File Link / Storage URL *"
                            name="fileUrl"
                            placeholder="https://drive.google.com/... or cloud storage URL"
                            value={formData.fileUrl}
                            onChange={handleFormChange}
                            required
                        />

                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155" }}>Format / Extension</label>
                            <select
                                name="fileType"
                                value={formData.fileType}
                                onChange={handleFormChange}
                                style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
                            >
                                <option value="PDF">PDF</option>
                                <option value="IMAGE">Image (JPG/PNG)</option>
                                <option value="DOCX">DOCX Word</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" }}>
                            <Button variant="outline" type="button" onClick={() => setDrawerOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit" disabled={saving}>
                                {saving ? "Uploading..." : "Save Document"}
                            </Button>
                        </div>
                    </form>
                </Drawer>
            </div>
        </MainLayout>
    );
}

export default DocumentsPage;
