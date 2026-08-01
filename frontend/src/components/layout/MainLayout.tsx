import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
            <Navbar />
            <div style={{ display: "flex", flex: 1 }}>
                <Sidebar />
                <main style={{ flex: 1, padding: "32px", backgroundColor: "#f8fafc" }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
