import Customer from "../../models/Customer.js";
import Membership from "../../models/Membership.js";
import Unit from "../../models/Unit.js";
import Organization from "../../models/Organization.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import FamilyRequest from "../../models/FamilyRequest.js";
import { sendInvitationEmail } from "../../utils/mailer.js";
import { CreateCustomerInput, UpdateCustomerInput, AssignUnitInput, AddUserToUnitInput, CreateFamilyRequestInput } from "./customers.types.js";

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

export async function addUserToUnit(
    userId: string,
    orgId: string,
    unitId: string,
    data: AddUserToUnitInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized: Only Owners, Admins, or Managers can add users to units." };
    }

    const unit = await Unit.findOne({ _id: unitId, organizationId: orgId });
    if (!unit) {
        return { success: false, message: "Unit not found." };
    }

    // Check existing user by email
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });

    // Find existing occupants for this unit
    const existingOccupants = await Customer.find({
        organizationId: orgId,
        unitId: unit._id,
        status: "ACTIVE",
    });

    let assignedRole: "Single" | "Family Head" | "Sharing" | "Family Member" = data.occupancyType as any;
    let familyHeadCustomerId = null;

    // If unit is already a Family unit and has an assigned primary occupant, set as Family Member
    if (unit.occupancyType === "Family" && existingOccupants.length > 0) {
        let familyHead = existingOccupants.find((c) => c.occupancyRole === "Family Head");
        if (!familyHead) {
            familyHead = existingOccupants[0];
            familyHead.occupancyRole = "Family Head";
            await familyHead.save();
        }
        assignedRole = "Family Member";
        familyHeadCustomerId = familyHead._id;
        unit.status = "OCCUPIED";
        unit.occupancyType = "Family";
        await unit.save();
    } else if (data.occupancyType === "Family Head" || data.occupancyType === "Single") {
        unit.status = "OCCUPIED";
        unit.occupancyType = data.occupancyType === "Family Head" ? "Family" : "Single";
        await unit.save();
    } else if (data.occupancyType === "Sharing") {
        unit.occupancyType = "Sharing";
        if (existingOccupants.length + 1 >= (unit.maxCapacity || 1)) {
            unit.status = "OCCUPIED";
        }
        await unit.save();
    }

    // Create Customer record
    const customer = await Customer.create({
        organizationId: orgId,
        propertyId: unit.propertyId,
        unitId: unit._id,
        userId: existingUser ? existingUser._id : null,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        occupancyRole: assignedRole,
        familyHeadId: familyHeadCustomerId,
        status: "ACTIVE",
    });

    // If existing user, link membership & send notification
    if (existingUser) {
        const existingMembership = await Membership.findOne({
            userId: existingUser._id,
            organizationId: orgId,
        });
        if (!existingMembership) {
            await Membership.create({
                userId: existingUser._id,
                organizationId: orgId,
                role: data.occupancyType === "Family Head" || data.occupancyType === "Single" || data.occupancyType === "Sharing" ? "TENANT" : "MEMBER",
                status: "ACTIVE",
            });
        }
        await Notification.create({
            userId: existingUser._id,
            title: "Assigned to Unit",
            message: `You have been added to Unit ${unit.unitNumber} as ${data.occupancyType}.`,
            type: "SYSTEM",
            organizationId: orgId as any,
            unitId: unit._id as any,
        });
    }

    return {
        success: true,
        message: `Successfully added ${data.name} to Unit ${unit.unitNumber}.`,
        data: customer,
    };
}

