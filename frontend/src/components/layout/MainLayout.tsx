import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import OrgWorkspaceHeaderCard from "./OrgWorkspaceHeaderCard";

export interface MainLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
            {/* Global Navbar Header */}
            <Navbar />

            <div style={{ display: "flex", flex: 1 }}>
                {/* Collapsible / Responsive Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: "24px 32px", backgroundColor: "#f8fafc" }}>
                    {/* Header Bar with Selected Organization Card on Right Side */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "20px",
                            flexWrap: "wrap",
                            gap: "16px",
                        }}
                    >
                        <div>
                            {title && (
                                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.9rem" }}>
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Top-Right Selected Organization Indicator Card (Matching Reference Image) */}
                        <div>
                            <OrgWorkspaceHeaderCard />
                        </div>
                    </div>

                    {children}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
