import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication, validateRates } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, validateFinancialApplication, Controller.createApplication);
router.put('/:id', authenticate, validateUpdateFinancialApplication, Controller.updateApplication);
router.get('/:id', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);
router.get('/list', Controller.getAllApplications);

// API to input or update rates on the borrower(boolean)
router.post('/rates/:id', authenticate, validateRates, Controller.saveRates);
router.put('/rates/:id', authenticate, validateRates, Controller.saveRates);

// API to get prototype plan view
router.get('/prototype-plans/:id', Controller.getPrototypePlanView);
//router.get('/prototype-plans/', Controller.getAllPrototypePlan);

// API to get template of plans
router.get('/template/:id', Controller.getTemplateById);

export default router;