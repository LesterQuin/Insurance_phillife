import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GPA.controller.js';
import { authenticate, isEbam } from '../../middlewares/authenticate.js';
import { checkTemplateType } from '../../middlewares/validateTemplate.js';

const router = express.Router();

router.use('/:id/policy-contract/gpa', checkTemplateType('GPA'));

// Unified GPA Complete Contract API
router.get('/:id/policy-contract/gpa', authenticate, Controller.getGpaData);
router.post('/:id/policy-contract/gpa', authenticate, isEbam, Controller.saveGpaData);
router.put('/:id/policy-contract/gpa', authenticate, isEbam, Controller.saveGpaData);

export default router;
