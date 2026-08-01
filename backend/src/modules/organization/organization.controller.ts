import { Request, Response } from "express";
import {
    createOrganization,
    getUserMemberships,
    inviteUserToOrganization,
    getInvitationDetails,
    acceptInvitation,
} from "./organization.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function createOrg(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await createOrganization(user.userId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function getMemberships(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await getUserMemberships(user.userId);
    return res.status(200).json(result);
}

export async function inviteUser(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await inviteUserToOrganization(user.userId, orgId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function getInvite(req: Request, res: Response) {
    const rawToken = req.query.token || req.params.token;
    const token = Array.isArray(rawToken) ? String(rawToken[0]) : String(rawToken || "");
    const result = await getInvitationDetails(token);
    return res.status(result.success ? 200 : 404).json(result);
}

export async function acceptInvite(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { token } = req.body;
    const result = await acceptInvitation(user.userId, token);
    return res.status(result.success ? 200 : 400).json(result);
}
