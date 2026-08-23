export interface DirectoryPermissions {
    canAddUser: boolean; // Owner/Admin: show "+ Add User"
    canRequestFamilyMember: boolean; // Family Head tenant only: show "+ Request Family Member"
    canViewPendingRequestsTab: boolean; // Owner/Admin only: show "Pending Family Requests" tab
    canGoToUnitFromProfile: boolean; // Owner/Admin only: show "Go to Unit →" in profile modal
}

export type UnitAccessLevel = "OWNER_ADMIN" | "OWN_UNIT" | "OTHER_UNIT_RESTRICTED" | "NO_ACCESS";

export interface GetUnitAccessLevelParams {
    user: { id?: string; _id?: string; email?: string; phone?: string } | null;
    userRole?: string;
    targetOrgId: string;
    targetUnitId: string;
    activeUnitId?: string | null;
    occupants?: any[];
}

/**
 * Centralized per-(organization, unit) access level resolution function.
 * Takes current active unit ID into account: returns 'OWN_UNIT' only if targetUnitId === activeUnitId
 * AND the user is a legitimate occupant of it (or Owner/Admin).
 */
export function getUnitAccessLevel({
    user,
    userRole,
    targetOrgId,
    targetUnitId,
    activeUnitId,
    occupants = [],
}: GetUnitAccessLevelParams): UnitAccessLevel {
    if (!user || !targetOrgId || !targetUnitId) return "NO_ACCESS";

    const isOwnerOrAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(userRole || "");
    if (isOwnerOrAdmin) {
        return "OWNER_ADMIN";
    }

    // Check if user is an assigned occupant of this specific target unit
    const userEmail = user.email?.toLowerCase();
    const userPhone = user.phone;

    const isOccupantOfThisUnit = occupants.some((occ: any) => {
        const e = occ.email?.toLowerCase();
        const p = occ.phone;
        const occUserId = String(occ.userId || occ._id || occ.id || "");
        const currentUserId = String(user.id || user._id || "");
        return (
            (currentUserId && occUserId === currentUserId) ||
            (userEmail && e === userEmail) ||
            (userPhone && p === userPhone)
        );
    });

    if (!isOccupantOfThisUnit) {
        return "OTHER_UNIT_RESTRICTED";
    }

    // If tenant IS an occupant of targetUnitId, verify if targetUnitId is the currently ACTIVE unit
    const cleanTargetId = String(targetUnitId).trim();
    const cleanActiveId = activeUnitId ? String(activeUnitId).trim() : null;

    if (cleanActiveId && cleanTargetId !== cleanActiveId) {
        return "OTHER_UNIT_RESTRICTED";
    }

    return "OWN_UNIT";
}

/**
 * Centralized RBAC permission check function for Organization Modules & Directory.
 */
export function getDirectoryPermissions(
    userRole?: string,
    _occupancyType?: string | null
): DirectoryPermissions {
    const isOwnerOrAdmin = ["OWNER", "ADMIN", "MANAGER"].includes(userRole || "");

    if (isOwnerOrAdmin) {
        return {
            canAddUser: true,
            canRequestFamilyMember: false,
            canViewPendingRequestsTab: false,
            canGoToUnitFromProfile: true,
        };
    }

    return {
        canAddUser: false,
        canRequestFamilyMember: false,
        canViewPendingRequestsTab: false,
        canGoToUnitFromProfile: false,
    };
}
