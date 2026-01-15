import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateApplication } from '../middlewares/validate.js';

const router = express.Router();

// CRUD
router.post('/create', validateApplication, Controller.createApplication);
router.get('/list', Controller.getAllApplications);
router.get('/:id', Controller.getApplicationById);
router.put('/:id', validateApplication, Controller.updateApplication);
// router.delete('/:id', Controller.deleteApplication);

// // Export
// router.get('/export', Controller.exportApplications);

export default router;
