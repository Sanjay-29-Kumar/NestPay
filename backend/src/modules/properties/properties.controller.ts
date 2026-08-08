import { Request, Response } from "express";
import {
    createProperty,
    getProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
} from "./properties.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function addProperty(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await createProperty(user.userId, orgId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function listProperties(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const search = req.query.search as string | undefined;
    const typeFilter = req.query.type as string | undefined;
    const statusFilter = req.query.status as string | undefined;

    const result = await getProperties(user.userId, orgId, search, typeFilter, statusFilter);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function getProperty(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;

    const result = await getPropertyById(user.userId, orgId, propertyId);
    return res.status(result.success ? 200 : 404).json(result);
}

export async function editProperty(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;

    const result = await updateProperty(user.userId, orgId, propertyId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function removeProperty(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const propertyId = Array.isArray(req.params.propertyId) ? req.params.propertyId[0] : req.params.propertyId;

    const result = await deleteProperty(user.userId, orgId, propertyId);
    return res.status(result.success ? 200 : 400).json(result);
}
