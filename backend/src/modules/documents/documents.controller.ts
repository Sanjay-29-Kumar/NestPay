import { Request, Response } from "express";
import {
    createDocumentRecord,
    getDocuments,
    deleteDocumentRecord,
} from "./documents.service.js";
import { AuthenticatedRequest } from "../../middleware/authenticate.js";

export async function addDocument(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const result = await createDocumentRecord(user.userId, orgId, req.body);
    return res.status(result.success ? 201 : 400).json(result);
}

export async function listDocuments(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const search = req.query.search as string | undefined;
    const type = req.query.type as string | undefined;

    const result = await getDocuments(user.userId, orgId, search, type);
    return res.status(result.success ? 200 : 400).json(result);
}

export async function removeDocument(req: Request, res: Response) {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const orgId = Array.isArray(req.params.orgId) ? req.params.orgId[0] : req.params.orgId;
    const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;

    const result = await deleteDocumentRecord(user.userId, orgId, docId);
    return res.status(result.success ? 200 : 400).json(result);
}
