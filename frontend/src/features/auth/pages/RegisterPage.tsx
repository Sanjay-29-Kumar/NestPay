import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { registerApi } from "../services/authApi";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrorMessage("");
        setFieldErrors({});
        setIsLoading(true);

        const result = await registerApi({ name, email, password });
        setIsLoading(false);

        if (result.success) {
            setIsSuccess(true);
            setSuccessMessage(result.message || "Registration successful. Please check your email to verify your account.");
        } else {
            if (result.errors && Array.isArray(result.errors)) {
                const errorsMap: Record<string, string> = {};
                result.errors.forEach((err) => {
                    errorsMap[err.field] = err.message;
                });
                setFieldErrors(errorsMap);
            }
            setErrorMessage(result.message || "Registration failed");
        }
    }

    const handleGoogleAuth = () => {
        window.location.href = "http://localhost:5000/api/v1/auth/google";
    };

    return (
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "440px" }}
                title="Create NESTPAY Account"
                subtitle="Set up your account credentials"
            >
                {isSuccess ? (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📬</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>Check Your Email</h3>
                        <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "0.95rem" }}>
                            {successMessage}
                        </p>
                        <Link to="/login" style={{ textDecoration: "none" }}>
                            <Button variant="primary" fullWidth>
                                Go to Sign In
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        {errorMessage ? (
                            <div
                                style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                                    border: "1px solid #dc2626",
                                    color: "#dc2626",
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                }}
                            >
                                ⚠️ {errorMessage}
                            </div>
                        ) : null}

                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="Alex Mercer"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            error={fieldErrors.name}
                            required
                        />

                        <Input
                            label="Work Email"
                            type="email"
                            placeholder="alex@nestpay.io"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={fieldErrors.email}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="Minimum 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={fieldErrors.password}
                            required
                        />

                        <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                            Register Account
                        </Button>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
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
                            Continue with Google
                        </Button>

                        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "0.875rem", color: "#64748b" }}>
                            Already have an account?{" "}
                            <Link to="/login" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>
                                Sign in
                            </Link>
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
}

export default RegisterPage;
