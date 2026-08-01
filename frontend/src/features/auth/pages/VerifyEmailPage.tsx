import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyEmailApi } from "../services/authApi";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState<string>("Verifying your email address...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link. Missing token parameter.");
            return;
        }

        async function verify() {
            if (!token) return;
            const result = await verifyEmailApi(token);
            if (result.success) {
                setStatus("success");
                setMessage(result.message || "Email verified successfully!");
            } else {
                setStatus("error");
                setMessage(result.message || "Verification failed. Token may be invalid or expired.");
            }
        }

        verify();
    }, [token]);

    return (
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}
                title="Email Verification"
                subtitle="Verifying your account details"
            >
                {status === "loading" && (
                    <div style={{ padding: "20px 0" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
                        <p style={{ color: "#64748b" }}>{message}</p>
                    </div>
                )}

                {status === "success" && (
                    <div style={{ padding: "10px 0" }}>
                        <div style={{ fontSize: "3rem", color: "#16a34a", marginBottom: "12px" }}>✅</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>Verification Successful</h3>
                        <p style={{ color: "#64748b", marginBottom: "24px" }}>{message}</p>
                        <Link to="/login" style={{ textDecoration: "none" }}>
                            <Button variant="primary" fullWidth>
                                Proceed to Sign In
                            </Button>
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div style={{ padding: "10px 0" }}>
                        <div style={{ fontSize: "3rem", color: "#dc2626", marginBottom: "12px" }}>❌</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>Verification Failed</h3>
                        <p style={{ color: "#dc2626", marginBottom: "24px" }}>{message}</p>
                        <Link to="/login" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth>
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default VerifyEmailPage;
