import type { ReactNode } from "react";
import LandingNavbar from "./LandingNavbar";
import LandingSidebar from "./LandingSidebar";

export interface LandingLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export function LandingLayout({ children, title, subtitle }: LandingLayoutProps) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
            {/* Landing Top Navbar */}
            <LandingNavbar />

            <div style={{ display: "flex", flex: 1 }}>
                {/* Landing Side Panel */}
                <LandingSidebar />

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: "24px 32px", backgroundColor: "#f8fafc" }}>
                    {/* Header Bar */}
                    {(title || subtitle) && (
                        <div style={{ marginBottom: "20px" }}>
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
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}

export default LandingLayout;
