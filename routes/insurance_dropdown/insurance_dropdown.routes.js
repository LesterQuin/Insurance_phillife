import express from 'express';
import * as Controller from '../../controllers/insurance_dropdown/insurance_dropdown.controller.js';

const router = express.Router();

// Get List of Industries (Business Nature)
router.get('/industries', Controller.getIndustries);

export default router;