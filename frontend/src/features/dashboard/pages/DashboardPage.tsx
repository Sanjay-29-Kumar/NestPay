import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/features/auth/store/authSlice";
import type { RootState } from "@/store";
import Button from "@/components/ui/Button";

function DashboardPage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#0f172a", color: "#f8fafc", padding: "40px 20px" }}>
            <header style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "20px" }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>NESTPAY</h1>
                    <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "#94a3b8" }}>Welcome back, {user?.name || user?.email || "User"}</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    Sign Out
                </Button>
            </header>

            <main style={{ maxWidth: "1000px", margin: "40px auto 0" }}>
                <div style={{ backgroundColor: "#1e293b", border: "1px dashed #475569", borderRadius: "12px", padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🚀</div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 8px", color: "#f8fafc" }}>Clean Slate Ready</h2>
                    <p style={{ color: "#94a3b8", maxWidth: "480px", margin: "0 auto 24px", lineHeight: "1.5" }}>
                        All template components and extra pages have been removed. You can now build your frontend application completely from scratch.
                    </p>
                    <div style={{ display: "inline-block", backgroundColor: "#0f172a", padding: "12px 20px", borderRadius: "8px", border: "1px solid #334155", textAlign: "left", fontSize: "0.875rem" }}>
                        <div><strong style={{ color: "#38bdf8" }}>User Email:</strong> {user?.email}</div>
                        <div><strong style={{ color: "#38bdf8" }}>Role:</strong> {user?.role}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;
