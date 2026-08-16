import { Router } from "express";
import {
    addUnit,
    listUnits,
    getUnit,
    editUnit,
    removeUnit,
    assignUser,
    removeUser,
} from "./units.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
    createUnitSchema,
    updateUnitSchema,
} from "./units.validation.js";

const router = Router({ mergeParams: true });

router.post("/", authenticate, validateRequest(createUnitSchema), addUnit);
router.get("/", authenticate, listUnits);
router.get("/:unitId", authenticate, getUnit);
router.put("/:unitId", authenticate, validateRequest(updateUnitSchema), editUnit);
router.delete("/:unitId", authenticate, removeUnit);
router.post("/:unitId/assign-user", authenticate, assignUser);
router.delete("/:unitId/users/:targetUserIdentifier", authenticate, removeUser);

export default router;

