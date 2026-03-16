import express from "express";
import * as Controller from '../../controllers/group_classification/group_Classification.controller.js';

const router = express.Router();

// Get all data
router.get("/", Controller.getAllClassifications);
// Get data by ID
router.get("/:id", Controller.getClassificationById);

export default router;