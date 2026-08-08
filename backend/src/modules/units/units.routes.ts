import { Router } from "express";
import {
    addUnit,
    listUnits,
    editUnit,
    removeUnit,
    assignUser,
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
router.put("/:unitId", authenticate, validateRequest(updateUnitSchema), editUnit);
router.delete("/:unitId", authenticate, removeUnit);
router.post("/:unitId/assign-user", authenticate, assignUser);

export default router;

