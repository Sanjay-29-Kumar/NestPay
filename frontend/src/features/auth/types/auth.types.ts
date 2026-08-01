export interface User {
    _id: string;
    name: string;
    email: string;
    googleId?: string | null;
    isEmailVerified: boolean;
    status: "ACTIVE" | "INACTIVE" | "BLOCKED";
    createdAt?: string;
    updatedAt?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
}
