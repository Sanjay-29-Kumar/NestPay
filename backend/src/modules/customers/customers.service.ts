import Customer from "../../models/Customer.js";
import Membership from "../../models/Membership.js";
import Unit from "../../models/Unit.js";
import Organization from "../../models/Organization.js";
import User from "../../models/User.js";
import { CreateCustomerInput, UpdateCustomerInput, AssignUnitInput } from "./customers.types.js";

// ... existing code ...

export async function getMyResidence(userId: string, orgId: string) {
    const user = await User.findById(userId);
    if (!user) return { success: false, message: "User not found." };

    const organization = await Organization.findById(orgId);
    if (!organization) return { success: false, message: "Organization not found." };

    // Find customer record matching user's email or userId in this organization
    const customer = await Customer.findOne({
        organizationId: orgId,
        $or: [{ userId }, { email: user.email.toLowerCase() }],
    })
        .populate("propertyId", "name code propertyType description address images")
        .populate("unitId", "unitNumber unitType rentAmount floor areaSqFt bedrooms bathrooms maxCapacity sharingType status")
        .exec();

    if (!customer) {
        return {
            success: true,
            data: {
                assigned: false,
                message: "No active property or unit assignment found for your user account.",
            },
        };
    }

    let coResidents: any[] = [];
    const allowVisibility = organization.allowTenantRoommateVisibility ?? true;

    if (allowVisibility && customer.unitId) {
        coResidents = await Customer.find({
            organizationId: orgId,
            unitId: customer.unitId._id,
            _id: { $ne: customer._id },
            status: "ACTIVE",
        })
            .select("name email phone occupation photo status")
            .exec();
    }

    return {
        success: true,
        data: {
            assigned: true,
            customer,
            property: customer.propertyId,
            unit: customer.unitId,
            coResidents,
            allowVisibility,
        },
    };
}

export async function createCustomer(
    userId: string,
    orgId: string,
    data: CreateCustomerInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners, Admins, Managers, or Staff can add customers.",
        };
    }

    const customer = await Customer.create({
        ...data,
        organizationId: orgId,
        status: "ACTIVE",
    });

    // If unit is assigned during creation, update unit status to OCCUPIED
    if (data.unitId) {
        await Unit.findByIdAndUpdate(data.unitId, { status: "OCCUPIED" });
    }

    return {
        success: true,
        message: "Customer added successfully.",
        data: customer,
    };
}

export async function getCustomers(
    userId: string,
    orgId: string,
    search?: string,
    propertyId?: string,
    unitId?: string,
    statusFilter?: string
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized." };
    }

    const query: Record<string, any> = { organizationId: orgId };
    if (propertyId) query.propertyId = propertyId;
    if (unitId) query.unitId = unitId;
    if (statusFilter) query.status = statusFilter;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
        ];
    }

    const customers = await Customer.find(query)
        .populate("propertyId", "name code")
        .populate("unitId", "unitNumber unitType rentAmount")
        .sort({ createdAt: -1 })
        .exec();

    const totalCount = await Customer.countDocuments({ organizationId: orgId });
    const activeCount = await Customer.countDocuments({ organizationId: orgId, status: "ACTIVE" });

    return {
        success: true,
        data: {
            customers,
            stats: {
                totalCount,
                activeCount,
            },
        },
    };
}

export async function assignCustomerToUnit(
    userId: string,
    orgId: string,
    customerId: string,
    data: AssignUnitInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to assign units." };
    }

    const customer = await Customer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) {
        return { success: false, message: "Customer not found." };
    }

    // Free old unit if previously assigned
    if (customer.unitId && customer.unitId.toString() !== data.unitId) {
        await Unit.findByIdAndUpdate(customer.unitId, { status: "VACANT" });
    }

    customer.propertyId = data.propertyId as any;
    customer.unitId = data.unitId as any;
    customer.status = "ACTIVE";
    await customer.save();

    // Mark new unit as OCCUPIED
    await Unit.findByIdAndUpdate(data.unitId, { status: "OCCUPIED" });

    return {
        success: true,
        message: "Customer assigned to property & unit successfully.",
        data: customer,
    };
}

export async function updateCustomer(
    userId: string,
    orgId: string,
    customerId: string,
    data: UpdateCustomerInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER", "STAFF"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to update customer." };
    }

    const updated = await Customer.findOneAndUpdate(
        { _id: customerId, organizationId: orgId },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!updated) {
        return { success: false, message: "Customer not found." };
    }

    return { success: true, message: "Customer updated successfully.", data: updated };
}

export async function deleteCustomer(userId: string, orgId: string, customerId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized: Only Owners or Admins can delete customer records." };
    }

    const customer = await Customer.findOne({ _id: customerId, organizationId: orgId });
    if (customer && customer.unitId) {
        await Unit.findByIdAndUpdate(customer.unitId, { status: "VACANT" });
    }

    await Customer.findOneAndDelete({ _id: customerId, organizationId: orgId });
    return { success: true, message: "Customer record removed." };
}
