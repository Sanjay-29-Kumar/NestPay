import React from "react";
import Button from "./Button";

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    actionLabel,
    onAction,
    icon,
}) => {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 24px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1",
                textAlign: "center",
                margin: "12px 0",
            }}
        >
            {icon ? (
                <div style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "16px" }}>{icon}</div>
            ) : (
                <div
                    style={{
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                        fontSize: "1.5rem",
                        fontWeight: 700,
                        marginBottom: "16px",
                    }}
                >
                    📂
                </div>
            )}
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
                {title}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "#64748b", maxWidth: "420px", margin: "0 0 20px 0" }}>
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
