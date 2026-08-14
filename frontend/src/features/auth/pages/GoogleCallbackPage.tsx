import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { getCurrentUserApi } from "../services/authApi";
import { setCredentials, logout } from "../store/authSlice";
import { clearOrganizationState } from "@/features/organization/store/organizationSlice";
import Card from "@/components/ui/Card";

function GoogleCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setError("Google authentication failed. No token received.");
            return;
        }

        // Store token temporarily to allow getCurrentUserApi to use it
        localStorage.setItem("token", token);

        async function fetchUser() {
            if (!token) return;
            try {
                const response = await getCurrentUserApi();
                if (response.success && response.data) {
                    dispatch(setCredentials({ user: response.data, token }));
                    navigate("/workspace");
                } else {
                    dispatch(logout());
                    dispatch(clearOrganizationState());
                    setError("Failed to fetch Google authenticated user profile.");
                }
            } catch {
                dispatch(logout());
                dispatch(clearOrganizationState());
                setError("Authentication error occurred during Google sign in.");
            }
        }

        fetchUser();
    }, [searchParams, dispatch, navigate]);

    return (
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "420px", textAlign: "center" }}
                title="Authenticating with Google"
                subtitle="Finalizing your session..."
            >
                {error ? (
                    <div style={{ padding: "12px", color: "#dc2626" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚠️</div>
                        <p>{error}</p>
                    </div>
                ) : (
                    <div style={{ padding: "20px 0" }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔄</div>
                        <p style={{ color: "#64748b" }}>Please wait while we log you into NestPay...</p>
                    </div>
                )}
            </Card>
        </div>
    );
}

export default GoogleCallbackPage;
