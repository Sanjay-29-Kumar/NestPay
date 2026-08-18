import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import type { RootState } from "@/store";
import { getCurrentUserApi } from "@/features/auth/services/authApi";
import {
    setAuthenticatedUser,
    logout,
    setInitializationComplete,
} from "@/features/auth/store/authSlice";
import { clearOrganizationState } from "@/features/organization/store/organizationSlice";

import SplashScreen from "@/components/common/SplashScreen";
import LandingPage from "@/features/auth/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import GoogleCallbackPage from "@/features/auth/pages/GoogleCallbackPage";
import WorkspacePage from "@/features/organization/pages/WorkspacePage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
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
                } else {
                    dispatch(logout());
                    dispatch(clearOrganizationState());
                }
            } catch {
                dispatch(logout());
                dispatch(clearOrganizationState());
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
                {/* Default Route: Landing Page for unauthenticated, /workspace for authenticated */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/workspace" replace />
                        ) : (
                            <LandingPage />
                        )
                    }
                />

                {/* Auth Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/workspace" replace />
                        ) : (
                            <LoginPage />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/workspace" replace />
                        ) : (
                            <RegisterPage />
                        )
                    }
                />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/auth/callback" element={<GoogleCallbackPage />} />
                <Route path="/welcome" element={<Navigate to="/" replace />} />

                {/* Protected Routes - Standalone Workspace & Org Dashboard */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/workspace" element={<WorkspacePage />} />
                    <Route path="/org/:orgId/dashboard" element={<DashboardPage />} />
                    <Route path="/org/:orgId/payment" element={<DashboardPage initialTab="payment" />} />
                    <Route path="/org/:orgId/payments" element={<DashboardPage initialTab="payment" />} />
                    <Route path="/org/:orgId/units" element={<DashboardPage initialTab="units" unitSubView="list" />} />
                    <Route path="/org/:orgId/units/new" element={<DashboardPage initialTab="units" unitSubView="new" />} />
                    <Route path="/org/:orgId/units/:unitId" element={<DashboardPage initialTab="units" unitSubView="details" />} />
                    <Route path="/org/:orgId/units/:unitId/edit" element={<DashboardPage initialTab="units" unitSubView="edit" />} />
                    <Route path="/org/:orgId/units/:unitId/add-user" element={<DashboardPage initialTab="units" unitSubView="add-user" />} />
                    <Route path="/org/:orgId/units/:unitId/invoice/settings" element={<DashboardPage initialTab="units" unitSubView="details" />} />
                    <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;