import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: "primary" | "secondary" | "outline" | "danger";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    fullWidth = false,
    disabled,
    style,
    className = "",
    ...props
}: ButtonProps) {
    const baseStyles: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontWeight: 600,
        borderRadius: "8px",
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        outline: "none",
        border: "1px solid transparent",
        opacity: disabled || isLoading ? 0.6 : 1,
        width: fullWidth ? "100%" : "auto",
        textDecoration: "none",
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
        sm: { padding: "6px 12px", fontSize: "0.875rem" },
        md: { padding: "10px 18px", fontSize: "0.95rem" },
        lg: { padding: "12px 24px", fontSize: "1rem" },
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: "#4f46e5",
            color: "#ffffff",
            boxShadow: "0 2px 4px 0 rgba(79, 70, 229, 0.2)",
        },
        secondary: {
            background: "#f1f5f9",
            color: "#0f172a",
            borderColor: "#e2e8f0",
        },
        outline: {
            background: "#ffffff",
            color: "#4f46e5",
            borderColor: "#4f46e5",
        },
        danger: {
            background: "#dc2626",
            color: "#ffffff",
        },
    };

    return (
        <button
            disabled={disabled || isLoading}
            style={{
                ...baseStyles,
                ...sizeStyles[size],
                ...variantStyles[variant],
                ...style,
            }}
            className={className}
            {...props}
        >
            {isLoading ? <span>⏳</span> : null}
            {children}
        </button>
    );
}

export default Button;
