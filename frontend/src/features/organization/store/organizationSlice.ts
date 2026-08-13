import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Membership } from "../services/organizationApi";

export interface OrganizationState {
    memberships: Membership[];
    activeMembership: Membership | null;
    isLoading: boolean;
}

const initialState: OrganizationState = {
    memberships: [],
    activeMembership: null,
    isLoading: false,
};

const organizationSlice = createSlice({
    name: "organization",
    initialState,
    reducers: {
        setMemberships: (state, action: PayloadAction<Membership[]>) => {
            state.memberships = action.payload;

            // Retain previously selected active organization if still valid
            const storedOrgId = localStorage.getItem("active_org_id");
            if (storedOrgId) {
                const found = action.payload.find(
                    (m) => m.organizationId && m.organizationId._id === storedOrgId
                );
                if (found) {
                    state.activeMembership = found;
                    return;
                }
            }

            // Default to null if no valid stored org selection
            state.activeMembership = null;
        },
        setActiveMembership: (state, action: PayloadAction<Membership>) => {
            state.activeMembership = action.payload;
            if (action.payload.organizationId?._id) {
                localStorage.setItem("active_org_id", action.payload.organizationId._id);
            }
        },
        clearActiveMembership: (state) => {
            state.activeMembership = null;
            localStorage.removeItem("active_org_id");
        },
        clearOrganizationState: (state) => {
            state.memberships = [];
            state.activeMembership = null;
            state.isLoading = false;
            localStorage.removeItem("active_org_id");
        },
    },
});

export const { setMemberships, setActiveMembership, clearActiveMembership, clearOrganizationState } = organizationSlice.actions;
export default organizationSlice.reducer;
