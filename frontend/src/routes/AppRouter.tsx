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
import AcceptInvitePage from "@/features/organization/pages/AcceptInvitePage";
import SelectWorkspacePage from "@/features/organization/pages/SelectWorkspacePage";
import CreateOrganizationPage from "@/features/organization/pages/CreateOrganizationPage";
import DashboardPage from "@/features/dashboard/pages/DashboardPage";
import CustomersPage from "@/features/customers/pages/CustomersPage";
import InvoicesPage from "@/features/invoices/pages/InvoicesPage";
import PaymentsPage from "@/features/payments/pages/PaymentsPage";
import ExpensesPage from "@/features/expenses/pages/ExpensesPage";
import ReportsPage from "@/features/reports/pages/ReportsPage";
import NotificationsPage from "@/features/notifications/pages/NotificationsPage";
import DocumentsPage from "@/features/documents/pages/DocumentsPage";
import OrganizationPage from "@/features/organization/pages/OrganizationPage";
import MyProfilePage from "@/features/auth/pages/MyProfilePage";
import MembersPage from "@/features/members/pages/MembersPage";
import PropertiesPage from "@/features/properties/pages/PropertiesPage";
import UnitsPage from "@/features/units/pages/UnitsPage";
import UnitDetailPage from "@/features/units/pages/UnitDetailPage";
import SettingsPage from "@/features/settings/pages/SettingsPage";
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
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Navigate to="/welcome" replace />
                        )
                    }
                />
                <Route
                    path="/welcome"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <WelcomePage />
                        )
                    }
                />
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
                <Route path="/accept-invite" element={<AcceptInvitePage />} />

                {/* Protected Enterprise Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/select-workspace" element={<SelectWorkspacePage />} />
                    <Route path="/create-organization" element={<CreateOrganizationPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/people" element={<CustomersPage />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/expenses" element={<ExpensesPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/documents" element={<DocumentsPage />} />
                    <Route path="/organization" element={<OrganizationPage />} />
                    <Route path="/profile" element={<MyProfilePage />} />
                    <Route path="/members" element={<MembersPage />} />
                    <Route path="/properties" element={<PropertiesPage />} />
                    <Route path="/units" element={<UnitsPage />} />
                    <Route path="/units/:unitId" element={<UnitDetailPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRouter;