import express from "express";
import * as Controller from '../controllers/group_Classification.controller.js';

const router = express.Router();

router.get("/", Controller.getAllClassifications)
router.post("/", Controller.createClassification);
router.get("/:id", Controller.getClassificationById);
router.put("/:id", Controller.updateClassification);

export default router;