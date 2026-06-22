import express from "express";
import * as Controller from "../../controllers/financial_insurance_group_lookups/financial_insurance_group_lookups.controller.js";

const router = express.Router();

// get by category
router.get("/category/GROUP_CLASSIFICATION", Controller.getByGroupClassification);
router.get("/category/BUSINESS_TYPE", Controller.getByBusinessType);
router.get("/category/TYPE_OF_GROUP", Controller.getByTypeOfGroup);
router.get("/category/MODE_OF_PAYMENT", Controller.getByModeOfPayment);
router.get("/category/AGE_PROFILE", Controller.getByAgeProfile);
router.get("/category/TYPE_OF_PROPOSAL", Controller.getByTypeOfProposal);
router.get("/category/COVERAGE_TYPE", Controller.getByCoverageType);
router.get("/category/COVERAGE_MULTIPLIER", Controller.getByCoverageMultiplier);
router.get("/category/LOAN_AMOUNT_TYPE", Controller.getByLoanAmountType);
router.get("/category/PAYMENT_TERM", Controller.getByPaymentTerm);
router.get("/category/PAYMENT_YEAR", Controller.getByPaymentYear);
router.get("/category/CHANNEL_TYPE", Controller.getByChannelType);
router.get("/category/STATUS_PROPOSAL", Controller.getByStatusProposal);

// Get by ID
router.get("/name/:id", Controller.getById);

// Get All
router.get("/", Controller.getAll);

export default router;