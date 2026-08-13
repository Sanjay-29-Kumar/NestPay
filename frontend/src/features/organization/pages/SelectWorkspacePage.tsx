import LandingLayout from "@/components/layout/LandingLayout";

export function SelectWorkspacePage() {
    return (
        <LandingLayout title="NestPay Workspace" subtitle="Post-login workspace selection & workflow canvas">
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
                <div
                    style={{
                        width: "100%",
                        maxWidth: "600px",
                        backgroundColor: "#ffffff",
                        padding: "32px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
                        textAlign: "center",
                    }}
                >
                    <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🚀</div>
                    <h2 style={{ color: "#0f172a", marginBottom: "8px", fontWeight: 800 }}>
                        Post-Login Canvas Ready
                    </h2>
                    <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: "1.5", margin: "0 auto" }}>
                        All previous post-login logic and pages have been completely removed.
                        <br />
                        We are ready to build your post-login workflow from scratch!
                    </p>
                </div>
            </div>
        </LandingLayout>
    );
}

export default SelectWorkspacePage;
