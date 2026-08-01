import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getInvitePreviewApi, acceptInviteApi, type InvitationDetails } from "../services/organizationApi";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

function AcceptInvitePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

    const [isLoading, setIsLoading] = useState(true);
    const [isAccepting, setIsAccepting] = useState(false);
    const [inviteDetails, setInviteDetails] = useState<InvitationDetails | null>(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            setErrorMessage("Invalid invitation link. Missing token.");
            return;
        }

        // Store token in sessionStorage for post-registration/login auto-accept
        sessionStorage.setItem("pending_invite_token", token);

        async function fetchDetails() {
            if (!token) return;
            const result = await getInvitePreviewApi(token);
            setIsLoading(false);

            if (result.success && result.data) {
                setInviteDetails(result.data);
            } else {
                setErrorMessage(result.message || "Invalid or expired invitation token.");
            }
        }

        fetchDetails();
    }, [token]);

    async function handleAccept() {
        if (!token) return;
        setIsAccepting(true);
        setErrorMessage("");

        const result = await acceptInviteApi(token);
        setIsAccepting(false);

        if (result.success) {
            sessionStorage.removeItem("pending_invite_token");
            setSuccessMessage(result.message || "Invitation accepted! Redirecting to Dashboard...");
            setTimeout(() => {
                navigate("/dashboard");
            }, 1500);
        } else {
            setErrorMessage(result.message || "Failed to accept invitation.");
        }
    }

    return (
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "460px", textAlign: "center" }}
                title="Workspace Invitation"
                subtitle="Join an organization on NestPay"
            >
                {isLoading && (
                    <div style={{ padding: "20px 0" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⏳</div>
                        <p style={{ color: "#64748b" }}>Loading invitation details...</p>
                    </div>
                )}

                {!isLoading && errorMessage && (
                    <div style={{ padding: "10px 0" }}>
                        <div style={{ fontSize: "3rem", color: "#dc2626", marginBottom: "12px" }}>❌</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>Invitation Error</h3>
                        <p style={{ color: "#dc2626", marginBottom: "24px" }}>{errorMessage}</p>
                        <Link to="/login" style={{ textDecoration: "none" }}>
                            <Button variant="outline" fullWidth>
                                Go to Sign In
                            </Button>
                        </Link>
                    </div>
                )}

                {!isLoading && successMessage && (
                    <div style={{ padding: "10px 0" }}>
                        <div style={{ fontSize: "3rem", color: "#16a34a", marginBottom: "12px" }}>🎉</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "8px" }}>Welcome Aboard!</h3>
                        <p style={{ color: "#16a34a", marginBottom: "24px" }}>{successMessage}</p>
                    </div>
                )}

                {!isLoading && inviteDetails && !successMessage && (
                    <div style={{ padding: "10px 0" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🏢</div>
                        <h3 style={{ color: "#0f172a", marginBottom: "4px" }}>{inviteDetails.organizationId.name}</h3>
                        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "20px" }}>
                            Invited by <strong>{inviteDetails.invitedByUserId?.name || "Workspace Admin"}</strong> as a <strong>{inviteDetails.role}</strong>
                        </p>

                        {isAuthenticated ? (
                            <div>
                                {user?.email.toLowerCase() !== inviteDetails.email.toLowerCase() ? (
                                    <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "rgba(234, 179, 8, 0.1)", border: "1px solid #eab308", color: "#a16207", fontSize: "0.85rem", marginBottom: "16px" }}>
                                        ⚠️ You are logged in as <strong>{user?.email}</strong>, but this invitation was sent to <strong>{inviteDetails.email}</strong>. Please switch accounts.
                                    </div>
                                ) : (
                                    <Button variant="primary" fullWidth onClick={handleAccept} isLoading={isAccepting}>
                                        Accept Invitation & Join Workspace
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                                    Sign in or create a NestPay account to accept this invitation.
                                </p>
                                <Link to="/register" style={{ textDecoration: "none" }}>
                                    <Button variant="primary" fullWidth>
                                        Create New Account
                                    </Button>
                                </Link>
                                <Link to="/login" style={{ textDecoration: "none" }}>
                                    <Button variant="outline" fullWidth>
                                        Sign In to Existing Account
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}

export default AcceptInvitePage;
