import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication, validateDraftFinancialApplication, validateRates, validateGetHistory, validateTotalPremium, validateMaxAmounts, validateEvidenceNotes, validateExcelUpload } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import parseMultipartForm from '../middlewares/fileUpload.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, parseMultipartForm, validateFinancialApplication, Controller.createApplication);
router.post('/draft', authenticate, parseMultipartForm, validateDraftFinancialApplication, Controller.saveDraft);
router.put('/:id', authenticate, parseMultipartForm, validateUpdateFinancialApplication, Controller.updateApplication);
router.post('/:id/upload-excel', authenticate, parseMultipartForm, validateExcelUpload, Controller.uploadExcelFile);
router.post('/:id/download-excel', authenticate, Controller.downloadExcelFile);

// Routes without validation
router.get('/list', Controller.getAllApplications);
router.get('/prototype-plans/:id/view', Controller.getPrototypePlanView);
router.get('/prototype-plans', Controller.getPrototypePlans);
router.get('/prototypes', Controller.getPrototypes);
router.get('/:id', Controller.getApplicationById);
// router.get('/:id(\\d+)', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);
router.get('/:id/history', validateGetHistory, Controller.getApplicationHistory);

router.get('/template/:id', Controller.getTemplateById);
router.get('/template/:id/view-pdf',  Controller.viewTemplatePDF);
router.get('/template/:id/download', Controller.downloadTemplatePDF);
router.post('/template/:id/download', Controller.downloadTemplatePDF);

export default router;