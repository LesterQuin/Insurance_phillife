import * as MainModel from '../../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../../models/actuarial_api/actuarial.model.js';
import { success, error } from '../../utils/response.js';
import sanitizeHtml from 'sanitize-html';
import { buildApplicationResponse, sanitizeOptions } from '../financial_Insurance_form.controller.js';

export const saveRates = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { application_id, ...ratesData } = req.body;
        const existingApplication = await MainModel.getApplicationById(application_id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        await ActuarialModel.saveApplicationRates(application_id, ratesData);

        const STATUS_APPROVED = 2;
        await MainModel.updateApplication(application_id, { status_id: STATUS_APPROVED }, userId);
        
        const updatedApp = await MainModel.getApplicationById(application_id);
        return success(res, updatedApp, 'Rates saved successfully.');
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

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);
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

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);
        return success(res, response, 'Total Annual Premium saved successfully.');
    } catch (err) {
        console.error('Save Total Premium Error:', err);
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