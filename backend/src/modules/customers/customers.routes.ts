import { Router } from "express";
import {
    addCustomer,
    listCustomers,
    assignUnit,
    editCustomer,
    removeCustomer,
    listMyResidence,
    addUserToUnitHandler,
    listUsersGroupedByUnit,
    submitFamilyRequest,
    listFamilyRequests,
    approveFamilyRequestController,
    rejectFamilyRequestController,
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
router.get("/grouped-by-unit", authenticate, listUsersGroupedByUnit);
router.post("/units/:unitId/add-user", authenticate, addUserToUnitHandler);
router.post("/family-requests", authenticate, submitFamilyRequest);
router.get("/family-requests", authenticate, listFamilyRequests);
router.post("/family-requests/:requestId/approve", authenticate, approveFamilyRequestController);
router.post("/family-requests/:requestId/reject", authenticate, rejectFamilyRequestController);
router.post("/", authenticate, validateRequest(createCustomerSchema), addCustomer);
router.get("/", authenticate, listCustomers);
router.post("/:customerId/assign-unit", authenticate, validateRequest(assignUnitSchema), assignUnit);
router.put("/:customerId", authenticate, validateRequest(updateCustomerSchema), editCustomer);
router.delete("/:customerId", authenticate, removeCustomer);

export default router;

