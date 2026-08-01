import MainLayout from "@/components/layout/MainLayout";

function ExpensesPage() {
    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
                    Expenses
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                    Record and categorize organization operating expenses and maintenance costs.
                </p>
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#ffffff" }}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No expense records found.</p>
                </div>
            </div>
        </MainLayout>
    );
}

export default ExpensesPage;
