import express from 'express';
import * as Controller from '../../controllers/ebam_api/ebam_api.controller.js';
import { updateEbamStatusController } from '../../controllers/ebam_api/contract_GCLIP_OUT.controller.js';
import { authenticate, isEbam } from '../../middlewares/authenticate.js';
import contractGCLIPRoutes from './contract_GCLIP_OUT.routes.js';
import contractGCLIPPrinRoutes from './contract_GCLIP_PRIN.routes.js';
import contractGPARoutes from './contract_GPA.routes.js';

const router = express.Router();

router.get('/:id/coc/view-pdf', Controller.viewCOCPDF);
router.get('/:id/coc/download', authenticate, Controller.downloadCOCPDF);

// EBAM Master Policy Contract Generation APIs
router.get('/:id/policy-contract/view-pdf', Controller.viewPolicyContractPDF); // view-pdf?watermark=true
router.get('/:id/policy-contract/download', Controller.downloadPolicyContractPDF); // download?watermark=true
router.patch('/:id/policy-contract/status', authenticate, isEbam, updateEbamStatusController);
router.get('/statuses', authenticate, isEbam, Controller.getEbamStatusList);

// EBAM Master Policy Contract TAT (Turn-Around Time) APIs
router.get('/:id/policy-contract/tat', authenticate, isEbam, Controller.getContractTatController);
router.put('/:id/policy-contract/tat', authenticate, isEbam, Controller.saveContractTatController);
router.delete('/:id/policy-contract/tat', authenticate, isEbam, Controller.resetContractTatController);

// EBAM Master Policy Contract Signing Address APIs
router.get('/:id/policy-contract/signing-address', authenticate, Controller.getContractSigningAddressController);
router.put('/:id/policy-contract/signing-address', authenticate, isEbam, Controller.saveContractSigningAddressController);
router.delete('/:id/policy-contract/signing-address', authenticate, isEbam, Controller.resetContractSigningAddressController);

// EBAM Master Policy Contract Document Code (Cover Page bottom left) APIs
router.get('/:id/policy-contract/doc-code', authenticate, Controller.getContractDocCodeController);
router.put('/:id/policy-contract/doc-code', authenticate, isEbam, Controller.saveContractDocCodeController);
router.delete('/:id/policy-contract/doc-code', authenticate, isEbam, Controller.clearContractDocCodeController);

// Mount GCLIP Outstanding policy contract endpoints
router.use(contractGCLIPRoutes);

// Mount GCLIP Principal policy contract endpoints
router.use(contractGCLIPPrinRoutes);

// Mount GPA GADDP policy contract endpoints
router.use(contractGPARoutes);

export default router;
