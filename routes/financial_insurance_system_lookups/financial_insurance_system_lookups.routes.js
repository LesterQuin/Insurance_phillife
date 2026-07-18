import express from "express";
import * as Controller from "../../controllers/financial_insurance_system_lookups/financial_insurance_system_lookups.controller.js";
import { validateSystemLookup, injectCategory } from "../../middlewares/validate.js";
import { authenticate, isSuperAdmin } from '../../middlewares/authenticate.js';

const router = express.Router();

// Get All
router.get("/", Controller.getAll);

// Get all categories
router.get("/categories", Controller.getCategories);

// Get by Category
router.get("/category/ROLE", Controller.getByRole);
router.get("/category/DEPARTMENT", Controller.getByDepartment);
router.get("/category/LOCATION", Controller.getByLocation);

// Get by ID
router.get("/:id", Controller.getById);

// Create - Restricted to Super Admin
router.post("/category/ROLE", authenticate, isSuperAdmin, injectCategory("ROLE"), validateSystemLookup, Controller.create);
router.post("/category/DEPARTMENT", authenticate, isSuperAdmin, injectCategory("DEPARTMENT"), validateSystemLookup, Controller.create);
router.post("/category/LOCATION", authenticate, isSuperAdmin, injectCategory("LOCATION"), validateSystemLookup, Controller.create);

// Update - Restricted to Super Admin
router.put("/:id", authenticate, isSuperAdmin, Controller.update);

// Delete - Restricted to Super Admin
router.delete("/:id", authenticate, isSuperAdmin, Controller.deleteLookup);

export default router;
