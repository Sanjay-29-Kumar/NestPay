import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", color: "#0f172a", display: "flex", flexDirection: "column" }}>
            {/* Header / Navbar (No side panel, no notification bell, no profile icon) */}
            <header
                style={{
                    height: "72px",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 40px",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                {/* NestPay Branding */}
                <div
                    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
                    onClick={() => navigate("/")}
                >
                    <div
                        style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "#4f46e5",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.2rem",
                            fontWeight: 800,
                        }}
                    >
                        🏠
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                        <span style={{ color: "#0f172a" }}>Nest</span>
                        <span style={{ color: "#4f46e5" }}>Pay</span>
                    </div>
                </div>

                {/* Right side CTA Header buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                        Login
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => navigate("/register")}>
                        Get Started
                    </Button>
                </div>
            </header>

            {/* Main Hero & Marketing Section */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px 80px" }}>
                <div style={{ maxWidth: "800px", textAlign: "center", width: "100%" }} className="fade-in">
                    {/* Badge */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 16px",
                            borderRadius: "9999px",
                            backgroundColor: "#eef2ff",
                            color: "#4f46e5",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            marginBottom: "24px",
                            border: "1px solid #c7d2fe",
                        }}
                    >
                        <span>✨ Modern Property & Rental Platform</span>
                    </div>

                    {/* Headline */}
                    <h1
                        style={{
                            fontSize: "3.2rem",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.15,
                            color: "#0f172a",
                            margin: "0 0 20px",
                        }}
                    >
                        Simple Rental & Tenant Management
                    </h1>

                    {/* One-line Description */}
                    <p
                        style={{
                            fontSize: "1.2rem",
                            color: "#475569",
                            lineHeight: 1.6,
                            maxWidth: "680px",
                            margin: "0 auto 36px",
                            fontWeight: 400,
                        }}
                    >
                        NestPay is a simple rental and tenant management platform that streamlines lease tracking, rent collection, and property workspace operations.
                    </p>

                    {/* Primary Call to Action Section: Login & Get Started */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "16px",
                            margin: "0 auto 48px",
                        }}
                    >
                        <Button
                            type="button"
                            variant="primary"
                            size="lg"
                            onClick={() => navigate("/register")}
                            style={{
                                height: "50px",
                                padding: "0 32px",
                                fontSize: "1.05rem",
                                boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.25), 0 4px 6px -2px rgba(79, 70, 229, 0.1)",
                            }}
                        >
                            Get Started
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => navigate("/login")}
                            style={{
                                height: "50px",
                                padding: "0 32px",
                                fontSize: "1.05rem",
                            }}
                        >
                            Login
                        </Button>
                    </div>

                    {/* Features / Intro Cards */}
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "24px",
                            marginTop: "32px",
                            textAlign: "left",
                        }}
                    >
                        <div
                            style={{
                                padding: "24px",
                                borderRadius: "16px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    backgroundColor: "#eef2ff",
                                    color: "#4f46e5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.3rem",
                                    marginBottom: "16px",
                                }}
                            >
                                🏢
                            </div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
                                Workspace Selection
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
                                Seamlessly switch between multiple property organizations and property portfolios.
                            </p>
                        </div>

                        <div
                            style={{
                                padding: "24px",
                                borderRadius: "16px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    backgroundColor: "#eef2ff",
                                    color: "#4f46e5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.3rem",
                                    marginBottom: "16px",
                                }}
                            >
                                📋
                            </div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
                                Lease & Unit Tracking
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
                                Track active leases, tenant profiles, maintenance requests, and rental agreements effortlessly.
                            </p>
                        </div>

                        <div
                            style={{
                                padding: "24px",
                                borderRadius: "16px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                            }}
                        >
                            <div
                                style={{
                                    width: "44px",
                                    height: "44px",
                                    borderRadius: "12px",
                                    backgroundColor: "#eef2ff",
                                    color: "#4f46e5",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.3rem",
                                    marginBottom: "16px",
                                }}
                            >
                                💳
                            </div>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 8px", color: "#0f172a" }}>
                                Streamlined Rent Collection
                            </h3>
                            <p style={{ margin: 0, fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
                                Automated payment reminders, instant ledger updates, and clear transaction history for every unit.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer
                style={{
                    padding: "24px 40px",
                    borderTop: "1px solid #f1f5f9",
                    backgroundColor: "#ffffff",
                    textAlign: "center",
                    fontSize: "0.875rem",
                    color: "#94a3b8",
                }}
            >
                &copy; {new Date().getFullYear()} NestPay Inc. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;
