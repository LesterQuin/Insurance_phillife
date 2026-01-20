import express from "express"
import * as Controller from "../../controllers/group_plan/group_plan.controller.js"

const router = express.Router();
router.post("/", Controller.createPlan);
router.get("/", Controller.getAllPlans);
router.get("/:id", Controller.getPlanById);

export default router;