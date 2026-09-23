import { Router } from "express";
import {
    createOrg,
    getMemberships,
    getOrgDetails,
    updateOrgDetails,
    inviteUser,
    getInvite,
    acceptInvite,
    getWhatsAppConfigController,
    updateWhatsAppConfigController,
    sendTestNotificationController,
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

router.get("/:orgId/whatsapp-config", authenticate, getWhatsAppConfigController);
router.put("/:orgId/whatsapp-config", authenticate, updateWhatsAppConfigController);
router.post("/:orgId/test-dispatch", authenticate, sendTestNotificationController);

export default router;
