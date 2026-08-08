export type WorkspaceRole =
    | "OWNER"
    | "ADMIN"
    | "MANAGER"
    | "ACCOUNTANT"
    | "STAFF"
    | "TENANT"
    | "MEMBER";

export interface EditRoleInput {
    role: WorkspaceRole;
}

export interface UpdateMemberStatusInput {
    status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
}

export interface TransferOwnershipInput {
    targetUserId: string;
}
