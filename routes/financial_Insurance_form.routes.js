import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, validateFinancialApplication, Controller.createApplication);
router.put('/:id', authenticate, validateUpdateFinancialApplication, Controller.updateApplication);

// Routes without validation
router.get('/list', Controller.getAllApplications);
router.get('/:id', Controller.getApplicationById);
router.delete('/:id', Controller.deleteApplication);

router.get('/template/:id', Controller.getTemplateById);

export default router;