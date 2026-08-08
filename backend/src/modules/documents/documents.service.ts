import DocumentVault from "../../models/DocumentVault.js";
import Membership from "../../models/Membership.js";
import { CreateDocumentInput } from "./documents.types.js";

export async function createDocumentRecord(
    userId: string,
    orgId: string,
    data: CreateDocumentInput
) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized." };
    }

    const doc = await DocumentVault.create({
        ...data,
        organizationId: orgId,
        uploadedByUserId: userId,
    });

    return {
        success: true,
        message: "Document metadata recorded successfully.",
        data: doc,
    };
}

export async function getDocuments(
    userId: string,
    orgId: string,
    search?: string,
    typeFilter?: string
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
    if (typeFilter) query.documentType = typeFilter;
    if (search) {
        query.title = { $regex: search, $options: "i" };
    }

    const documents = await DocumentVault.find(query)
        .populate("relatedPropertyId", "name code")
        .populate("relatedUnitId", "unitNumber")
        .populate("relatedCustomerId", "name email")
        .populate("uploadedByUserId", "name email")
        .sort({ createdAt: -1 })
        .exec();

    const totalDocs = await DocumentVault.countDocuments({ organizationId: orgId });

    return {
        success: true,
        data: {
            documents,
            totalDocs,
        },
    };
}

export async function deleteDocumentRecord(userId: string, orgId: string, docId: string) {
    const membership = await Membership.findOne({
        userId,
        organizationId: orgId,
        role: { $in: ["OWNER", "ADMIN", "MANAGER"] },
        status: "ACTIVE",
    });

    if (!membership) {
        return { success: false, message: "Unauthorized: Only Owners, Admins, or Managers can delete documents." };
    }

    await DocumentVault.findOneAndDelete({ _id: docId, organizationId: orgId });
    return { success: true, message: "Document removed." };
}
