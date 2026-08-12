import express from 'express';
import * as Controller from '../../controllers/ebam_api/ebam_api.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = express.Router();

router.get('/:id/coc/view-pdf', Controller.viewCOCPDF);
router.get('/:id/coc/download', authenticate, Controller.downloadCOCPDF);

// EBAM Master Policy Contract Generation APIs
router.get('/:id/policy-contract/view-pdf', Controller.viewPolicyContractPDF); // view-pdf?watermark=true
router.get('/:id/policy-contract/download', Controller.downloadPolicyContractPDF); // download?watermark=true

// Special Underwriting Provisions Management APIs
router.get('/:id/policy-contract/underwriting-provisions', authenticate, Controller.getUnderwritingProvisions);
router.post('/:id/policy-contract/underwriting-provisions', authenticate, Controller.saveUnderwritingProvisions);
router.put('/:id/policy-contract/underwriting-provisions', authenticate, Controller.saveUnderwritingProvisions);

// Contribution Management APIs
router.get('/:id/policy-contract/contribution', authenticate, Controller.getContribution);
router.post('/:id/policy-contract/contribution', Controller.saveContribution);
router.put('/:id/policy-contract/contribution', authenticate, Controller.saveContribution);

export default router;
