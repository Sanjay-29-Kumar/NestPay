import { Router } from "express";
import {
    listMembers,
    editRole,
    changeStatus,
    deleteMember,
    transferOrgOwnership,
    listPendingInvitations,
    cancelPendingInvite,
} from "./members.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
    editRoleSchema,
    updateMemberStatusSchema,
    transferOwnershipSchema,
} from "./members.validation.js";

const router = Router({ mergeParams: true });

router.get("/", authenticate, listMembers);
router.put("/:membershipId/role", authenticate, validateRequest(editRoleSchema), editRole);
router.put("/:membershipId/status", authenticate, validateRequest(updateMemberStatusSchema), changeStatus);
router.delete("/:membershipId", authenticate, deleteMember);
router.post("/transfer-ownership", authenticate, validateRequest(transferOwnershipSchema), transferOrgOwnership);
router.get("/invitations", authenticate, listPendingInvitations);
router.delete("/invitations/:invitationId", authenticate, cancelPendingInvite);

export default router;
