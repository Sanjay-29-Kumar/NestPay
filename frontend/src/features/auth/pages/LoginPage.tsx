import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { loginApi, resendVerificationApi } from "../services/authApi";
import { setCredentials } from "../store/authSlice";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function LoginPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [resendSuccessMessage, setResendSuccessMessage] = useState("");
    const [requiresVerification, setRequiresVerification] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrorMessage("");
        setResendSuccessMessage("");
        setRequiresVerification(false);
        setIsLoading(true);

        const result = await loginApi({ email, password });
        setIsLoading(false);

        if (result.success && result.token && result.data) {
            dispatch(setCredentials({ user: result.data, token: result.token }));
            navigate("/dashboard");
        } else {
            if (result.requiresEmailVerification) {
                setRequiresVerification(true);
            }
            setErrorMessage(result.message || "Invalid credentials");
        }
    }

    async function handleResendVerification() {
        if (!email) return;
        setIsResending(true);
        setResendSuccessMessage("");

        const result = await resendVerificationApi(email);
        setIsResending(false);

        if (result.success) {
            setResendSuccessMessage(result.message || "New verification link sent to your email!");
        } else {
            setErrorMessage(result.message || "Failed to resend verification email.");
        }
    }

    const handleGoogleAuth = () => {
        window.location.href = "http://localhost:5000/api/v1/auth/google";
    };

    return (
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "420px" }}
                title="Sign In to NESTPAY"
                subtitle="Enter your credentials to continue"
            >
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {errorMessage ? (
                        <div
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                backgroundColor: requiresVerification ? "rgba(234, 179, 8, 0.1)" : "rgba(220, 38, 38, 0.1)",
                                border: requiresVerification ? "1px solid #eab308" : "1px solid #dc2626",
                                color: requiresVerification ? "#a16207" : "#dc2626",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                            }}
                        >
                            <p style={{ margin: 0 }}>
                                {requiresVerification ? "📩 " : "⚠️ "} {errorMessage}
                            </p>
                            {requiresVerification && (
                                <div style={{ marginTop: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={handleResendVerification}
                                        disabled={isResending}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "#2563eb",
                                            textDecoration: "underline",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            fontSize: "0.85rem",
                                            padding: 0,
                                        }}
                                    >
                                        {isResending ? "Sending new link..." : "Click here to Resend Verification Link"}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {resendSuccessMessage ? (
                        <div
                            style={{
                                padding: "12px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(22, 163, 74, 0.1)",
                                border: "1px solid #16a34a",
                                color: "#15803d",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                            }}
                        >
                            ✅ {resendSuccessMessage}
                        </div>
                    ) : null}

                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="user@nestpay.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                        Sign In
                    </Button>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "4px 0" }}>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 600 }}>OR</span>
                        <div style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }} />
                    </div>

                    <Button type="button" variant="outline" fullWidth onClick={handleGoogleAuth}>
                        <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: "8px" }}>
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Sign in with Google
                    </Button>

                    <div style={{ textAlign: "center", marginTop: "12px", fontSize: "0.875rem", color: "#64748b" }}>
                        Don't have an account?{" "}
                        <Link to="/register" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
                            Create account
                        </Link>
                    </div>
                </form>
            </Card>
        </div>
    );
}

export default LoginPage;