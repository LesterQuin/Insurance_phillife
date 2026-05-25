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
router.post('/:id/download-excel', authenticate, parseMultipartForm, Controller.downloadExcelFile);
//router.put('/:id/prototype-status', authenticate, parseMultipartForm, Controller.updatePrototypeStatus);
router.put('/:id/status/checking', authenticate, Controller.setStatusChecking); // addtional with controller not tested
router.put('/:id/status/approved', authenticate, Controller.setStatusApproved); // addtional  with controller not tested

// Routes without validation
router.get('/list', authenticate, Controller.getAllApplications);
router.get('/check-group-name', authenticate, Controller.checkGroupName);
router.get('/prototype-plans/:id/view', Controller.getPrototypePlanView);
router.get('/prototype-plans', authenticate, Controller.getPrototypePlans);
router.get('/prototypes', authenticate, Controller.getPrototypes);
router.get('/:id', authenticate, Controller.getApplicationById);
// router.get('/:id(\\d+)', Controller.getApplicationById);
router.delete('/:id', authenticate, Controller.deleteApplication);
router.get('/:id/history', authenticate, validateGetHistory, Controller.getApplicationHistory);

router.get('/template/:id', authenticate, Controller.getTemplateById);
router.get('/template/:id/view-pdf',  Controller.viewTemplatePDF);
router.get('/template/:id/download', Controller.downloadTemplatePDF);
router.post('/template/:id/download', Controller.downloadTemplatePDF);

export default router;