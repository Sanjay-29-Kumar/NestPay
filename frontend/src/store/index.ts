import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/store/authSlice";
import organizationReducer from "@/features/organization/store/organizationSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        organization: organizationReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
