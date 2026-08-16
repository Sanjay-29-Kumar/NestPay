import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Membership } from "../types/organization.types";

interface OrganizationState {
    memberships: Membership[];
    currentOrgId: string | null;
    currentUnitId: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: OrganizationState = {
    memberships: [],
    currentOrgId: localStorage.getItem("selectedOrgId"),
    currentUnitId: localStorage.getItem("selectedUnitId"),
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
        setCurrentUnitId: (state, action: PayloadAction<string | null>) => {
            state.currentUnitId = action.payload;
            if (action.payload) {
                localStorage.setItem("selectedUnitId", action.payload);
            } else {
                localStorage.removeItem("selectedUnitId");
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
            state.currentUnitId = null;
            state.isLoading = false;
            state.error = null;
            localStorage.removeItem("selectedOrgId");
            localStorage.removeItem("selectedUnitId");
        },
    },
});

export const {
    setMemberships,
    setCurrentOrgId,
    setCurrentUnitId,
    addMembership,
    setOrganizationLoading,
    setOrganizationError,
    clearOrganizationState,
} = organizationSlice.actions;

export default organizationSlice.reducer;
