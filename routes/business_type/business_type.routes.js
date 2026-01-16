import express from "express";
import * as Controller from "../../controllers/business_type/business_type.controller.js"

const router = express.Router();

router.post("/", Controller.createBusinessType);
router.get("/", Controller.getAllBusinessTypes);
router.get("/:id", Controller.getBusinessTypeById);
router.put("/:id", Controller.updateBusinessType)
router.delete("/:id", Controller.deleteBusinessType);
export default router;