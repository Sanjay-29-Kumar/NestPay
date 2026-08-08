import { Router } from "express";
import {
    addCustomer,
    listCustomers,
    assignUnit,
    editCustomer,
    removeCustomer,
    listMyResidence,
} from "./customers.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
    createCustomerSchema,
    updateCustomerSchema,
    assignUnitSchema,
} from "./customers.validation.js";

const router = Router({ mergeParams: true });

router.get("/my-residence", authenticate, listMyResidence);
router.post("/", authenticate, validateRequest(createCustomerSchema), addCustomer);
router.get("/", authenticate, listCustomers);
router.post("/:customerId/assign-unit", authenticate, validateRequest(assignUnitSchema), assignUnit);
router.put("/:customerId", authenticate, validateRequest(updateCustomerSchema), editCustomer);
router.delete("/:customerId", authenticate, removeCustomer);

export default router;
