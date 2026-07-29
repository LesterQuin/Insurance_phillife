import express from 'express';
import * as Controller from '../controllers/financial_Insurance_form.controller.js';
import { validateFinancialApplication, validateUpdateFinancialApplication, validateDraftFinancialApplication, validateRates, validateGetHistory, validateTotalPremium, validateMaxAmounts, validateEvidenceNotes, validateMasterFileUpload, validateSupportingDetailsUpload, validateGetExtensionRequests, validateRequestExtension, validateApproveExtension, validateRejectExtension, validateRequestAmendment, validateGetAmendmentRequests, validateApproveAmendment, validateDeclineAmendment } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/authenticate.js';
import parseMultipartForm from '../middlewares/fileUpload.js';

const router = express.Router();

// Apply authentication and validation middleware
router.post('/create', authenticate, parseMultipartForm, validateFinancialApplication, Controller.createApplication);
router.post('/draft', authenticate, parseMultipartForm, validateDraftFinancialApplication, Controller.saveDraft);
router.put('/:id', authenticate, parseMultipartForm, validateUpdateFinancialApplication, Controller.updateApplication);

router.post('/:id/upload-masterfile', authenticate, parseMultipartForm, validateMasterFileUpload, Controller.uploadMasterFile); // any file
router.get('/:id/download-masterfile', authenticate, Controller.downloadMasterFile); // any file

router.post('/:id/upload-supporting-details', authenticate, parseMultipartForm, validateSupportingDetailsUpload, Controller.uploadSupportingDetails); // for all department use flex
router.get('/:id/download-supporting-details', authenticate, Controller.downloadSupportingDetails); // for all department use flex

//router.put('/:id/prototype-status', authenticate, parseMultipartForm, Controller.updatePrototypeStatus);
router.put('/:id/status/checking', authenticate, Controller.setStatusChecking); // addtional with controller not tested
router.put('/:id/status/approved', authenticate, Controller.setStatusApproved); // addtional  with controller not tested

// change status to booked when proposal is generated
router.put('/:id/status/booked', authenticate, Controller.setStatusBooked); // new api
// change status base on user action
router.put('/:id/status', authenticate, Controller.updateApplicationStatus); // new api

// Extension request 30 days before expiry
router.put('/:id/request-extension', authenticate, validateRequestExtension, Controller.requestExtension); // new api
// Approve extension request - only for approver team leader and above
router.put('/:id/approved-extension', authenticate, validateApproveExtension, Controller.approveExtension); // new api
// Reject extension request - only for approver team leader and above
router.put('/:id/declined-extension', authenticate, validateRejectExtension, Controller.rejectExtension); // new api
// get all applications with pending extension request - only for approver team leader and above
router.get('/extension-requests', authenticate, validateGetExtensionRequests, Controller.getExtensionRequests); // new api

// Amendment System APIs
router.put('/:id/request-amendment', authenticate, validateRequestAmendment, Controller.requestAmendment); // CFE/GMS Request Amendment
router.get('/:id/amendment-history', authenticate, Controller.getAmendmentHistory); // View Amendment History

// Trigger expiration notifications manually
router.post('/notify-expiring', authenticate, Controller.notifyExpiringProposals);

// Routes without validation
router.get('/list', authenticate, Controller.getAllApplications);
// get the renewal lookup data for the renewal application form, including the original application details and the available prototype plans for renewal
router.get('/renewal-lookup', authenticate, Controller.getRenewalLookup); // new api
router.get('/check-group-name', authenticate, Controller.checkGroupName);
// get the available statuses for the application based on the user's role and the current status of the application
router.get('/available-statuses', authenticate, Controller.getAvailableStatuses); // new api
router.get('/prototype-plans/:id/view', Controller.getPrototypePlanView);
router.get('/prototype-plans', authenticate, Controller.getPrototypePlans);
router.get('/prototypes', authenticate, Controller.getPrototypes);
router.get('/:id', authenticate, Controller.getApplicationById);

router.delete('/:id', authenticate, Controller.deleteApplication);
router.get('/:id/history', authenticate, validateGetHistory, Controller.getApplicationHistory);

router.get('/template/:id', authenticate, Controller.getTemplateById);
router.get('/template/:id/view-pdf',  Controller.viewTemplatePDF);
router.get('/template/:id/download', Controller.downloadTemplatePDF);
router.post('/template/:id/download', Controller.downloadTemplatePDF);

export default router;