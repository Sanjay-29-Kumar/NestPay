import crypto from "crypto";
import Organization from "../../models/Organization.js";
import Membership from "../../models/Membership.js";
import Invitation from "../../models/Invitation.js";
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";
import { sendInvitationEmail } from "../../utils/mailer.js";
import { CreateOrganizationInput, UpdateOrganizationInput, InviteUserInput } from "./organization.types.js";

function generateSlug(name: string): string {
    const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex");
    return `${baseSlug}-${randomSuffix}`;
}

export async function createOrganization(userId: string, data: CreateOrganizationInput) {
    const slug = generateSlug(data.name);

    // 1. Create Organization Document
    const org = await Organization.create({
        name: data.name,
        displayName: data.name,
        slug,
        organizationType: data.organizationType || "APARTMENT",
        currency: data.currency || "USD",
        timezone: data.timezone || "UTC",
        language: data.language || "en",
        ownerId: userId,
        status: "ACTIVE",
    });

    // 2. Create Membership Document (Creator is OWNER)
    const membership = await Membership.create({
        userId,
        organizationId: org._id,
        role: "OWNER",
        status: "ACTIVE",
    });

    return {
        success: true,
        message: "Organization created successfully",
        data: {
            organization: org,
            membership,
        },
    };
}

export async function getOrganizationById(userId: string, orgId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return {
            success: false,
            message: "Unauthorized or membership not found for this organization.",
        };
    }

    const org = await Organization.findById(orgId);
    if (!org) {
        return {
            success: false,
            message: "Organization not found.",
        };
    }

    return {
        success: true,
        data: {
            organization: org,
            role: membership.role,
        },
    };
}

export async function updateOrganization(
    userId: string,
    orgId: string,
    data: UpdateOrganizationInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners or Admins can update organization profile.",
        };
    }

    const updatedOrg = await Organization.findByIdAndUpdate(
        orgId,
        { $set: data },
        { new: true, runValidators: true }
    );

    if (!updatedOrg) {
        return {
            success: false,
            message: "Organization not found.",
        };
    }

    return {
        success: true,
        message: "Organization profile updated successfully.",
        data: updatedOrg,
    };
}

export async function getUserMemberships(userId: string) {
    const user = await User.findById(userId);
    if (user && user.email) {
        const lowerEmail = user.email.toLowerCase();
        const Customer = (await import("../../models/Customer.js")).default;
        const pendingCustomers = await Customer.find({ email: lowerEmail });

        for (const cust of pendingCustomers) {
            cust.userId = user._id;
            cust.status = "ACTIVE";
            await cust.save();

            const existingMem = await Membership.findOne({
                userId: user._id,
                organizationId: cust.organizationId,
            });

            if (!existingMem) {
                await Membership.create({
                    userId: user._id,
                    organizationId: cust.organizationId,
                    role: "MEMBER",
                    status: "ACTIVE",
                });
            }
        }

        const Invitation = (await import("../../models/Invitation.js")).default;
        const pendingInvitations = await Invitation.find({ email: lowerEmail });
        for (const inv of pendingInvitations) {
            inv.status = "ACCEPTED";
            await inv.save();

            const existingMem = await Membership.findOne({
                userId: user._id,
                organizationId: inv.organizationId,
            });

            if (!existingMem) {
                await Membership.create({
                    userId: user._id,
                    organizationId: inv.organizationId,
                    role: inv.role || "MEMBER",
                    status: "ACTIVE",
                });
            }
        }
    }

    const memberships = await Membership.find({ userId, status: "ACTIVE" })
        .populate("organizationId", "name displayName slug logo description organizationType ownerId status createdAt")
        .exec();

    return {
        success: true,
        data: memberships,
    };
}

