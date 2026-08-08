import { Request, Response } from "express";
import {
    getOrganizationMembers,
    updateMemberRole,
    updateMemberStatus,
    removeMember,
    transferOwnership,
    getPendingInvitations,
    cancelInvitation,
} from "./members.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function listMembers(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const result = await getOrganizationMembers(user.userId, orgId, search, role);
    return res.status(result.success ? 200 : 403).json(result);
}

export async function editRole(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const membershipId = Array.isArray(req.params.membershipId) ? req.params.membershipId[0] : req.params.membershipId;

    const result = await updateMemberRole(user.userId, orgId, membershipId, req.body.role);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function changeStatus(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const membershipId = Array.isArray(req.params.membershipId) ? req.params.membershipId[0] : req.params.membershipId;

    const result = await updateMemberStatus(user.userId, orgId, membershipId, req.body.status);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function deleteMember(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const membershipId = Array.isArray(req.params.membershipId) ? req.params.membershipId[0] : req.params.membershipId;

    const result = await removeMember(user.userId, orgId, membershipId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function transferOrgOwnership(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;

    const result = await transferOwnership(user.userId, orgId, req.body.targetUserId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function listPendingInvitations(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;

    const result = await getPendingInvitations(user.userId, orgId);
    return res.status(result.success ? 200 : 403).json(result);
}

export async function cancelPendingInvite(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const invitationId = Array.isArray(req.params.invitationId) ? req.params.invitationId[0] : req.params.invitationId;

    const result = await cancelInvitation(user.userId, orgId, invitationId);
    return res.status(result.success ? 200 : 400).json(result);
}
