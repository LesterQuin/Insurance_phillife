import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GCLIP_OUT.controller.js';
import { authenticate, isEbam } from '../../middlewares/authenticate.js';
import { checkTemplateType } from '../../middlewares/validateTemplate.js';

const router = express.Router();

router.use('/:id/policy-contract/outstanding', checkTemplateType('OUTSTANDING'));

// Unified GCLIP Outstanding Complete Contract API
router.get('/:id/policy-contract/outstanding', authenticate, Controller.getGclipData);
router.post('/:id/policy-contract/outstanding', authenticate, isEbam, Controller.saveGclipData);
router.put('/:id/policy-contract/outstanding', authenticate, isEbam, Controller.saveGclipData);

export default router;
