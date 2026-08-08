export interface CreateOrganizationInput {
    name: string;
    organizationType?: "APARTMENT" | "RENTAL_PROPERTY" | "BUSINESS" | "SCHOOL" | "COMMUNITY" | "SMALL_ORGANIZATION" | "SERVICE_PROVIDER" | "OTHER";
    currency?: string;
    timezone?: string;
    language?: string;
}

export interface UpdateOrganizationInput {
    name?: string;
    displayName?: string;
    logo?: string;
    description?: string;
    organizationType?: "APARTMENT" | "RENTAL_PROPERTY" | "BUSINESS" | "SCHOOL" | "COMMUNITY" | "SMALL_ORGANIZATION" | "SERVICE_PROVIDER" | "OTHER";
    registrationNumber?: string;
    gstVat?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    postalCode?: string;
    currency?: string;
    timezone?: string;
    language?: string;
}

export interface InviteUserInput {
    email: string;
    role: "ADMIN" | "TENANT" | "MEMBER";
}

export interface AcceptInviteInput {
    token: string;
}
