import express from 'express';
import * as Controller from '../../controllers/ebam_api/ebam_api.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import contractGCLIPRoutes from './contract_GCLIP_OUT.routes.js';
import contractGCLIPPrinRoutes from './contract_GCLIP_PRIN.routes.js';

const router = express.Router();

router.get('/:id/coc/view-pdf', Controller.viewCOCPDF);
router.get('/:id/coc/download', authenticate, Controller.downloadCOCPDF);

// EBAM Master Policy Contract Generation APIs
router.get('/:id/policy-contract/view-pdf', Controller.viewPolicyContractPDF); // view-pdf?watermark=true
router.get('/:id/policy-contract/download', Controller.downloadPolicyContractPDF); // download?watermark=true

// Mount GCLIP Outstanding policy contract endpoints
router.use(contractGCLIPRoutes);

// Mount GCLIP Principal policy contract endpoints
router.use(contractGCLIPPrinRoutes);

export default router;
