import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GCLIP_OUT.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkTemplateType } from '../../middlewares/validateTemplate.js';

const router = express.Router();

router.use('/:id', checkTemplateType('OUTSTANDING'));

// Underwriting Limits Table Parameters Management APIs
router.get('/:id/policy-contract/outstanding/underwriting-limits', Controller.getUnderwritingLimits);
router.post('/:id/policy-contract/outstanding/underwriting-limits', Controller.saveUnderwritingLimits); // done
router.put('/:id/policy-contract/outstanding/underwriting-limits', authenticate, Controller.saveUnderwritingLimits);

// Contribution Management APIs
router.get('/:id/policy-contract/outstanding/contribution', authenticate, Controller.getContribution);
router.post('/:id/policy-contract/outstanding/contribution', Controller.saveContribution); // done
router.put('/:id/policy-contract/outstanding/contribution', authenticate, Controller.saveContribution);

// Eligible Individuals Management APIs
router.get('/:id/policy-contract/outstanding/eligible-individuals', authenticate, Controller.getEligibleIndividuals);
router.post('/:id/policy-contract/outstanding/eligible-individuals', Controller.saveEligibleIndividuals); // done
router.put('/:id/policy-contract/outstanding/eligible-individuals', Controller.saveEligibleIndividuals);

// Participation Requirements Management APIs
router.get('/:id/policy-contract/outstanding/participation-requirements', authenticate, Controller.getParticipationRequirements);
router.post('/:id/policy-contract/outstanding/participation-requirements', Controller.saveParticipationRequirements); // done
router.put('/:id/policy-contract/outstanding/participation-requirements', authenticate, Controller.saveParticipationRequirements);

// Special Underwriting Provisions Sections Management APIs
router.get('/:id/policy-contract/outstanding/special-provisions', authenticate, Controller.getSpecialProvisions);
router.post('/:id/policy-contract/outstanding/special-provisions', Controller.saveSpecialProvisions);
router.put('/:id/policy-contract/outstanding/special-provisions', authenticate, Controller.saveSpecialProvisions);

// Unified Schedule of Insurance APIs
router.get('/:id/policy-contract/outstanding/schedule-of-insurance', authenticate, Controller.getScheduleOfInsurance);
router.post('/:id/policy-contract/outstanding/schedule-of-insurance', Controller.saveScheduleOfInsurance); // done
router.put('/:id/policy-contract/outstanding/schedule-of-insurance', Controller.saveScheduleOfInsurance);

export default router;
