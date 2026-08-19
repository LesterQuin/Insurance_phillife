import * as EbamModel from '../../models/ebam_api/contract_GCLIP_PRIN.model.js';
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
        console.error("Get Contribution Error:", err);
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
        console.error("Save Contribution Error:", err);
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
        console.error("Get Eligible Individuals Error:", err);
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
        console.error("Save Eligible Individuals Error:", err);
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
        console.error("Get Participation Requirements Error:", err);
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
        console.error("Save Participation Requirements Error:", err);
        return error(res, err.message, 500);
    }
};

// Get custom Underwriting Limits (Table Parameters on Page 2) for an application
export const getUnderwritingLimits = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingLimits(id);

        return success(res, {
            application_id: id,
            nel: row ? row.nel : [],
            nmed: row ? row.nmed : [],
            med: row ? row.med : [],
            max_limit: row ? row.max_limit : [],
            underwriting_notes: row ? row.underwriting_notes : null
        }, "Underwriting limits fetched successfully.", 200);
    } catch (err) {
        console.error("Get Underwriting Limits Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update custom Underwriting Limits (Table Parameters on Page 2) for an application
export const saveUnderwritingLimits = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const savedRow = await EbamModel.saveUnderwritingLimits(id, req.body);

        return success(res, {
            application_id: id,
            nel: savedRow ? savedRow.nel : [],
            nmed: savedRow ? savedRow.nmed : [],
            med: savedRow ? savedRow.med : [],
            max_limit: savedRow ? savedRow.max_limit : [],
            underwriting_notes: savedRow ? savedRow.underwriting_notes : null
        }, "Underwriting limits updated successfully.", 200);
    } catch (err) {
        console.error("Save Underwriting Limits Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Special Underwriting Provisions Sections for an application
export const getSpecialProvisions = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            enrollment: row ? row.provision_enrollment : null,
            rollover_provision: row ? row.provision_rollover : null,
            termination_of_insurance: row ? row.provision_termination : null,
            general_definitions: row ? row.provision_definitions : null,
            face_amount_insurance: row ? row.provision_face_amount : null,
            premium_computation: row ? row.provision_premium_computation : null,
            claims_procedure: row ? row.provision_claims : null,
            non_coverage_provision: row ? row.provision_non_coverage : null
        }, "Special underwriting provisions fetched successfully.", 200);
    } catch (err) {
        console.error("Get Special Provisions Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update Special Underwriting Provisions Sections for an application
export const saveSpecialProvisions = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Map request body fields to model parameters
        const params = {
            enrollment: req.body.enrollment,
            rollover: req.body.rollover_provision,
            termination: req.body.termination_of_insurance,
            definitions: req.body.general_definitions,
            claims: req.body.claims_procedure,
            face_amount_insurance: req.body.face_amount_insurance,
            premium_computation: req.body.premium_computation,
            non_coverage_provision: req.body.non_coverage_provision
        };

        const savedRow = await EbamModel.saveSpecialProvisions(id, params);

        return success(res, {
            application_id: id,
            enrollment: savedRow ? savedRow.provision_enrollment : null,
            rollover_provision: savedRow ? savedRow.provision_rollover : null,
            termination_of_insurance: savedRow ? savedRow.provision_termination : null,
            general_definitions: savedRow ? savedRow.provision_definitions : null,
            face_amount_insurance: savedRow ? savedRow.provision_face_amount : null,
            premium_computation: savedRow ? savedRow.provision_premium_computation : null,
            claims_procedure: savedRow ? savedRow.provision_claims : null,
            non_coverage_provision: savedRow ? savedRow.provision_non_coverage : null
        }, "Special underwriting provisions updated successfully.", 200);
    } catch (err) {
        console.error("Save Special Provisions Error:", err);
        return error(res, err.message, 500);
    }
};

// Get unified Schedule of Insurance parameters for an application
export const getScheduleOfInsurance = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const row = await EbamModel.getUnderwritingProvisions(id);
        
        return success(res, {
            application_id: id,
            amount_of_insurance: row ? row.amount_of_insurance : null,
            coverage_period: row ? row.coverage_period : null,
            refund_of_premiums: row ? row.refund_of_premiums : null,
            termination_age: row ? row.termination_age : null,
            due_dates: row ? row.due_dates : null
        }, "Schedule of insurance parameters fetched successfully.", 200);
    } catch (err) {
        console.error("Get Schedule of Insurance Error:", err);
        return error(res, err.message, 500);
    }
};

// Save/Update unified Schedule of Insurance parameters for an application
export const saveScheduleOfInsurance = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const savedRow = await EbamModel.saveScheduleOfInsurance(id, req.body);

        return success(res, {
            application_id: id,
            amount_of_insurance: savedRow ? savedRow.amount_of_insurance : null,
            coverage_period: savedRow ? savedRow.coverage_period : null,
            refund_of_premiums: savedRow ? savedRow.refund_of_premiums : null,
            termination_age: savedRow ? savedRow.termination_age : null,
            due_dates: savedRow ? savedRow.due_dates : null
        }, "Schedule of insurance parameters updated successfully.", 200);
    } catch (err) {
        console.error("Save Schedule of Insurance Error:", err);
        return error(res, err.message, 500);
    }
};
