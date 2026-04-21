import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication, validateDraftFinancialApplication, validateRates, validateGetHistory } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, validateFinancialApplication, Controller.createApplication);
router.post('/draft', authenticate, validateDraftFinancialApplication, Controller.saveDraft);
router.put('/:id', authenticate, validateUpdateFinancialApplication, Controller.updateApplication);

// API to input or update rates on the borrower(boolean)
router.post('/rates/:id', authenticate, validateRates, Controller.saveRates);
router.put('/rates/:id', authenticate, validateRates, Controller.saveRates);

// Routes without validation
router.get('/list', Controller.getAllApplications);
router.get('/prototype-plans/:id/view', Controller.getPrototypePlanView);
router.get('/prototype-plans', Controller.getPrototypePlans);
router.get('/prototypes', Controller.getPrototypes);
router.get('/:id', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);
router.get('/:id/history', validateGetHistory, Controller.getApplicationHistory);

router.get('/template/:id', Controller.getTemplateById);
router.get('/template/:id/view-pdf',  Controller.viewTemplatePDF);
router.get('/template/:id/download', Controller.downloadTemplatePDF);
router.post('/template/:id/download', Controller.downloadTemplatePDF);

export default router;