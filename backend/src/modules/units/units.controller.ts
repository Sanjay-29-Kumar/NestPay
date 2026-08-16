import { Request, Response } from "express";
import {
    createUnit,
    getUnits,
    getSingleUnit,
    updateUnit,
    deleteUnit,
    assignUserToUnit,
    removeUserFromUnit,
} from "./units.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function addUnit(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await createUnit(user.userId, orgId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function listUnits(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const propertyId = req.query.propertyId as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await getUnits(user.userId, orgId, propertyId, status, search);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function getUnit(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await getSingleUnit(user.userId, orgId, unitId);
    return res.status(result.success ? 200 : 404).json(result);
}

export async function editUnit(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await updateUnit(user.userId, orgId, unitId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function removeUnit(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await deleteUnit(user.userId, orgId, unitId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function assignUser(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await assignUserToUnit(user.userId, orgId, unitId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function removeUser(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;
    const targetUserIdentifier = Array.isArray(req.params.targetUserIdentifier)
        ? req.params.targetUserIdentifier[0]
        : req.params.targetUserIdentifier;

    const result = await removeUserFromUnit(user.userId, orgId, unitId, targetUserIdentifier);
    return res.status(result.success ? 200 : 400).json(result);
}

