export interface CreateCustomerInput {
    propertyId?: string;
    unitId?: string;
    userId?: string;
    photo?: string;
    name: string;
    email: string;
    phone: string;
    emergencyContact?: {
        name?: string;
        phone?: string;
        relationship?: string;
    };
    occupation?: string;
    nationality?: string;
    governmentIds?: Array<{
        idType: string;
        idNumber: string;
        documentUrl?: string;
    }>;
    documents?: string[];
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
    status?: "ACTIVE" | "PAST" | "PENDING";
}

export interface AssignUnitInput {
    propertyId: string;
    unitId: string;
}

export interface AddUserToUnitInput {
    name: string;
    email: string;
    phone: string;
    occupancyType: "Single" | "Family Head" | "Sharing";
}

export interface CreateFamilyRequestInput {
    unitId?: string;
    name: string;
    email: string;
    phone: string;
    relationship: string;
}

