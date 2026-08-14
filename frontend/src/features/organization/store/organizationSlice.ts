import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Membership } from "../types/organization.types";

interface OrganizationState {
    memberships: Membership[];
    currentOrgId: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: OrganizationState = {
    memberships: [],
    currentOrgId: localStorage.getItem("selectedOrgId"),
    isLoading: false,
    error: null,
};

const organizationSlice = createSlice({
    name: "organization",
    initialState,
    reducers: {
        setMemberships: (state, action: PayloadAction<Membership[]>) => {
            state.memberships = action.payload;
            state.isLoading = false;
            state.error = null;
        },
        setCurrentOrgId: (state, action: PayloadAction<string | null>) => {
            state.currentOrgId = action.payload;
            if (action.payload) {
                localStorage.setItem("selectedOrgId", action.payload);
            } else {
                localStorage.removeItem("selectedOrgId");
            }
        },
        addMembership: (state, action: PayloadAction<Membership>) => {
            state.memberships.unshift(action.payload);
        },
        setOrganizationLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setOrganizationError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        clearOrganizationState: (state) => {
            state.memberships = [];
            state.currentOrgId = null;
            state.isLoading = false;
            state.error = null;
            localStorage.removeItem("selectedOrgId");
        },
    },
});

export const {
    setMemberships,
    setCurrentOrgId,
    addMembership,
    setOrganizationLoading,
    setOrganizationError,
    clearOrganizationState,
} = organizationSlice.actions;

export default organizationSlice.reducer;
