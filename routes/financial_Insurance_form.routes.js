import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication, validateDraftFinancialApplication, validateRates, validateGetHistory, validateTotalPremium, validateMaxAmounts } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import parseMultipartForm from '../middlewares/fileUpload.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, parseMultipartForm, validateFinancialApplication, Controller.createApplication);
router.post('/draft', authenticate, validateDraftFinancialApplication, Controller.saveDraft);
router.put('/:id', authenticate, parseMultipartForm, validateUpdateFinancialApplication, Controller.updateApplication);

// API to input or update rates on the borrower(boolean)
router.get('/rates/queue', authenticate, Controller.getApplicationsPendingRates);
router.post('/rates/:id', authenticate, validateRates, Controller.saveRates);
router.put('/rates/:id', authenticate, validateRates, Controller.saveRates);

// API to input total annual premium
router.get('/total-premium/queue', authenticate, Controller.getApplicationsPendingTotalPremium);
router.post('/total-premium/:id', authenticate, validateTotalPremium, Controller.saveTotalAnnualPremium);
router.put('/total-premium/:id', authenticate, validateTotalPremium, Controller.saveTotalAnnualPremium);

// API to input max loan amounts
// router.get('/max-amounts/queue', authenticate, Controller.getApplicationsPendingMaxAmounts);
// router.post('/max-amounts/:id', authenticate, validateMaxAmounts, Controller.saveMaxAmounts);
// router.put('/max-amounts/:id', authenticate, validateMaxAmounts, Controller.saveMaxAmounts);

// Routes without validation
router.get('/list', Controller.getAllApplications);
router.get('/prototype-plans/:id/view', Controller.getPrototypePlanView);
router.get('/prototype-plans', Controller.getPrototypePlans);
router.get('/prototypes', Controller.getPrototypes);
router.get('/industries', Controller.getIndustries);
router.get('/:id', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);
router.get('/:id/history', validateGetHistory, Controller.getApplicationHistory);

router.get('/template/:id', Controller.getTemplateById);
router.get('/template/:id/view-pdf',  Controller.viewTemplatePDF);
router.get('/template/:id/download', Controller.downloadTemplatePDF);
router.post('/template/:id/download', Controller.downloadTemplatePDF);

export default router;