export async function getUsersGroupedByUnit(userId: string, orgId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized." };
    }

    // Fetch all units
    const units = await Unit.find({ organizationId: orgId }).sort({ unitNumber: 1 }).exec();

    // Fetch all active and pending customers/tenants
    const customers = await Customer.find({
        organizationId: orgId,
        status: { $in: ["ACTIVE", "PENDING"] },
    })
        .populate("unitId", "unitNumber roomType blockWing")
        .sort({ name: 1 })
        .exec();

    // Fetch all memberships (for role info)
    const memberships = await Membership.find({ organizationId: orgId, status: "ACTIVE" })
        .populate("userId", "name fullName email photo phone")
        .exec();

    // Map units with occupants & auto-heal role state for Family units
    const unitsWithOccupants = await Promise.all(
        units.map(async (u) => {
            const unitOccupants = customers.filter(
                (c) => c.unitId && c.unitId._id.toString() === u._id.toString()
            );

            // Auto-heal: If unit is Family and has occupants, ensure primary non-family-member occupant is Family Head
            if (u.occupancyType === "Family" && unitOccupants.length > 0) {
                const hasFamilyHead = unitOccupants.some((c) => c.occupancyRole === "Family Head");
                if (!hasFamilyHead) {
                    const primaryOccupant =
                        unitOccupants.find((c) => c.occupancyRole !== "Family Member") || unitOccupants[0];
                    if (primaryOccupant) {
                        primaryOccupant.occupancyRole = "Family Head";
                        await Customer.updateOne(
                            { _id: primaryOccupant._id },
                            { occupancyRole: "Family Head" }
                        );
                    }
                }
            }

            return {
                unit: u,
                occupants: unitOccupants,
            };
        })
    );

    // Unassigned occupants or staff members
    const unassignedOccupants = customers.filter((c) => !c.unitId);

    // Find current logged-in user's customer record (to get their occupancyRole e.g. Single, Family Head, Sharing)
    const currentUserCustomer = customers.find(
        (c) => c.userId && c.userId.toString() === userId.toString()
    );
    let currentUserOccupancyType = currentUserCustomer?.occupancyRole || null;

    if (currentUserCustomer && currentUserCustomer.unitId) {
        const uIdStr = (currentUserCustomer.unitId as any)._id
            ? (currentUserCustomer.unitId as any)._id.toString()
            : (currentUserCustomer.unitId as any).toString();
        const userUnit = units.find((u) => u._id.toString() === uIdStr);
        if (userUnit && userUnit.occupancyType === "Family" && currentUserOccupancyType !== "Family Member") {
            currentUserOccupancyType = "Family Head";
        }
    }

    return {
        success: true,
        data: {
            units: unitsWithOccupants,
            unitsWithOccupants,
            unassigned: unassignedOccupants,
            memberships,
            userRole: membership.role,
            currentUserOccupancyType,
        },
    };
}

