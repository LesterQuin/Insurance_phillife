import * as EbamModel from '../../models/ebam_api/contract_GCLIP_PRIN.model.js';
import { getCOCPdfData } from '../../models/ebam_api/ebam_api.model.js';
import { success, error } from '../../utils/response.js';

const STATUS_NAMES = {
    18: "For Contract Creation",
    19: "Contract in Progress",
    20: "For Contract Review",
    21: "For Revision",
    22: "Contract Approved",
    23: "Ready for Issuance",
    24: "Issued"
};

const allowedTransitions = {
    18: [19],
    19: [20],
    20: [21, 22],
    21: [20],
    22: [23],
    23: [24],
    24: []
};

// Get unified GCLIP Principal data compiled together
export const getGclipData = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const basicPlanName = (application.appData.basic_plan_name || application.appData.plan_name || application.appData.basic_plan_acronym || application.appData.plan_acronym || '').toUpperCase();
        const amountLoansName = (application.appData.amount_loans_name || '').toUpperCase();
        const isGcli = basicPlanName.includes('CREDIT LIFE') || basicPlanName.includes('GCLI') || basicPlanName.includes('G-CLI');
        const isPrincipal = amountLoansName.includes('INITIAL') || amountLoansName.includes('ANNUAL') || amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || basicPlanName.includes('PRINCIPAL');

        if (!isGcli || !isPrincipal) {
            return error(res, `Invalid plan type for GCLIP Principal. The plan for this application is: ${application.appData.basic_plan_name || 'unknown'}.`, 400);
        }

        const data = await EbamModel.getGclipPrincipalData(id);
        
        // Add allowed next statuses
        const currentStatus = application.appData.ebam_status_id || 18;
        const allowed = allowedTransitions[currentStatus] || [];
        data.allowed_next_statuses = allowed.map(sid => ({
            status_id: sid,
            status_name: STATUS_NAMES[sid]
        }));

        return success(res, data, "GCLIP Principal data fetched successfully.", 200);
    } catch (err) {
        console.error("Get GCLIP Principal Data Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update unified GCLIP Principal data compiled together
export const saveGclipData = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const basicPlanName = (application.appData.basic_plan_name || application.appData.plan_name || application.appData.basic_plan_acronym || application.appData.plan_acronym || '').toUpperCase();
        const amountLoansName = (application.appData.amount_loans_name || '').toUpperCase();
        const isGcli = basicPlanName.includes('CREDIT LIFE') || basicPlanName.includes('GCLI') || basicPlanName.includes('G-CLI');
        const isPrincipal = amountLoansName.includes('INITIAL') || amountLoansName.includes('ANNUAL') || amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || basicPlanName.includes('PRINCIPAL');

        if (!isGcli || !isPrincipal) {
            return error(res, `Invalid plan type for GCLIP Principal. The plan for this application is: ${application.appData.basic_plan_name || 'unknown'}.`, 400);
        }

        // Verify proposal is booked (status_id === 7) before allowing saves
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot input or modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        const currentEbamStatus = application.appData.ebam_status_id || 18;
        const lockedStatuses = [20, 22, 23, 24]; // For Contract Review, Approved, Ready for Issuance, Issued
        if (lockedStatuses.includes(currentEbamStatus)) {
            return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        }

        const savedData = await EbamModel.saveGclipPrincipalData(id, req.body);
        
        // Fetch fresh application status to get next allowed options
        const updatedApp = await getCOCPdfData(id);
        const currentStatus = updatedApp.appData.ebam_status_id || 18;
        const allowed = allowedTransitions[currentStatus] || [];
        savedData.allowed_next_statuses = allowed.map(sid => ({
            status_id: sid,
            status_name: STATUS_NAMES[sid]
        }));

        return success(res, savedData, "GCLIP Principal data updated successfully.", 200);
    } catch (err) {
        console.error("Save GCLIP Principal Data Error:", err);
        return error(res, err.message, 500);
    }
};
