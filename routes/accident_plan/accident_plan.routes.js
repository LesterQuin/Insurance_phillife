import express from "express";
import * as Controller from "../../controllers/accident_plan/accident_plan_controller.js"

const router = express.Router();

router.post("/", Controller.createPlan);
router.get("/plans", Controller.getAllPlans);
router.put("/plans/:id", Controller.updatePlan);
router.delete("/plans/:id", Controller.deletePlan);

export default router;