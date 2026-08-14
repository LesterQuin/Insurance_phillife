import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GCLIP_OUT.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = express.Router();

// Underwriting Limits Table Parameters Management APIs
router.get('/:id/policy-contract/underwriting-limits', Controller.getUnderwritingLimits);
router.post('/:id/policy-contract/underwriting-limits', Controller.saveUnderwritingLimits); // done
router.put('/:id/policy-contract/underwriting-limits', authenticate, Controller.saveUnderwritingLimits);

// Contribution Management APIs
router.get('/:id/policy-contract/contribution', authenticate, Controller.getContribution);
router.post('/:id/policy-contract/contribution', Controller.saveContribution); // done
router.put('/:id/policy-contract/contribution', authenticate, Controller.saveContribution);

// Eligible Individuals Management APIs
router.get('/:id/policy-contract/eligible-individuals', authenticate, Controller.getEligibleIndividuals);
router.post('/:id/policy-contract/eligible-individuals', Controller.saveEligibleIndividuals); // done
router.put('/:id/policy-contract/eligible-individuals', Controller.saveEligibleIndividuals);

// Participation Requirements Management APIs
router.get('/:id/policy-contract/participation-requirements', authenticate, Controller.getParticipationRequirements);
router.post('/:id/policy-contract/participation-requirements', Controller.saveParticipationRequirements); // done
router.put('/:id/policy-contract/participation-requirements', authenticate, Controller.saveParticipationRequirements);

// Special Underwriting Provisions Sections Management APIs
router.get('/:id/policy-contract/special-provisions', authenticate, Controller.getSpecialProvisions);
router.post('/:id/policy-contract/special-provisions', Controller.saveSpecialProvisions);
router.put('/:id/policy-contract/special-provisions', authenticate, Controller.saveSpecialProvisions);

// Unified Schedule of Insurance APIs
router.get('/:id/policy-contract/schedule-of-insurance', authenticate, Controller.getScheduleOfInsurance);
router.post('/:id/policy-contract/schedule-of-insurance', Controller.saveScheduleOfInsurance); // done
router.put('/:id/policy-contract/schedule-of-insurance', Controller.saveScheduleOfInsurance);

export default router;
