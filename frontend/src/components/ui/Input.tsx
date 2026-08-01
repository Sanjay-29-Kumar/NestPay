import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, style, className = "", ...props }, ref) => {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                {label ? (
                    <label
                        style={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#334155",
                        }}
                    >
                        {label}
                    </label>
                ) : null}

                <input
                    ref={ref}
                    style={{
                        padding: "10px 14px",
                        fontSize: "0.95rem",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        border: error ? "1px solid #dc2626" : "1px solid #cbd5e1",
                        outline: "none",
                        transition: "all 0.2s ease",
                        width: "100%",
                        ...style,
                    }}
                    className={className}
                    {...props}
                />

                {error ? (
                    <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 500 }}>
                        {error}
                    </span>
                ) : helperText ? (
                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{helperText}</span>
                ) : null}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
