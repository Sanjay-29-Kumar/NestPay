import Membership from "../../models/Membership.js";
import Organization from "../../models/Organization.js";
import Invitation from "../../models/Invitation.js";
import User from "../../models/User.js";
import { WorkspaceRole } from "./members.types.js";

export async function getOrganizationMembers(
    requestingUserId: string,
    orgId: string,
    searchQuery?: string,
    roleFilter?: string
) {
    // Check if requesting user is active member of org
    const requesterMembership = await Membership.findOne({
        userId: requestingUserId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!requesterMembership) {
        return {
            success: false,
            message: "Unauthorized: You are not an active member of this organization.",
        };
    }

    const query: Record<string, any> = { organizationId: orgId };
    if (roleFilter) {
        query.role = roleFilter;
    }

    const memberships = await Membership.find(query)
        .populate({
            path: "userId",
            select: "name email photo phone fullName displayName status",
        })
        .sort({ createdAt: -1 })
        .exec();

    // Client-side search filtering on populated user fields
    let filtered = memberships.filter((m) => m.userId !== null);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((m: any) => {
            const userObj = m.userId as any;
            if (!userObj) return false;
            return (
                userObj.name?.toLowerCase().includes(q) ||
                userObj.email?.toLowerCase().includes(q) ||
                userObj.phone?.toLowerCase().includes(q)
            );
        });
    }

    return {
        success: true,
        data: filtered,
    };
}

export async function updateMemberRole(
    requestingUserId: string,
    orgId: string,
    membershipId: string,
    newRole: WorkspaceRole
) {
    const requesterMembership = await Membership.findOne({
        userId: requestingUserId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!requesterMembership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners or Admins can edit member roles.",
        };
    }

    const targetMembership = await Membership.findById(membershipId);
    if (!targetMembership || targetMembership.organizationId.toString() !== orgId) {
        return {
            success: false,
            message: "Member not found in this organization.",
        };
    }

    if (targetMembership.role === "OWNER") {
        return {
            success: false,
            message: "Cannot change the role of the Organization Owner. Use Transfer Ownership instead.",
        };
    }

    targetMembership.role = newRole;
    await targetMembership.save();

    return {
        success: true,
        message: "Member role updated successfully.",
        data: targetMembership,
    };
}

export async function updateMemberStatus(
    requestingUserId: string,
    orgId: string,
    membershipId: string,
    status: "ACTIVE" | "SUSPENDED" | "INACTIVE"
) {
    const requesterMembership = await Membership.findOne({
        userId: requestingUserId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!requesterMembership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners or Admins can suspend or reactivate members.",
        };
    }

    const targetMembership = await Membership.findById(membershipId);
    if (!targetMembership || targetMembership.organizationId.toString() !== orgId) {
        return {
            success: false,
            message: "Member not found in this organization.",
        };
    }

    if (targetMembership.role === "OWNER") {
        return {
            success: false,
            message: "Cannot suspend the Organization Owner.",
        };
    }

    targetMembership.status = status;
    await targetMembership.save();

    return {
        success: true,
        message: `Member status updated to ${status}.`,
        data: targetMembership,
    };
}

export async function removeMember(
    requestingUserId: string,
    orgId: string,
    membershipId: string
) {
    const requesterMembership = await Membership.findOne({
        userId: requestingUserId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!requesterMembership) {
        return {
            success: false,
            message: "Unauthorized: Only Owners or Admins can remove members.",
        };
    }

    const targetMembership = await Membership.findById(membershipId);
    if (!targetMembership || targetMembership.organizationId.toString() !== orgId) {
        return {
            success: false,
            message: "Member not found in this organization.",
        };
    }

    if (targetMembership.role === "OWNER") {
        return {
            success: false,
            message: "Cannot remove the Organization Owner from the workspace.",
        };
    }

    await Membership.findByIdAndDelete(membershipId);

    return {
        success: true,
        message: "Member removed from organization.",
    };
}

export async function transferOwnership(
    currentOwnerUserId: string,
    orgId: string,
    targetUserId: string
) {
    const ownerMembership = await Membership.findOne({
        userId: currentOwnerUserId,
        organizationId: orgId,
        role: "OWNER",
        status: "ACTIVE",
    });

    if (!ownerMembership) {
        return {
            success: false,
            message: "Unauthorized: Only the current Organization Owner can transfer ownership.",
        };
    }

    const targetMembership = await Membership.findOne({
        userId: targetUserId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!targetMembership) {
        return {
            success: false,
            message: "Target user is not an active member of this organization.",
        };
    }

    // Demote current owner to ADMIN and promote target user to OWNER
    ownerMembership.role = "ADMIN";
    await ownerMembership.save();

    targetMembership.role = "OWNER";
    await targetMembership.save();

    // Update ownerId in Organization
    await Organization.findByIdAndUpdate(orgId, { ownerId: targetUserId });

    return {
        success: true,
        message: "Organization ownership transferred successfully.",
    };
}

export async function getPendingInvitations(requestingUserId: string, orgId: string) {
    const requesterMembership = await Membership.findOne({
        userId: requestingUserId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!requesterMembership) {
        return {
            success: false,
            message: "Unauthorized.",
        };
    }

    const invitations = await Invitation.find({
        organizationId: orgId,
        status: "PENDING",
    })
        .populate("invitedByUserId", "name email")
        .sort({ createdAt: -1 })
        .exec();

    return {
        success: true,
        data: invitations,
    };
}

export async function cancelInvitation(
    requestingUserId: string,
    orgId: string,
    invitationId: string
) {
    const requesterMembership = await Membership.findOne({
        userId: requestingUserId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN"] },
        status: "ACTIVE",
    });

    if (!requesterMembership) {
        return {
            success: false,
            message: "Unauthorized.",
        };
    }

    await Invitation.findByIdAndDelete(invitationId);

    return {
        success: true,
        message: "Invitation cancelled.",
    };
}
