import express from 'express';
import { uploadInstallationRequirements, updateInstallationRequirements, getInstallationRequirementsStatus, getRequirementsList, viewRequirementFile } from '../../controllers/requirements/installation_requirements.controller.js';
import { validateInstallationRequirements } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import parseMultipartForm from '../../middlewares/fileUpload.js';

const router = express.Router();

// GET: /api/installation-requirements/view-file
router.get('/view-file', authenticate, viewRequirementFile);

// GET: /api/installation-requirements/list
router.get('/list', getRequirementsList);

// GET: /api/applications/:id/requirements-status
router.get('/applications/:id/requirements-status', authenticate, getInstallationRequirementsStatus);

// POST: /api/applications/:id/upload-requirements
router.post('/applications/:id/upload-requirements', authenticate, parseMultipartForm, validateInstallationRequirements, uploadInstallationRequirements);

// PUT: /api/applications/:id/update-requirements
router.put('/applications/:id/update-requirements', authenticate, parseMultipartForm, validateInstallationRequirements, updateInstallationRequirements);

export default router;