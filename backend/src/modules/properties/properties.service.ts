import Property from "../../models/Property.js";
import Membership from "../../models/Membership.js";
import { CreatePropertyInput, UpdatePropertyInput } from "./properties.types.js";

export async function createProperty(
    userId: string,
    orgId: string,
    data: CreatePropertyInput
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
            message: "Unauthorized: Only Owners, Admins, or Managers can add properties.",
        };
    }

    const existingCode = await Property.findOne({
        organizationId: orgId,
        code: data.code.toUpperCase(),
    });

    if (existingCode) {
        return {
            success: false,
            message: `Property code "${data.code}" already exists in this workspace.`,
        };
    }

    const property = await Property.create({
        ...data,
        code: data.code.toUpperCase(),
        organizationId: orgId,
        status: "ACTIVE",
    });

    return {
        success: true,
        message: "Property created successfully.",
        data: property,
    };
}

export async function getProperties(
    userId: string,
    orgId: string,
    search?: string,
    typeFilter?: string,
    statusFilter?: string
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return {
            success: false,
            message: "Unauthorized or not an active workspace member.",
        };
    }

    const query: Record<string, any> = { organizationId: orgId };
    if (typeFilter) query.propertyType = typeFilter;
    if (statusFilter) query.status = statusFilter;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { code: { $regex: search, $options: "i" } },
            { "address.city": { $regex: search, $options: "i" } },
        ];
    }

    const properties = await Property.find(query).sort({ createdAt: -1 }).exec();

    // Summary stats
    const totalCount = await Property.countDocuments({ organizationId: orgId });
    const activeCount = await Property.countDocuments({ organizationId: orgId, status: "ACTIVE" });
    const maintenanceCount = await Property.countDocuments({ organizationId: orgId, status: "UNDER_MAINTENANCE" });

    return {
        success: true,
        data: {
            properties,
            stats: {
                totalCount,
                activeCount,
                maintenanceCount,
            },
        },
    };
}

export async function getPropertyById(userId: string, orgId: string, propertyId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized." };
    }

    const property = await Property.findOne({ _id: propertyId, organizationId: orgId });
    if (!property) {
        return { success: false, message: "Property not found." };
    }

    return { success: true, data: property };
}

export async function updateProperty(
    userId: string,
    orgId: string,
    propertyId: string,
    data: UpdatePropertyInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to edit properties." };
    }

    const updated = await Property.findOneAndUpdate(
        { _id: propertyId, organizationId: orgId },
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!updated) {
        return { success: false, message: "Property not found." };
    }

    return { success: true, message: "Property updated successfully.", data: updated };
}

export async function deleteProperty(userId: string, orgId: string, propertyId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized: Only Owners or Admins can delete properties." };
    }

    await Property.findOneAndDelete({ _id: propertyId, organizationId: orgId });
    return { success: true, message: "Property deleted successfully." };
}
