import React from "react";
import { Link } from "react-router-dom";

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
    return (
        <nav style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <React.Fragment key={index}>
                        {index > 0 && <span style={{ color: "#cbd5e1" }}>/</span>}
                        {item.path && !isLast ? (
                            <Link to={item.path} style={{ color: "#64748b", textDecoration: "none", fontWeight: 500 }}>
                                {item.label}
                            </Link>
                        ) : (
                            <span style={{ color: isLast ? "#0f172a" : "#64748b", fontWeight: isLast ? 600 : 400 }}>
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
