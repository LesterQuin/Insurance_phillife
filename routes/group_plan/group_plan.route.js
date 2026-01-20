import express from "express"
import * as Controller from "../../controllers/group_plan/group_plan.controller.js"

const router = express.Router();
router.post("/", Controller.createPlan);
router.get("/", Controller.getAllPlans);

export default router;