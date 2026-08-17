import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GCLIP_PRIN.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkTemplateType } from '../../middlewares/validateTemplate.js';

const router = express.Router();

router.use('/:id', checkTemplateType('PRINCIPAL'));

// Underwriting Limits Table Parameters Management APIs
router.get('/:id/policy-contract/principal/underwriting-limits', Controller.getUnderwritingLimits);
router.post('/:id/policy-contract/principal/underwriting-limits', Controller.saveUnderwritingLimits);
router.put('/:id/policy-contract/principal/underwriting-limits', authenticate, Controller.saveUnderwritingLimits);

// Contribution Management APIs
router.get('/:id/policy-contract/principal/contribution', authenticate, Controller.getContribution);
router.post('/:id/policy-contract/principal/contribution', Controller.saveContribution);
router.put('/:id/policy-contract/principal/contribution', authenticate, Controller.saveContribution);

// Eligible Individuals Management APIs
router.get('/:id/policy-contract/principal/eligible-individuals', authenticate, Controller.getEligibleIndividuals);
router.post('/:id/policy-contract/principal/eligible-individuals', Controller.saveEligibleIndividuals);
router.put('/:id/policy-contract/principal/eligible-individuals', Controller.saveEligibleIndividuals);

// Participation Requirements Management APIs
router.get('/:id/policy-contract/principal/participation-requirements', authenticate, Controller.getParticipationRequirements);
router.post('/:id/policy-contract/principal/participation-requirements', Controller.saveParticipationRequirements);
router.put('/:id/policy-contract/principal/participation-requirements', authenticate, Controller.saveParticipationRequirements);

// Special Underwriting Provisions Sections Management APIs
router.get('/:id/policy-contract/principal/special-provisions', authenticate, Controller.getSpecialProvisions);
router.post('/:id/policy-contract/principal/special-provisions', Controller.saveSpecialProvisions);
router.put('/:id/policy-contract/principal/special-provisions', authenticate, Controller.saveSpecialProvisions);

// Unified Schedule of Insurance APIs
router.get('/:id/policy-contract/principal/schedule-of-insurance', authenticate, Controller.getScheduleOfInsurance);
router.post('/:id/policy-contract/principal/schedule-of-insurance', Controller.saveScheduleOfInsurance);
router.put('/:id/policy-contract/principal/schedule-of-insurance', Controller.saveScheduleOfInsurance);

export default router;
