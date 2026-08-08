import { Router } from "express";
import {
    createOrg,
    getMemberships,
    getOrgDetails,
    updateOrgDetails,
    inviteUser,
    getInvite,
    acceptInvite,
} from "./organization.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
    createOrganizationSchema,
    updateOrganizationSchema,
    inviteUserSchema,
    acceptInviteSchema,
} from "./organization.validation.js";

const router = Router();

// Public invitation preview route
router.get("/invitations/preview", getInvite);

// Authenticated Organization & Membership routes
router.post("/", authenticate, validateRequest(createOrganizationSchema), createOrg);
router.get("/memberships", authenticate, getMemberships);
router.get("/:orgId", authenticate, getOrgDetails);
router.put("/:orgId", authenticate, validateRequest(updateOrganizationSchema), updateOrgDetails);
router.post("/:orgId/invite", authenticate, validateRequest(inviteUserSchema), inviteUser);
router.post("/invitations/accept", authenticate, validateRequest(acceptInviteSchema), acceptInvite);

export default router;
