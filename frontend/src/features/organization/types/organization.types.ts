export interface Organization {
    _id: string;
    name: string;
    displayName?: string;
    slug: string;
    logo?: string;
    description?: string;
    organizationType:
        | "APARTMENT"
        | "RENTAL_PROPERTY"
        | "BUSINESS"
        | "SCHOOL"
        | "COMMUNITY"
        | "SMALL_ORGANIZATION"
        | "SERVICE_PROVIDER"
        | "OTHER";
    currency: string;
    timezone: string;
    ownerId: string;
    status: "ACTIVE" | "SUSPENDED";
    createdAt: string;
    updatedAt: string;
}

export interface Membership {
    _id: string;
    userId: string;
    organizationId: Organization | null;
    role: "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF" | "TENANT" | "MEMBER";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    createdAt: string;
}

export interface CreateOrgInput {
    name: string;
    organizationType?: string;
    currency?: string;
    timezone?: string;
    description?: string;
}

export interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    type: string;
    invitationToken?: string;
    isRead: boolean;
    createdAt: string;
}
