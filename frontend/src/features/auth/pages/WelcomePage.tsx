import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";

function WelcomePage() {
    return (
        <div className="container-center fade-in" style={{ textAlign: "center" }}>
            <h1
                style={{
                    fontSize: "3rem",
                    fontWeight: 800,
                    lineHeight: 1.1,
                    marginBottom: "12px",
                    color: "#0f172a",
                }}
            >
                NEST<span style={{ color: "#4f46e5" }}>PAY</span>
            </h1>

            <p
                style={{
                    fontSize: "1.1rem",
                    color: "#475569",
                    maxWidth: "520px",
                    marginBottom: "32px",
                }}
            >
                Intelligent Multi-Tenant Financial Management Platform
            </p>

            <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
                <Link to="/login" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="lg">
                        Sign In
                    </Button>
                </Link>
                <Link to="/register" style={{ textDecoration: "none" }}>
                    <Button variant="secondary" size="lg">
                        Create Account
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default WelcomePage;
