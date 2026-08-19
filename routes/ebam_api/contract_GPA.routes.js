import express from 'express';
import * as Controller from '../../controllers/ebam_api/contract_GPA.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { checkTemplateType } from '../../middlewares/validateTemplate.js';

const router = express.Router();

router.use('/:id/policy-contract/gpa', checkTemplateType('GPA'));

// Contribution Management APIs
router.get('/:id/policy-contract/gpa/contribution', authenticate, Controller.getContribution);
router.post('/:id/policy-contract/gpa/contribution', authenticate, Controller.saveContribution);
router.put('/:id/policy-contract/gpa/contribution', authenticate, Controller.saveContribution);

// Eligible Individuals Management APIs
router.get('/:id/policy-contract/gpa/eligible-individuals', authenticate, Controller.getEligibleIndividuals);
router.post('/:id/policy-contract/gpa/eligible-individuals', authenticate, Controller.saveEligibleIndividuals);
router.put('/:id/policy-contract/gpa/eligible-individuals', authenticate, Controller.saveEligibleIndividuals);

// Participation Requirements Management APIs
router.get('/:id/policy-contract/gpa/participation-requirements', authenticate, Controller.getParticipationRequirements);
router.post('/:id/policy-contract/gpa/participation-requirements', authenticate, Controller.saveParticipationRequirements);
router.put('/:id/policy-contract/gpa/participation-requirements', authenticate, Controller.saveParticipationRequirements);

// Special Underwriting Provisions Sections Management APIs
router.get('/:id/policy-contract/gpa/special-provisions', authenticate, Controller.getSpecialProvisions);
router.post('/:id/policy-contract/gpa/special-provisions', authenticate, Controller.saveSpecialProvisions);
router.put('/:id/policy-contract/gpa/special-provisions', authenticate, Controller.saveSpecialProvisions);

// Unified Schedule of Insurance APIs
router.get('/:id/policy-contract/gpa/schedule-of-insurance', authenticate, Controller.getScheduleOfInsurance);
router.post('/:id/policy-contract/gpa/schedule-of-insurance', authenticate, Controller.saveScheduleOfInsurance);
router.put('/:id/policy-contract/gpa/schedule-of-insurance', authenticate, Controller.saveScheduleOfInsurance);

export default router;