export async function createFamilyRequest(userId: string, orgId: string, data: CreateFamilyRequestInput) {
    const user = await User.findById(userId);
    const userEmail = user?.email ? user.email.toLowerCase() : "";

    let customer = await Customer.findOne({
        organizationId: orgId,
        $or: [
            { userId },
            ...(userEmail ? [{ email: userEmail }] : []),
        ],
        status: "ACTIVE",
    });

    if (customer && !customer.userId) {
        customer.userId = userId as any;
        await customer.save();
    }

    const targetUnitId = data.unitId || customer?.unitId;

    if (!targetUnitId) {
        return { success: false, message: "Associated unit not found. Only assigned unit tenants can submit family member requests." };
    }

    const unitObj = await Unit.findById(targetUnitId);
    if (!unitObj) {
        return { success: false, message: "Associated unit not found." };
    }

    const request = await FamilyRequest.create({
        organizationId: orgId,
        unitId: targetUnitId,
        familyHeadUserId: userId,
        familyHeadCustomerId: customer ? customer._id : null,
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        relationship: data.relationship,
        status: "PENDING",
    });

    // Notify Owner / Admin / Manager members of the organization
    const { Types } = await import("mongoose");
    const orgObjId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;

    const Organization = (await import("../../models/Organization.js")).default;
    const orgDoc = await Organization.findById(orgId);

    const ownerAdminMemberships = await Membership.find({
        organizationId: { $in: [orgId, orgObjId] },
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    const recipientUserIds = new Set<string>();
    if (orgDoc && orgDoc.ownerId) {
        recipientUserIds.add(orgDoc.ownerId.toString());
    }
    for (const mem of ownerAdminMemberships) {
        if (mem.userId) {
            recipientUserIds.add(mem.userId.toString());
        }
    }

    const requesterName = user?.name || (customer ? customer.name : "Tenant");
    const unitNumStr = unitObj.unitNumber;

    for (const recipientId of recipientUserIds) {
        await Notification.create({
            userId: recipientId,
            title: "New Family Member Request",
            message: `New family member request for Unit ${unitNumStr} from ${requesterName} (${data.name} - ${data.relationship}).`,
            type: "SYSTEM",
            organizationId: orgId as any,
            unitId: targetUnitId as any,
        });
    }

    return {
        success: true,
        message: "Family member request submitted successfully! Workspace management has been notified for approval.",
        data: request,
    };
}

export async function getFamilyRequests(userId: string, orgId: string) {
    const { Types } = await import("mongoose");
    const orgObjId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;

    const membership = await Membership.findOne({
        userId,
        organizationId: { $in: [orgId, orgObjId] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized." };
    }

    let query: any = { organizationId: { $in: [orgId, orgObjId] } };
    // If not Owner/Admin/Manager, only return own requests
    if (!["OWNER", "ADMIN", "MANAGER"].includes(membership.role)) {
        query.familyHeadUserId = userId;
    }

    const requests = await FamilyRequest.find(query)
        .populate("unitId", "unitNumber blockWing")
        .populate("familyHeadUserId", "name email phone")
        .sort({ createdAt: -1 })
        .exec();

    return {
        success: true,
        data: requests,
    };
}

export async function approveFamilyRequest(userId: string, orgId: string, requestId: string) {
    const { Types } = await import("mongoose");
    const orgObjId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;

    const membership = await Membership.findOne({
        userId,
        organizationId: { $in: [orgId, orgObjId] },
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to approve family requests." };
    }

    const request = await FamilyRequest.findOne({
        _id: requestId,
        organizationId: { $in: [orgId, orgObjId] },
        status: "PENDING",
    });
    if (!request) {
        return { success: false, message: "Pending family request not found." };
    }

    const unit = await Unit.findById(request.unitId);
    if (!unit) {
        return { success: false, message: "Associated unit not found." };
    }

    // Convert Unit to Family unit
    unit.occupancyType = "Family";
    unit.status = "OCCUPIED";
    await unit.save();

    // Promote the primary requester customer record to Family Head
    if (request.familyHeadCustomerId) {
        await Customer.updateOne(
            { _id: request.familyHeadCustomerId },
            { occupancyRole: "Family Head" }
        );
    } else {
        await Customer.updateMany(
            { organizationId: orgId, unitId: unit._id, userId: request.familyHeadUserId, status: "ACTIVE" },
            { occupancyRole: "Family Head" }
        );
    }

    const existingUser = await User.findOne({ email: request.email.toLowerCase() });

    // Create Customer record for Family Member (ACTIVE if registered, PENDING if new invite)
    const newCustomer = await Customer.create({
        organizationId: orgId,
        propertyId: unit.propertyId,
        unitId: unit._id,
        userId: existingUser ? existingUser._id : null,
        name: request.name,
        email: request.email.toLowerCase(),
        phone: request.phone,
        occupancyRole: "Family Member",
        familyHeadId: request.familyHeadCustomerId,
        status: existingUser ? "ACTIVE" : "PENDING",
    });

    request.status = "APPROVED";
    await request.save();

    const Organization = (await import("../../models/Organization.js")).default;
    const orgDoc = await Organization.findById(orgId);
    const orgName = orgDoc ? orgDoc.name : "NestPay Workspace";

    // If new user, create Invitation record and send invitation email
    if (!existingUser) {
        const Invitation = (await import("../../models/Invitation.js")).default;
        const crypto = await import("crypto");
        const token = crypto.randomBytes(32).toString("hex");

        await Invitation.create({
            organizationId: orgId,
            email: request.email.toLowerCase(),
            role: "MEMBER",
            token,
            invitedBy: userId,
            status: "PENDING",
        });

        await sendInvitationEmail(
            request.email.toLowerCase(),
            "Workspace Management",
            orgName,
            "Family Member",
            token
        );
    }

    // Send notifications
    await Notification.create({
        userId: request.familyHeadUserId,
        title: "Family Member Approved",
        message: `Your request to add ${request.name} to Unit ${unit.unitNumber} has been approved. ${!existingUser ? "An invitation email has been sent to them to join." : ""}`,
        type: "SYSTEM",
        organizationId: orgId as any,
        unitId: unit._id as any,
    });

    if (existingUser) {
        const existingMembership = await Membership.findOne({
            userId: existingUser._id,
            organizationId: { $in: [orgId, orgObjId] },
        });
        if (!existingMembership) {
            await Membership.create({
                userId: existingUser._id,
                organizationId: orgId,
                role: "MEMBER",
                status: "ACTIVE",
            });
        }
        await Notification.create({
            userId: existingUser._id,
            title: "Added to Unit",
            message: `You have been added to Unit ${unit.unitNumber} as a Family Member.`,
            type: "SYSTEM",
            organizationId: orgId as any,
            unitId: unit._id as any,
        });
    }

    return {
        success: true,
        message: `Approved ${request.name} as Family Member for Unit ${unit.unitNumber}.`,
        data: newCustomer,
    };
}

export async function rejectFamilyRequest(userId: string, orgId: string, requestId: string, reason?: string) {
    const { Types } = await import("mongoose");
    const orgObjId = Types.ObjectId.isValid(orgId) ? new Types.ObjectId(orgId) : orgId;

    const membership = await Membership.findOne({
        userId,
        organizationId: { $in: [orgId, orgObjId] },
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized to reject family requests." };
    }

    const request = await FamilyRequest.findOne({
        _id: requestId,
        organizationId: { $in: [orgId, orgObjId] },
        status: "PENDING",
    });
    if (!request) {
        return { success: false, message: "Pending family request not found." };
    }

    request.status = "REJECTED";
    if (reason) request.rejectionReason = reason;
    await request.save();

    // Notify Family Head
    await Notification.create({
        userId: request.familyHeadUserId,
        title: "Family Member Request Declined",
        message: `Your request to add ${request.name} was declined by workspace management.`,
        type: "SYSTEM",
        organizationId: orgId as any,
        unitId: request.unitId as any,
    });

    return {
        success: true,
        message: `Declined family request for ${request.name}.`,
        data: request,
    };
}
