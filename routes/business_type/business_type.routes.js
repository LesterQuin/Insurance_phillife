import express from "express";
import * as Controller from "../../controllers/business_type/business_type.controller.js"

const router = express.Router();

router.get("/", Controller.getAllBusinessTypes);
router.get("/:id", Controller.getBusinessTypeById);
export default router;