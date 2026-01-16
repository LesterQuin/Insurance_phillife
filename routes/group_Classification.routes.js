import express from "express";
import * as Controller from '../controllers/group_Classification.controller.js';

const router = express.Router();

// Get all data
router.get("/", Controller.getAllClassifications);
// Get data by ID
router.get("/:id", Controller.getClassificationById);
// Create data
router.post("/", Controller.createClassification);
// Update the data
router.put("/:id", Controller.updateClassification);
// Delete data
router.delete("/:id", Controller.deleteClassification);

export default router;