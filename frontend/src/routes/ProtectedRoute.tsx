import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

import type { RootState } from "@/store";
import SplashScreen from "@/components/common/SplashScreen";

function ProtectedRoute() {
    const { isAuthenticated, isInitializing } = useSelector(
        (state: RootState) => state.auth
    );

    if (isInitializing) {
        return <SplashScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/welcome" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
