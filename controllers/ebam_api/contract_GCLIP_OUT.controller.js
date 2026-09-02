import * as EbamModel from '../../models/ebam_api/contract_GCLIP_OUT.model.js';
import { getCOCPdfData, updateEbamStatus } from '../../models/ebam_api/ebam_api.model.js';
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

// Get unified GCLIP Outstanding data compiled together
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

        if (!isGcli || isPrincipal) {
            return error(res, `Invalid plan type for GCLIP Outstanding. The plan for this application is: ${application.appData.basic_plan_name || 'unknown'}.`, 400);
        }

        const data = await EbamModel.getGclipOutstandingData(id);
        
        // Add allowed next statuses
        const currentStatus = application.appData.ebam_status_id || 18;
        const allowed = allowedTransitions[currentStatus] || [];
        data.allowed_next_statuses = allowed.map(sid => ({
            status_id: sid,
            status_name: STATUS_NAMES[sid]
        }));

        return success(res, data, "GCLIP Outstanding data fetched successfully.", 200);
    } catch (err) {
        console.error("Get GCLIP Outstanding Data Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update unified GCLIP Outstanding data compiled together
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

        if (!isGcli || isPrincipal) {
            return error(res, `Invalid plan type for GCLIP Outstanding. The plan for this application is: ${application.appData.basic_plan_name || 'unknown'}.`, 400);
        }

        // Verify proposal is booked (status_id === 7) before allowing inputs/saves
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot input or modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        const currentEbamStatus = application.appData.ebam_status_id || 18;
        const lockedStatuses = [20, 22, 23, 24]; // For Contract Review, Approved, Ready for Issuance, Issued
        if (lockedStatuses.includes(currentEbamStatus)) {
            return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        }

        const savedData = await EbamModel.saveGclipOutstandingData(id, req.body);
        
        // Fetch fresh application status to get next allowed options
        const updatedApp = await getCOCPdfData(id);
        const currentStatus = updatedApp.appData.ebam_status_id || 18;
        const allowed = allowedTransitions[currentStatus] || [];
        savedData.allowed_next_statuses = allowed.map(sid => ({
            status_id: sid,
            status_name: STATUS_NAMES[sid]
        }));

        return success(res, savedData, "GCLIP Outstanding data updated successfully.", 200);
    } catch (err) {
        console.error("Save GCLIP Outstanding Data Error:", err);
        return error(res, err.message, 500);
    }
};

// Update EBAM status for application
export const updateEbamStatusController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { status_id } = req.body;

        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);
        if (status_id === undefined || status_id === null || isNaN(parseInt(status_id))) {
            return error(res, "Valid status_id is required.", 400);
        }

        const targetStatus = parseInt(status_id);
        if (targetStatus < 18 || targetStatus > 24) {
            return error(res, "status_id must be between 18 (For Contract Creation) and 24 (Issued).", 400);
        }

        const application = await getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked (status_id === 7) before allowing status transitions
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot update EBAM status unless GMS status is Booked.", 400);
        }

        // Validate allowed transitions
        const currentStatus = application.appData.ebam_status_id || 18;
        const allowed = allowedTransitions[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            const currentName = STATUS_NAMES[currentStatus] || "Unknown";
            const allowedList = allowed.map(sid => `${sid} (${STATUS_NAMES[sid]})`).join(', ');
            return error(res, `Invalid status transition from current status "${currentName}" (ID: ${currentStatus}) to target status (ID: ${targetStatus}). Allowed next status options: [${allowedList}].`, 400);
        }

        const updatedApp = await updateEbamStatus(id, targetStatus);
        
        const nextAllowed = allowedTransitions[targetStatus] || [];
        const nextAllowedList = nextAllowed.map(sid => ({
            status_id: sid,
            status_name: STATUS_NAMES[sid]
        }));

        return success(res, {
            ...updatedApp,
            allowed_next_statuses: nextAllowedList
        }, `EBAM status updated successfully to status_id: ${targetStatus}.`, 200);
    } catch (err) {
        console.error("Update EBAM Status Error:", err);
        return error(res, err.message, 500);
    }
};
