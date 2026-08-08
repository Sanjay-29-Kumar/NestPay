import { Router } from "express";
import {
    addDocument,
    listDocuments,
    removeDocument,
} from "./documents.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { authenticate } from "../../middleware/authenticate.js";
import { createDocumentSchema } from "./documents.validation.js";

const router = Router({ mergeParams: true });

router.post("/", authenticate, validateRequest(createDocumentSchema), addDocument);
router.get("/", authenticate, listDocuments);
router.delete("/:docId", authenticate, removeDocument);

export default router;
