import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export function Card({ children, title, subtitle, style, className = "", ...props }: CardProps) {
    return (
        <div
            className={`glass-card ${className}`}
            style={{
                padding: "20px 24px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
                ...style,
            }}
            {...props}
        >
            {title ? (
                <div style={{ marginBottom: "14px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</h3>
                    {subtitle ? (
                        <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "2px" }}>
                            {subtitle}
                        </p>
                    ) : null}
                </div>
            ) : null}
            {children}
        </div>
    );
}

export default Card;
