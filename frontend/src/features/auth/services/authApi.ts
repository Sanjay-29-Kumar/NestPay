import api from "@/services/api";
import type { User } from "../types/auth.types";

interface GetMeResponse {
    success: boolean;
    data?: User;
    message?: string;
}

export interface AuthApiResponse {
    success: boolean;
    message: string;
    token?: string;
    data?: User;
    errors?: Array<{ field: string; message: string }>;
    requiresEmailVerification?: boolean;
}

export async function getCurrentUserApi(): Promise<GetMeResponse> {
    const response = await api.get<GetMeResponse>("/auth/me");
    return response.data;
}

export async function loginApi(credentials: Record<string, string>): Promise<AuthApiResponse> {
    try {
        const response = await api.post<AuthApiResponse>("/auth/login", credentials);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: AuthApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Network or server connection failed" };
    }
}

export async function registerApi(userData: Record<string, string>): Promise<AuthApiResponse> {
    try {
        const response = await api.post<AuthApiResponse>("/auth/register", userData);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: AuthApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Network or server connection failed" };
    }
}

export async function verifyEmailApi(token: string): Promise<AuthApiResponse> {
    try {
        const response = await api.get<AuthApiResponse>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: AuthApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Email verification failed or token is invalid" };
    }
}

export async function resendVerificationApi(email: string): Promise<AuthApiResponse> {
    try {
        const response = await api.post<AuthApiResponse>("/auth/resend-verification", { email });
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: AuthApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to resend verification email" };
    }
}

export async function updateProfileApi(profileData: Record<string, any>): Promise<AuthApiResponse> {
    try {
        const response = await api.put<AuthApiResponse>("/auth/me/profile", profileData);
        return response.data;
    } catch (error: unknown) {
        if (error && typeof error === "object" && "response" in error) {
            const err = error as { response?: { data?: AuthApiResponse } };
            if (err.response?.data) return err.response.data;
        }
        return { success: false, message: "Failed to update profile" };
    }
}

export async function getBuildingTenantsApi(orgId?: string): Promise<{ success: boolean; data?: any[]; message?: string }> {
    try {
        const response = await api.get(`/auth/building-tenants${orgId ? `?orgId=${orgId}` : ""}`);
        return response.data;
    } catch {
        return { success: false, message: "Failed to fetch building tenants" };
    }
}

