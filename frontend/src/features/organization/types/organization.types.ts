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
    organizationId?: string | { _id: string; name: string };
    unitId?: string | { _id: string; unitNumber: string };
    metadata?: {
        tenantName?: string;
        tenantPhone?: string;
        rentAmount?: number | string;
        unitNumber?: string;
        dueDate?: string;
        billingPeriod?: string;
        prefilledMessage?: string;
        reminderEvent?: string;
        dayRule?: string;
        actionStatus?: "PENDING" | "SENT";
    };
    isRead: boolean;
    createdAt: string;
}
