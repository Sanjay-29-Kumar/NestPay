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
                padding: "24px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                ...style,
            }}
            {...props}
        >
            {title ? (
                <div style={{ marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>{title}</h3>
                    {subtitle ? (
                        <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "4px" }}>
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
