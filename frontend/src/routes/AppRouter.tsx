import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "@/store";
import { getCurrentUserApi } from "@/features/auth/services/authApi";
import { getUserMembershipsApi } from "@/features/organization/services/organizationApi";
import {
    setAuthenticatedUser,
    logout,
    setInitializationComplete,
} from "@/features/auth/store/authSlice";
import { setMemberships } from "@/features/organization/store/organizationSlice";

import SplashScreen from "@/components/common/SplashScreen";
import WelcomePage from "@/features/auth/pages/WelcomePage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import GoogleCallbackPage from "@/features/auth/pages/GoogleCallbackPage";
import SelectWorkspacePage from "@/features/organization/pages/SelectWorkspacePage";
import MyProfilePage from "@/features/auth/pages/MyProfilePage";
import NotFoundPage from "@/features/errors/pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
    const dispatch = useDispatch();
    const { isInitializing, isAuthenticated, token } = useSelector(
        (state: RootState) => state.auth
    );

    useEffect(() => {
        async function initializeApp() {
            const storedToken = token || localStorage.getItem("token");

            if (!storedToken) {
                dispatch(setInitializationComplete());
                return;
            }

            try {
                const response = await getCurrentUserApi();
                if (response.success && response.data) {
                    dispatch(setAuthenticatedUser(response.data));

                    // Fetch user's organization memberships
                    const membershipsRes = await getUserMembershipsApi();
                    if (membershipsRes.success && membershipsRes.data) {
                        dispatch(setMemberships(membershipsRes.data));
                    }
                } else {
                    dispatch(logout());
                }
            } catch {
                dispatch(logout());
            }
        }

        initializeApp();
    }, [dispatch, token]);

    if (isInitializing) {
        return <SplashScreen />;
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public / Auth Routes */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/select-workspace" replace />
                        ) : (
                            <Navigate to="/welcome" replace />
                        )
                    }
                />
                <Route
                    path="/welcome"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/select-workspace" replace />
                        ) : (
                            <WelcomePage />
                        )
                    }
                />
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/select-workspace" replace />
                        ) : (
                            <LoginPage />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/select-workspace" replace />
                        ) : (
                            <RegisterPage />
                        )
                    }
                />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/auth/callback" element={<GoogleCallbackPage />} />

                {/* Protected Routes - Post-login blank canvas */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/select-workspace" element={<SelectWorkspacePage />} />
                    <Route path="/dashboard" element={<Navigate to="/select-workspace" replace />} />
                    <Route path="/create-organization" element={<Navigate to="/select-workspace" replace />} />
                    <Route path="/profile" element={<MyProfilePage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;