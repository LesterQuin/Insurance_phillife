import express from 'express';
import * as Controller from '../../controllers/ebam_api/ebam_api.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = express.Router();

router.get('/:id/coc/view-pdf', authenticate, Controller.viewCOCPDF);
router.get('/:id/coc/download', authenticate, Controller.downloadCOCPDF);

// EBAM Master Policy Contract Generation APIs
router.get('/:id/policy-contract/view-pdf', Controller.viewPolicyContractPDF);
router.get('/:id/policy-contract/download', Controller.downloadPolicyContractPDF);

export default router;
