import Unit from "../../models/Unit.js";
import Membership from "../../models/Membership.js";
import Property from "../../models/Property.js";
import { CreateUnitInput, UpdateUnitInput } from "./units.types.js";

export async function createUnit(
    userId: string,
    orgId: string,
    data: CreateUnitInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners, Admins, or Managers can create units.",
        };
    }

    const propertyExists = await Property.findOne({ _id: data.propertyId, organizationId: orgId });
    if (!propertyExists) {
        return { success: false, message: "Associated property not found in this organization." };
    }

    const existingUnit = await Unit.findOne({
        propertyId: data.propertyId,
        unitNumber: data.unitNumber,
    });

    if (existingUnit) {
        return {
            success: false,
            message: `Unit "${data.unitNumber}" already exists for this property.`,
        };
    }

    const unit = await Unit.create({
        ...data,
        organizationId: orgId,
        status: "VACANT",
    });

    return {
        success: true,
        message: "Unit created successfully.",
        data: unit,
    };
}

export async function getUnits(
    userId: string,
    orgId: string,
    propertyId?: string,
    statusFilter?: string,
    search?: string
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
    if (statusFilter) query.status = statusFilter;
    if (search) {
        query.unitNumber = { $regex: search, $options: "i" };
    }

    const units = await Unit.find(query)
        .populate("propertyId", "name code propertyType")
        .sort({ unitNumber: 1 })
        .exec();

    // Calculate Occupancy Stats
    const totalUnits = await Unit.countDocuments({ organizationId: orgId });
    const occupiedUnits = await Unit.countDocuments({ organizationId: orgId, status: "OCCUPIED" });
    const vacantUnits = await Unit.countDocuments({ organizationId: orgId, status: "VACANT" });
    const maintenanceUnits = await Unit.countDocuments({ organizationId: orgId, status: "MAINTENANCE" });

    return {
        success: true,
        data: {
            units,
            stats: {
                totalUnits,
                occupiedUnits,
                vacantUnits,
                maintenanceUnits,
            },
        },
    };
}

export async function updateUnit(
    userId: string,
    orgId: string,
    unitId: string,
    data: UpdateUnitInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to update units." };
    }

    const updated = await Unit.findOneAndUpdate(
        { _id: unitId, organizationId: orgId },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!updated) {
        return { success: false, message: "Unit not found." };
    }

    return { success: true, message: "Unit updated successfully.", data: updated };
}

export async function deleteUnit(userId: string, orgId: string, unitId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized: Only Owners or Admins can delete units." };
    }

    await Unit.findOneAndDelete({ _id: unitId, organizationId: orgId });
    return { success: true, message: "Unit deleted successfully." };
}

export async function assignUserToUnit(
    userId: string,
    orgId: string,
    unitId: string,
    tenantData: { name: string; email: string; phone: string; role?: string }
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to assign user to unit." };
    }

    const unit = await Unit.findOne({ _id: unitId, organizationId: orgId });
    if (!unit) {
        return { success: false, message: "Unit not found." };
    }

    const User = (await import("../../models/User.js")).default;
    const Notification = (await import("../../models/Notification.js")).default;
    const Organization = (await import("../../models/Organization.js")).default;
    const Customer = (await import("../../models/Customer.js")).default;
    const crypto = (await import("crypto")).default;

    const emailClean = tenantData.email.trim().toLowerCase();

    // 1. Find or create tenant User
    let tenantUser = await User.findOne({ email: emailClean });
    if (!tenantUser) {
        const dummyPassword = crypto.randomBytes(16).toString("hex");
        tenantUser = await User.create({
            name: tenantData.name,
            email: emailClean,
            password: dummyPassword,
            phone: tenantData.phone,
            isEmailVerified: true,
        });
    }

    // 2. Find or create Organization Membership for tenant
    const tenantRole = (tenantData.role || "TENANT") as any;
    let tenantMembership = await Membership.findOne({
        userId: tenantUser._id,
        organizationId: orgId,
    });

    if (tenantMembership) {
        tenantMembership.status = "ACTIVE";
        tenantMembership.role = tenantRole;
        await tenantMembership.save();
    } else {
        await Membership.create({
            userId: tenantUser._id,
            organizationId: orgId,
            role: tenantRole,
            status: "ACTIVE",
        });
    }


    // 3. Create or update Customer record
    let customer = await Customer.findOne({ organizationId: orgId, email: emailClean });
    if (customer) {
        customer.propertyId = unit.propertyId;
        customer.unitId = unit._id;
        customer.name = tenantData.name;
        customer.phone = tenantData.phone;
        customer.status = "ACTIVE";
        await customer.save();
    } else {
        customer = await Customer.create({
            organizationId: orgId,
            propertyId: unit.propertyId,
            unitId: unit._id,
            name: tenantData.name,
            email: emailClean,
            phone: tenantData.phone,
            status: "ACTIVE",
        });
    }

    // 4. Send In-App Notification to tenant
    const org = await Organization.findById(orgId);
    const orgName = org ? org.name : "Workspace";

    try {
        await Notification.create({
            userId: tenantUser._id,
            title: `Assigned to Unit ${unit.unitNumber}`,
            message: `You have been added to "${orgName}" as a ${tenantRole} for Unit ${unit.unitNumber}. Click to access your workspace.`,
            type: "INVITATION",
            organizationId: orgId,
            isRead: false,
        });
    } catch (notifErr) {
        console.error("Failed creating tenant assignment notification:", notifErr);
    }

    unit.status = "OCCUPIED";
    await unit.save();

    return {
        success: true,
        message: `User ${tenantData.name} assigned to unit ${unit.unitNumber} and added to organization successfully.`,
        data: { unit, customer, tenantUser },
    };
}


