import MainLayout from "@/components/layout/MainLayout";

function DocumentsPage() {
    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
                    Documents & Contracts
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                    Store lease agreements, identity proof, and property documents.
                </p>
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#ffffff" }}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No documents uploaded.</p>
                </div>
            </div>
        </MainLayout>
    );
}

export default DocumentsPage;
