import express from 'express';
import * as Controller from '../../controllers/actuarial_api/actuarial.controller.js';
import { validateRates, validateTotalPremium, validateEvidenceNotes } from '../../middlewares/validate.js';
import { authenticate, isActuarial } from '../../middlewares/authenticate.js';

const router = express.Router();

// API to input or update rates on the borrower
router.get('/rates/queue', authenticate, isActuarial, Controller.getApplicationsPendingRates);
router.post('/rates/:id', authenticate, isActuarial, validateRates, Controller.saveRates);
router.put('/rates/:id', authenticate, isActuarial, validateRates, Controller.saveRates);

// API to input evidence of insurability notes (Section 5)
router.post('/evidence-notes/:id', authenticate, isActuarial, validateEvidenceNotes, Controller.saveEvidenceNotes);
router.put('/evidence-notes/:id', authenticate, isActuarial, validateEvidenceNotes, Controller.saveEvidenceNotes);

// API to input total annual premium
router.get('/total-premium/queue', authenticate, isActuarial, Controller.getApplicationsPendingTotalPremium);
router.post('/total-premium/:id', authenticate, isActuarial, validateTotalPremium, Controller.saveTotalAnnualPremium);
router.put('/total-premium/:id', authenticate, isActuarial, validateTotalPremium, Controller.saveTotalAnnualPremium);

// API to finalize and release the application
router.post('/release/:id', authenticate, isActuarial, Controller.releaseApplication);

// API to reject the application
router.post('/reject/:id', authenticate, isActuarial, Controller.rejectApplication);

export default router;