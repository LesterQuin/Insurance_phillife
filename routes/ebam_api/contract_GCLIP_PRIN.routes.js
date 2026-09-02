import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GCLIP_PRIN.controller.js';
import { authenticate, isEbam } from '../../middlewares/authenticate.js';
import { checkTemplateType } from '../../middlewares/validateTemplate.js';

const router = express.Router();

router.use('/:id/policy-contract/principal', checkTemplateType('PRINCIPAL'));

// Unified GCLIP Principal Complete Contract API
router.get('/:id/policy-contract/principal', authenticate, Controller.getGclipData);
router.post('/:id/policy-contract/principal', authenticate, isEbam, Controller.saveGclipData);
router.put('/:id/policy-contract/principal', authenticate, isEbam, Controller.saveGclipData);

export default router;
