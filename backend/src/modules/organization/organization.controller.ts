import { Request, Response } from "express";
import {
    createOrganization,
    getUserMemberships,
    getOrganizationById,
    updateOrganization,
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

export async function getOrgDetails(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await getOrganizationById(user.userId, orgId);
    const status = result.success ? 200 : result.message?.includes("Unauthorized") ? 403 : 404;
    return res.status(status).json(result);
}

export async function updateOrgDetails(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await updateOrganization(user.userId, orgId, req.body);
    const status = result.success ? 200 : result.message?.includes("Unauthorized") ? 403 : 400;
    return res.status(status).json(result);
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

export async function getWhatsAppConfigController(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { getWhatsAppConfig } = await import("./organization.service.js");
    const result = await getWhatsAppConfig(user.userId, orgId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function updateWhatsAppConfigController(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { updateWhatsAppConfig } = await import("./organization.service.js");
    const result = await updateWhatsAppConfig(user.userId, orgId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function sendTestNotificationController(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const { sendTestNotification } = await import("./organization.service.js");
    const result = await sendTestNotification(user.userId, orgId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}
