import { Router } from "express";
import {
    addProperty,
    listProperties,
    getProperty,
    editProperty,
    removeProperty,
} from "./properties.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
    createPropertySchema,
    updatePropertySchema,
} from "./properties.validation.js";

const router = Router({ mergeParams: true });

router.post("/", authenticate, validateRequest(createPropertySchema), addProperty);
router.get("/", authenticate, listProperties);
router.get("/:propertyId", authenticate, getProperty);
router.put("/:propertyId", authenticate, validateRequest(updatePropertySchema), editProperty);
router.delete("/:propertyId", authenticate, removeProperty);

export default router;
