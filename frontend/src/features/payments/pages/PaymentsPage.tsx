import MainLayout from "@/components/layout/MainLayout";

function PaymentsPage() {
    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
                    Payments
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
                    Track payments, receipts, and pending approvals.
                </p>
                <div style={{ padding: "40px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#ffffff" }}>
                    <p style={{ color: "#94a3b8", margin: 0 }}>No payment transactions logged.</p>
                </div>
            </div>
        </MainLayout>
    );
}

export default PaymentsPage;
