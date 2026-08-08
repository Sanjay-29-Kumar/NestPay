export interface User {
    _id: string;
    name: string;
    email: string;
    googleId?: string | null;
    isEmailVerified: boolean;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    fullName?: string;
    displayName?: string;
    photo?: string;
    gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
    dateOfBirth?: string;
    phone?: string;
    alternatePhone?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    preferredLanguage?: string;
    theme?: "LIGHT" | "DARK" | "SYSTEM";
    timezone?: string;
    notificationPreferences?: {
        emailNotifications: boolean;
        pushNotifications: boolean;
        smsNotifications: boolean;
    };
    securitySettings?: {
        twoFactorEnabled: boolean;
    };
    profileCompletionPercentage?: number;
    previousNames?: Array<{ name: string; updatedAt: string }>;
    previousPhones?: Array<{ phone: string; updatedAt: string }>;
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
}
