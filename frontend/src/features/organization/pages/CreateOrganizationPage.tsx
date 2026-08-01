import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createOrganizationApi, getUserMembershipsApi } from "../services/organizationApi";
import { setMemberships, setActiveMembership } from "../store/organizationSlice";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function CreateOrganizationPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        const result = await createOrganizationApi(name);
        setIsLoading(false);

        if (result.success && result.data) {
            // Fetch updated memberships list
            const membershipsRes = await getUserMembershipsApi();
            if (membershipsRes.success && membershipsRes.data) {
                dispatch(setMemberships(membershipsRes.data));
            }

            dispatch(setActiveMembership(result.data.membership));
            navigate("/dashboard");
        } else {
            setErrorMessage(result.message || "Failed to create organization");
        }
    }

    return (
        <div className="container-center fade-in">
            <Card
                style={{ width: "100%", maxWidth: "440px" }}
                title="Create Workspace"
                subtitle="Set up your primary organization to begin"
            >
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                        label="Organization Name"
                        type="text"
                        placeholder="e.g. ABC Apartments or XYZ Traders"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    <Button type="submit" variant="primary" fullWidth isLoading={isLoading}>
                        Create & Continue to Dashboard
                    </Button>
                </form>
            </Card>
        </div>
    );
}

export default CreateOrganizationPage;
