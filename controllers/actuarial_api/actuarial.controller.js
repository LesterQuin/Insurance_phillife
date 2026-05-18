import * as MainModel from '../../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../../models/actuarial_api/actuarial.model.js';
import * as User from '../../models/user/user_model.js';
import { success, error } from '../../utils/response.js';
import sanitizeHtml from 'sanitize-html';
import { buildApplicationResponse, sanitizeOptions, updateActuarialStatus } from '../../middlewares/helper.js';
import { broadcastApplicationUpdate } from '../../websocket.js';

export const saveRates = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const application_id = req.params.id;
        const ratesData = req.body;
        const existingApplication = await MainModel.getApplicationById(application_id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        await ActuarialModel.saveApplicationRates(application_id, ratesData);

        await updateActuarialStatus(application_id, userId);
        
        const updatedApp = await MainModel.getApplicationById(application_id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify all users viewing this application that rates/status changed
        broadcastApplicationUpdate(application_id, response);

        return success(res, response, 'Rates saved successfully.');
    } catch (err) {
        console.error('Save Rates Error:', err);
        return error(res, err.message);
    }
};

export const saveEvidenceNotes = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        let { evidence_notes } = req.body;

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        if (evidence_notes) {
            evidence_notes = sanitizeHtml(evidence_notes, sanitizeOptions);
        }

        await MainModel.updateApplication(id, { evidence_notes }, userId);

        await updateActuarialStatus(id, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users of updated evidence notes
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Evidence of insurability notes saved successfully.');
    } catch (err) {
        console.error('Save Evidence Notes Error:', err);
        return error(res, err.message);
    }
};

export const saveTotalAnnualPremium = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        const { total_annual_premium } = req.body;

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        if (req.method === 'POST' && existingApplication.total_annual_premium !== null) {
            return error(res, 'Total annual premium already exists. Use PUT to update.', 400);
        }

        await MainModel.updateApplication(id, { total_annual_premium }, userId);

        await updateActuarialStatus(id, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users of updated total premium
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Total Annual Premium saved successfully.');
    } catch (err) {
        console.error('Save Total Premium Error:', err);
        return error(res, err.message);
    }
};

export const releaseApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;

        // 1. Authorization check: Only Actuarial (Dept 18) or Super Admin
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && loggedInUser.roleName === 'Super Admin';

        if (!isActuarial && !isSuperAdmin) {
            return error(res, 'Access Denied: Only users from the Actuarial department or Super Admins are authorized to release applications.', 403);
        }

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        const STATUS_APPROVED = 2;
        const STATUS_RELEASED = 6;

        if (Number(existingApplication.status_id) !== STATUS_APPROVED) {
            return error(res, 'Only applications with "Approved" status can be finalized and released.', 400);
        }

        await MainModel.updateApplication(id, { status_id: STATUS_RELEASED }, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Critical for the UI to show the "Released" state immediately
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Application has been successfully finalized and released.');
    } catch (err) {
        console.error('Release Application Error:', err);
        return error(res, err.message);
    }
};

export const rejectApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;

        // 1. Authorization check: Only Actuarial (Dept 18) or Super Admin
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && loggedInUser.roleName === 'Super Admin';

        if (!isActuarial && !isSuperAdmin) {
            return error(res, 'Access Denied: Only users from the Actuarial department or Super Admins are authorized to reject applications.', 403);
        }

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        // Terminal or Draft states cannot be rejected
        if ([3, 4, 6].includes(Number(existingApplication.status_id))) {
            return error(res, 'Applications that are already Rejected, Released, or in Draft cannot be updated to Rejected status.', 400);
        }

        const STATUS_REJECTED = 3;
        await MainModel.updateApplication(id, { status_id: STATUS_REJECTED }, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users that the application was rejected
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Application has been successfully rejected.');
    } catch (err) {
        console.error('Reject Application Error:', err);
        return error(res, err.message);
    }
};

export const unrejectApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;

        // 1. Authorization check: Strictly Super Admin only for un-rejecting
        const loggedInUser = await User.getUserById(userId);
        const isSuperAdmin = loggedInUser && loggedInUser.roleName === 'Super Admin';

        if (!isSuperAdmin) {
            return error(res, 'Access Denied: Only Super Admins are authorized to un-reject applications.', 403);
        }

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        // Check if the application is actually rejected
        if (Number(existingApplication.status_id) !== 3) {
            return error(res, 'Only applications with "Rejected" status can be un-rejected.', 400);
        }

        const STATUS_PENDING = 1;
        await MainModel.updateApplication(id, { status_id: STATUS_PENDING }, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users that the rejection was reversed
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Application has been successfully un-rejected and set to Pending.');
    } catch (err) {
        console.error('Un-reject Application Error:', err);
        return error(res, err.message);
    }
};

export const getApplicationsPendingRates = async (req, res) => {
    try {
        const list = await ActuarialModel.getApplicationsPendingRates();
        return success(res, list, 'Applications pending rates fetched successfully.');
    } catch (err) {
        console.error('Pending Rates Queue Error:', err);
        return error(res, err.message);
    }
};

export const getApplicationsPendingTotalPremium = async (req, res) => {
    try {
        const list = await ActuarialModel.getApplicationsPendingTotalPremium();
        return success(res, list, 'Applications pending total annual premium fetched successfully.');
    } catch (err) {
        console.error('Pending Total Premium Queue Error:', err);
        return error(res, err.message);
    }
};