import * as EbamModel from '../../models/ebam_api/contract_GPA.model.js';
import { success, error } from '../../utils/response.js';

// Get Contribution text for an application
export const getContribution = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            contribution_text: row ? row.contribution_text : null
        }, "Contribution text fetched successfully.", 200);
    } catch (err) {
        console.error("Get GPA Contribution Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update Contribution text for an application
export const saveContribution = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const inputVal = req.body.contribution_text ?? req.body.contribution;
        if (inputVal === undefined) {
            return error(res, "Validation failed.", 400, [
                { field: "contribution_text", message: "contribution_text or contribution field is required." }
            ]);
        }

        const savedRow = await EbamModel.saveContributionText(id, inputVal);

        return success(res, {
            application_id: id,
            contribution_text: savedRow ? savedRow.contribution_text : null
        }, "Contribution text updated successfully.", 200);
    } catch (err) {
        console.error("Save GPA Contribution Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Eligible Individuals text for an application
export const getEligibleIndividuals = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            eligible_individuals: row ? row.eligible_individuals : null
        }, "Eligible individuals text fetched successfully.", 200);
    } catch (err) {
        console.error("Get GPA Eligible Individuals Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update Eligible Individuals text for an application
export const saveEligibleIndividuals = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const inputVal = req.body.eligible_individuals ?? req.body.eligible_individuals_text;
        if (inputVal === undefined) {
            return error(res, "Validation failed.", 400, [
                { field: "eligible_individuals", message: "eligible_individuals or eligible_individuals_text field is required." }
            ]);
        }

        const savedRow = await EbamModel.saveEligibleIndividuals(id, inputVal);

        return success(res, {
            application_id: id,
            eligible_individuals: savedRow ? savedRow.eligible_individuals : null
        }, "Eligible individuals text updated successfully.", 200);
    } catch (err) {
        console.error("Save GPA Eligible Individuals Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Participation Requirements for an application
export const getParticipationRequirements = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            percentage: row ? (row.participation_percentage || '100%') : '100%',
            minimum_no: row ? (row.participation_minimum_no || null) : null
        }, "Participation requirements fetched successfully.", 200);
    } catch (err) {
        console.error("Get GPA Participation Requirements Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update Participation Requirements for an application
export const saveParticipationRequirements = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const inputVal = req.body;
        if (!inputVal || (inputVal.percentage === undefined && inputVal.minimum_no === undefined && inputVal.participation_requirements === undefined && inputVal.participation_percentage === undefined && inputVal.participation_minimum_no === undefined)) {
            return error(res, "Validation failed.", 400, [
                { field: "percentage", message: "percentage and/or minimum_no field is required." }
            ]);
        }

        const savedRow = await EbamModel.saveParticipationRequirements(id, inputVal);

        return success(res, {
            application_id: id,
            percentage: savedRow ? (savedRow.participation_percentage || '100%') : '100%',
            minimum_no: savedRow ? (savedRow.participation_minimum_no || null) : null
        }, "Participation requirements updated successfully.", 200);
    } catch (err) {
        console.error("Save GPA Participation Requirements Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Special Underwriting Provisions text for an application
export const getSpecialProvisions = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            special_provisions: row ? (row.provision_text || null) : null
        }, "Special underwriting provisions fetched successfully.", 200);
    } catch (err) {
        console.error("Get GPA Special Provisions Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update Special Underwriting Provisions text for an application
export const saveSpecialProvisions = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const inputVal = req.body.special_provisions ?? req.body.special_underwriting_provisions ?? req.body.provision_text ?? req.body.text;
        if (inputVal === undefined) {
            return error(res, "Validation failed.", 400, [
                { field: "special_provisions", message: "special_provisions, special_underwriting_provisions, or provision_text field is required." }
            ]);
        }

        const savedRow = await EbamModel.saveSpecialProvisions(id, inputVal);

        return success(res, {
            application_id: id,
            special_provisions: savedRow ? (savedRow.provision_text || null) : null
        }, "Special underwriting provisions updated successfully.", 200);
    } catch (err) {
        console.error("Save GPA Special Provisions Error:", err);
        return error(res, err.message, 500);
    }
};

// Get unified Schedule of Insurance (Due Dates) for an application
export const getScheduleOfInsurance = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            first_due_date: row ? row.first_due_date : null,
            renewal_due_date: row ? row.renewal_due_date : null,
            additions_due_date: row ? row.additions_due_date : null
        }, "Schedule of insurance due dates fetched successfully.", 200);
    } catch (err) {
        console.error("Get GPA Schedule of Insurance Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update unified Schedule of Insurance (Due Dates) for an application
export const saveScheduleOfInsurance = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const savedRow = await EbamModel.saveScheduleOfInsurance(id, req.body);

        return success(res, {
            application_id: id,
            first_due_date: savedRow ? savedRow.first_due_date : null,
            renewal_due_date: savedRow ? savedRow.renewal_due_date : null,
            additions_due_date: savedRow ? savedRow.additions_due_date : null
        }, "Schedule of insurance due dates updated successfully.", 200);
    } catch (err) {
        console.error("Save GPA Schedule of Insurance Error:", err);
        return error(res, err.message, 500);
    }
};
