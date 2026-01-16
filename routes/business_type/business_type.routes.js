import express from "express";
import * as Controller from "../../controllers/business_type/business_type.controller.js"

const router = express.Router();

router.post("/", Controller.createBusinessType);
router.get("/", Controller.getAllBusinessTypes);

export default router;