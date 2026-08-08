import React, { useEffect } from "react";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    width = "540px",
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 100,
                display: "flex",
                justifyContent: "flex-end",
                backgroundColor: "rgba(15, 23, 42, 0.4)",
                backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: width,
                    height: "100%",
                    backgroundColor: "#ffffff",
                    boxShadow: "-8px 0 24px rgba(0, 0, 0, 0.12)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drawer Header */}
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#f8fafc",
                    }}
                >
                    <div>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
                            {title}
                        </h3>
                        {subtitle && (
                            <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.4rem",
                            lineHeight: 1,
                            color: "#94a3b8",
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "6px",
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Drawer Body */}
                <div
                    style={{
                        padding: "24px",
                        flex: 1,
                        overflowY: "auto",
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Drawer;
