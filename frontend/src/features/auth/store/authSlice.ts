import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthState, User } from "../types/auth.types";

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem("token"),
    isAuthenticated: false,
    isInitializing: true,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isInitializing = false;
            localStorage.setItem("token", action.payload.token);
        },
        setAuthenticatedUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isInitializing = false;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isInitializing = false;
            localStorage.removeItem("token");
        },
        setInitializationComplete: (state) => {
            state.isInitializing = false;
        },
    },
});

export const {
    setCredentials,
    setAuthenticatedUser,
    logout,
    setInitializationComplete,
} = authSlice.actions;

export default authSlice.reducer;
