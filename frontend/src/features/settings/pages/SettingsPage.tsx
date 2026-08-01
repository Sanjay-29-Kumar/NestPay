import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import MainLayout from "@/components/layout/MainLayout";
import Card from "@/components/ui/Card";

function SettingsPage() {
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <MainLayout>
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
                    Account Settings
                </h1>

                <Card title="User Profile" subtitle="Your personal details">
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div>
                            <strong>Name:</strong> {user?.name}
                        </div>
                        <div>
                            <strong>Email:</strong> {user?.email}
                        </div>
                        <div>
                            <strong>Email Verified:</strong>{" "}
                            <span style={{ color: user?.isEmailVerified ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                                {user?.isEmailVerified ? "Verified" : "Not Verified"}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
}

export default SettingsPage;
