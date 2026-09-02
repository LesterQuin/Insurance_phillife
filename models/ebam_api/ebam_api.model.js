import { poolPromise, sql } from '../../config/db.js';
import * as Model from '../financial_Insurance_form.model.js';
import * as User from '../user/user_model.js';

export const getCOCPdfData = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) return null;

    // Restore ebam_status_id and ebam_status_name from nested array
    if (appData.ebam_status && appData.ebam_status.length > 0) {
        appData.ebam_status_id = appData.ebam_status[0].status_id;
        appData.ebam_status_name = appData.ebam_status[0].status_name;
    } else {
        appData.ebam_status_id = null;
        appData.ebam_status_name = null;
    }

    // Handle GMS Status and EBAM Status Flow mapping
    if (appData.status_id !== 7) {
        appData.ebam_status_id = null;
        appData.ebam_status_name = null;
    } else if (appData.status_id === 7 && !appData.ebam_status_id) {
        appData.ebam_status_id = 18;
        appData.ebam_status_name = 'For Contract Creation';
    }
    
    const riders = await Model.getApplicationRiders(id);
    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);

    const nameUpper = (appData.basic_plan_name || appData.plan_name || '').toUpperCase();
    const amountLoansName = (appData.amount_loans_name || '').toUpperCase();

    let provisionsRow = null;
    let limitsRow = null;

    const pool = await poolPromise;

    if (nameUpper.includes('CREDIT LIFE') || nameUpper.includes('GCLI') || nameUpper.includes('G-CLI')) {
        if (amountLoansName.includes('INITIAL') || amountLoansName.includes('ANNUAL') || amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || nameUpper.includes('PRINCIPAL')) {
            const provRes = await pool.request().input('id', sql.Int, id).query(`
                SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_principal_underwriting 
                WHERE application_id = @id;
            `);
            provisionsRow = provRes.recordset?.[0] || null;

            const limitsRes = await pool.request().input('id', sql.Int, id).query(`
                SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_principal_underwriting_limits 
                WHERE application_id = @id;
            `);
            const rawLimits = limitsRes.recordset?.[0] || null;
            if (rawLimits) {
                limitsRow = {
                    nel: rawLimits.nel_json ? JSON.parse(rawLimits.nel_json) : [],
                    nmed: rawLimits.nmed_json ? JSON.parse(rawLimits.nmed_json) : [],
                    med: rawLimits.med_json ? JSON.parse(rawLimits.med_json) : [],
                    max_limit: rawLimits.max_limit_json ? JSON.parse(rawLimits.max_limit_json) : [],
                    underwriting_notes: rawLimits.underwriting_notes || null
                };
            }
        } else {
            const provRes = await pool.request().input('id', sql.Int, id).query(`
                SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting 
                WHERE application_id = @id;
            `);
            provisionsRow = provRes.recordset?.[0] || null;

            const limitsRes = await pool.request().input('id', sql.Int, id).query(`
                SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits 
                WHERE application_id = @id;
            `);
            const rawLimits = limitsRes.recordset?.[0] || null;
            if (rawLimits) {
                limitsRow = {
                    nel: rawLimits.nel_json ? JSON.parse(rawLimits.nel_json) : [],
                    nmed: rawLimits.nmed_json ? JSON.parse(rawLimits.nmed_json) : [],
                    med: rawLimits.med_json ? JSON.parse(rawLimits.med_json) : [],
                    max_limit: rawLimits.max_limit_json ? JSON.parse(rawLimits.max_limit_json) : [],
                    underwriting_notes: rawLimits.underwriting_notes || null
                };
            }
        }
    } else {
        const provRes = await pool.request().input('id', sql.Int, id).query(`
            SELECT * FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting 
            WHERE application_id = @id;
        `);
        provisionsRow = provRes.recordset?.[0] || null;
        limitsRow = null;
    }
    const user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    return {
        appData,
        riders,
        rankings,
        rankingRiders,
        provisions: provisionsRow ? provisionsRow.provision_text : null,
        contribution_text: provisionsRow ? provisionsRow.contribution_text : null,
        eligible_individuals: provisionsRow ? provisionsRow.eligible_individuals : null,
        participation_requirements: provisionsRow ? (provisionsRow.participation_requirements || null) : null,
        participation_percentage: provisionsRow ? (provisionsRow.participation_percentage || null) : null,
        participation_minimum_no: provisionsRow ? (provisionsRow.participation_minimum_no || null) : null,
        termination_age: provisionsRow ? provisionsRow.termination_age : null,
        provision_enrollment: provisionsRow ? provisionsRow.provision_enrollment : null,
        provision_rollover: provisionsRow ? provisionsRow.provision_rollover : null,
        provision_termination: provisionsRow ? provisionsRow.provision_termination : null,
        provision_definitions: provisionsRow ? provisionsRow.provision_definitions : null,
        provision_claims: provisionsRow ? provisionsRow.provision_claims : null,
        provision_face_amount: provisionsRow ? provisionsRow.provision_face_amount : null,
        provision_premium_computation: provisionsRow ? provisionsRow.provision_premium_computation : null,
        provision_non_coverage: provisionsRow ? provisionsRow.provision_non_coverage : null,
        refund_of_premiums: provisionsRow ? provisionsRow.refund_of_premiums : null,
        amount_of_insurance: provisionsRow ? provisionsRow.amount_of_insurance : null,
        coverage_period: provisionsRow ? provisionsRow.coverage_period : null,
        due_dates: provisionsRow ? provisionsRow.due_dates : null,
        first_due_date: provisionsRow ? provisionsRow.first_due_date : null,
        renewal_due_date: provisionsRow ? provisionsRow.renewal_due_date : null,
        additions_due_date: provisionsRow ? provisionsRow.additions_due_date : null,
        nel: limitsRow ? limitsRow.nel : [],
        nmed: limitsRow ? limitsRow.nmed : [],
        med: limitsRow ? limitsRow.med : [],
        max_limit: limitsRow ? limitsRow.max_limit : [],
        underwriting_notes: limitsRow ? limitsRow.underwriting_notes : null,
        user
    };
};

export const updateEbamStatus = async (applicationId, statusId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('status_id', sql.Int, statusId)
        .query(`
            UPDATE DHUB_UAT.sg.financial_insurance_application
            SET ebam_status_id = @status_id, updated_at = GETDATE()
            WHERE application_id = @application_id;

            SELECT 
                fia.application_id, 
                fia.status_id AS gms_status_id,
                gms_status.status_name AS gms_status_name,
                fia.ebam_status_id,
                ebam_status.status_name AS ebam_status_name
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_status_lookup gms_status
                ON fia.status_id = gms_status.status_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_status_lookup ebam_status
                ON fia.ebam_status_id = ebam_status.status_id
            WHERE fia.application_id = @application_id;
        `);
    return result.recordset[0];
};

export const getEbamStatusLookupList = async () => {
    const pool = await poolPromise;
    const result = await pool.request().query(`
        SELECT status_id, status_name, group_type, parent_id 
        FROM DHUB_UAT.sg.financial_insurance_status_lookup 
        WHERE (group_type = 'EBAM' OR parent_id = 3) 
          AND status_id >= 20 
          AND is_active = 1
        ORDER BY status_id ASC;
    `);
    return result.recordset ?? [];
};

