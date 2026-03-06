import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication } from '../middlewares/validate.js';

const router = express.Router();

// Apply validation middleware before the controller
router.post('/create', validateFinancialApplication, Controller.createApplication);
router.put('/:id', validateUpdateFinancialApplication, Controller.updateApplication);

// Routes without validation
router.get('/list', Controller.getAllApplications);
router.get('/:id', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);

export default router;