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

import SplashScreen from "@/components/common/SplashScreen";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import GoogleCallbackPage from "@/features/auth/pages/GoogleCallbackPage";
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
                {/* Default Redirect */}
                <Route
                    path="/"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />

                {/* Auth Routes */}
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <LoginPage />
                        )
                    }
                />
                <Route
                    path="/register"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <RegisterPage />
                        )
                    }
                />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/auth/callback" element={<GoogleCallbackPage />} />

                {/* Protected Routes - Clean Canvas for custom development */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;