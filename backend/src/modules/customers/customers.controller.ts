import { Request, Response } from "express";
import {
    createCustomer,
    getCustomers,
    assignCustomerToUnit,
    updateCustomer,
    deleteCustomer,
    getMyResidence,
    addUserToUnit,
    getUsersGroupedByUnit,
    createFamilyRequest,
    getFamilyRequests,
    approveFamilyRequest,
    rejectFamilyRequest,
} from "./customers.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function listMyResidence(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await getMyResidence(user.userId, orgId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function addCustomer(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await createCustomer(user.userId, orgId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function listCustomers(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const search = req.query.search as string | undefined;
    const propertyId = req.query.propertyId as string | undefined;
    const unitId = req.query.unitId as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await getCustomers(user.userId, orgId, search, propertyId, unitId, status);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function assignUnit(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;

    const result = await assignCustomerToUnit(user.userId, orgId, customerId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function editCustomer(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;

    const result = await updateCustomer(user.userId, orgId, customerId, req.body);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function removeCustomer(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const customerId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;

    const result = await deleteCustomer(user.userId, orgId, customerId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function addUserToUnitHandler(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const unitId = Array.isArray(req.params.unitId) ? req.params.unitId[0] : req.params.unitId;

    const result = await addUserToUnit(user.userId, orgId, unitId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function listUsersGroupedByUnit(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await getUsersGroupedByUnit(user.userId, orgId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function submitFamilyRequest(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await createFamilyRequest(user.userId, orgId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function listFamilyRequests(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await getFamilyRequests(user.userId, orgId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function approveFamilyRequestController(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;

    const result = await approveFamilyRequest(user.userId, orgId, requestId);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function rejectFamilyRequestController(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const requestId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
    const reason = req.body.reason;

    const result = await rejectFamilyRequest(user.userId, orgId, requestId, reason);
    return res.status(result.success ? 200 : 400).json(result);
}

