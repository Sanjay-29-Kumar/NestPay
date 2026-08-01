export interface CreateOrganizationInput {
    name: string;
}

export interface InviteUserInput {
    email: string;
    role: "ADMIN" | "TENANT" | "MEMBER";
}

export interface AcceptInviteInput {
    token: string;
}