export async function inviteUserToOrganization(
    inviterUserId: string,
    orgId: string,
    data: InviteUserInput
) {
    const { email, role } = data;

    // 1. Check if inviter is OWNER or ADMIN of this organization
    const inviterMembership = await Membership.findOne({
        userId: inviterUserId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!inviterMembership) {
        return {
            success: false,
            message: "Unauthorized: Only Organization Owners or Admins can send invitations.",
        };
    }

    const org = await Organization.findById(orgId);
    if (!org) {
        return {
            success: false,
            message: "Organization not found",
        };
    }

    const inviterUser = await User.findById(inviterUserId);
    const inviterName = inviterUser ? inviterUser.name : "An Admin";

    // 2. Check if target user is already a member of this organization
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const existingMembership = await Membership.findOne({
            userId: existingUser._id,
            organizationId: orgId,
            status: "ACTIVE",
        });

        if (existingMembership) {
            return {
                success: false,
                message: "User is already a member of this organization.",
            };
        }
    }

    // 3. Create Invitation Document
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
        organizationId: org._id,
        email,
        role,
        invitedByUserId: inviterUserId,
        token: rawToken,
        status: "PENDING",
        expiresAt,
    });

    // 4. If existing user, create in-app notification
    if (existingUser) {
        await Notification.create({
            userId: existingUser._id,
            title: `Invitation to join ${org.name}`,
            message: `${inviterName} invited you to join ${org.name} as a ${role}`,
            type: "INVITATION",
            invitationToken: rawToken,
            organizationId: org._id,
            isRead: false,
        });
    }

    // 5. Send invitation email link
    await sendInvitationEmail(email, inviterName, org.name, role, rawToken);

    return {
        success: true,
        message: `Invitation sent to ${email} successfully.`,
        data: invitation,
    };
}

export async function getInvitationDetails(token: string) {
    const invitation = await Invitation.findOne({ token, status: "PENDING" })
        .populate("organizationId", "name slug")
        .populate("invitedByUserId", "name email")
        .exec();

    if (!invitation || invitation.expiresAt < new Date()) {
        return {
            success: false,
            message: "Invalid or expired invitation token",
        };
    }

    return {
        success: true,
        data: invitation,
    };
}

export async function acceptInvitation(userId: string, token: string) {
    const invitation = await Invitation.findOne({ token, status: "PENDING" });

    if (!invitation || invitation.expiresAt < new Date()) {
        return {
            success: false,
            message: "Invalid or expired invitation token",
        };
    }

    const user = await User.findById(userId);
    if (!user) {
        return {
            success: false,
            message: "User not found",
        };
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return {
            success: false,
            message: `This invitation was sent to ${invitation.email}. Please log in with that account.`,
        };
    }

    // Create or activate Membership
    let membership = await Membership.findOne({
        userId: user._id,
        organizationId: invitation.organizationId,
    });

    if (membership) {
        membership.role = invitation.role;
        membership.status = "ACTIVE";
        await membership.save();
    } else {
        membership = await Membership.create({
            userId: user._id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            status: "ACTIVE",
        });
    }

    // Mark invitation as accepted
    invitation.status = "ACCEPTED";
    await invitation.save();

    // Mark notification as read if exists
    await Notification.updateMany(
        { userId: user._id, invitationToken: token },
        { isRead: true }
    );

    const org = await Organization.findById(invitation.organizationId);

    return {
        success: true,
        message: `Successfully joined ${org?.name || "the organization"}!`,
        data: {
            membership,
            organization: org,
        },
    };
}

export async function getWhatsAppConfig(userId: string, orgId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized" };
    }

    const WhatsAppConfig = (await import("../../models/WhatsAppConfig.js")).default;
    const config = await WhatsAppConfig.findOne({ organizationId: orgId });

    return {
        success: true,
        data: config,
    };
}

export async function updateWhatsAppConfig(userId: string, orgId: string, data: any) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners or Admins can configure WhatsApp settings.",
        };
    }

    const WhatsAppConfig = (await import("../../models/WhatsAppConfig.js")).default;
    const config = await WhatsAppConfig.findOneAndUpdate(
        { organizationId: orgId },
        {
            organizationId: orgId,
            phoneNumberId: data.phoneNumberId || "",
            businessAccountId: data.businessAccountId || "",
            displayName: data.displayName || "NestPay Notifications",
            status: data.status || "ACTIVE",
        },
        { upsert: true, new: true, runValidators: true }
    );

    return {
        success: true,
        message: "WhatsApp configuration updated successfully.",
        data: config,
    };
}
