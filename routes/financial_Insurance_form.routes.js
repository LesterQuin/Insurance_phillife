import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication, validateRates } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, validateFinancialApplication, Controller.createApplication);
router.put('/:id', authenticate, validateUpdateFinancialApplication, Controller.updateApplication);

// New API to input rates on the borrower
router.post('/rates', authenticate, validateRates, Controller.saveRates);

// Routes without validation
router.get('/list', Controller.getAllApplications);
router.get('/prototype-plans/:id/view', Controller.getPrototypePlanView);
router.get('/:id', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);

router.get('/template/:id', Controller.getTemplateById);

export default router;