import type { ReactNode } from "react";

type AuthLayoutProps = {
    children: ReactNode;
};

function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <main>
            {children}
        </main>
    );
}

export default AuthLayout;