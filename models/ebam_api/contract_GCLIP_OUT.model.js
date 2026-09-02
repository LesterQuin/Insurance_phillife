import { poolPromise, sql } from '../../config/db.js';

// Ensure table for tracking custom Special Underwriting Provisions & Contribution exists
export const ensureUnderwritingProvisionsTable = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        IF OBJECT_ID('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'U') IS NULL
        BEGIN
            CREATE TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting (
                provision_id INT IDENTITY(1,1) PRIMARY KEY,
                application_id INT NOT NULL UNIQUE,
                provision_text NVARCHAR(MAX) NULL,
                contribution_text NVARCHAR(MAX) NULL,
                eligible_individuals NVARCHAR(MAX) NULL,
                participation_requirements NVARCHAR(MAX) NULL,
                termination_age INT NULL,
                provision_enrollment NVARCHAR(MAX) NULL,
                provision_rollover NVARCHAR(MAX) NULL,
                provision_termination NVARCHAR(MAX) NULL,
                provision_definitions NVARCHAR(MAX) NULL,
                provision_claims NVARCHAR(MAX) NULL,
                refund_of_premiums NVARCHAR(MAX) NULL,
                amount_of_insurance NVARCHAR(MAX) NULL,
                coverage_period NVARCHAR(MAX) NULL,
                due_dates NVARCHAR(MAX) NULL,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'eligible_individuals') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD eligible_individuals NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'participation_percentage') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD participation_percentage NVARCHAR(50) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'participation_minimum_no') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD participation_minimum_no NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'termination_age') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD termination_age INT NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'provision_enrollment') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD provision_enrollment NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'provision_rollover') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD provision_rollover NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'provision_termination') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD provision_termination NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'provision_definitions') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD provision_definitions NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'provision_claims') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD provision_claims NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'refund_of_premiums') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD refund_of_premiums NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'amount_of_insurance') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD amount_of_insurance NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'coverage_period') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD coverage_period NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting', 'due_dates') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
                ADD due_dates NVARCHAR(MAX) NULL;
            END
        END
    `);
};

// Ensure table for tracking custom Underwriting Limits (Table Parameters on Page 2) exists
export const ensureUnderwritingLimitsTable = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        IF OBJECT_ID('DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits', 'U') IS NULL
        BEGIN
            CREATE TABLE DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits (
                limit_id INT IDENTITY(1,1) PRIMARY KEY,
                application_id INT NOT NULL UNIQUE,
                nel_json NVARCHAR(MAX) NULL,
                nmed_json NVARCHAR(MAX) NULL,
                med_json NVARCHAR(MAX) NULL,
                max_limit_json NVARCHAR(MAX) NULL,
                underwriting_notes NVARCHAR(MAX) NULL,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            );
        END
    `);
};

// Completeness check for GCLIP templates
const isGclipComplete = (data) => {
    const contributionText = data.gclip_contribution?.contribution ?? data.gclip_contribution?.contribution_text;
    if (!contributionText || contributionText.trim() === '') return false;

    const eligibleIndividuals = data.gclip_eligible_individuals?.eligible_individuals ?? data.gclip_eligible_individuals?.eligible_individuals_text;
    if (!eligibleIndividuals || eligibleIndividuals.trim() === '') return false;

    const reqPercentage = data.gclip_participation_requirements?.percentage ?? data.gclip_participation_requirements?.participation_percentage;
    const minVal = data.gclip_participation_requirements?.minimum_no ?? data.gclip_participation_requirements?.participation_minimum_no;
    if (!reqPercentage || reqPercentage.trim() === '') return false;
    if (!minVal || (typeof minVal === 'string' && minVal.trim() === '')) return false;

    const amountOfInsurance = data.gclip_schedule_of_insurance?.amount_of_insurance;
    const coveragePeriod = data.gclip_schedule_of_insurance?.coverage_period;
    const refundOfPremiums = data.gclip_schedule_of_insurance?.refund_of_premiums;
    const terminationAge = data.gclip_schedule_of_insurance?.termination_age;
    const dueDates = data.gclip_schedule_of_insurance?.due_dates;
    if (!amountOfInsurance || amountOfInsurance.trim() === '') return false;
    if (!coveragePeriod || coveragePeriod.trim() === '') return false;
    if (!refundOfPremiums || refundOfPremiums.trim() === '') return false;
    if (terminationAge === undefined || terminationAge === null || terminationAge === '') return false;
    if (!dueDates || dueDates.trim() === '') return false;

    const limitsData = data.gclip_underwringting_notes ?? data.gclip_underwriting_notes ?? {};
    if (!Array.isArray(limitsData.nel) || limitsData.nel.length === 0) return false;
    if (!Array.isArray(limitsData.nmed) || limitsData.nmed.length === 0) return false;
    if (!Array.isArray(limitsData.med) || limitsData.med.length === 0) return false;
    if (!Array.isArray(limitsData.max_limit) || limitsData.max_limit.length === 0) return false;

    return true;
};

// Get unified GCLIP Outstanding data compiled together
export const getGclipOutstandingData = async (applicationId) => {
    await ensureUnderwritingProvisionsTable();
    await ensureUnderwritingLimitsTable();

    const pool = await poolPromise;
    const provRes = await pool.request().input('application_id', sql.Int, applicationId).query(`
        SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting 
        WHERE application_id = @application_id;
    `);
    const provRow = provRes.recordset?.[0] || null;

    const limitsRes = await pool.request().input('application_id', sql.Int, applicationId).query(`
        SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits 
        WHERE application_id = @application_id;
    `);
    const limitsRow = limitsRes.recordset?.[0] || null;

    const nelParsed = limitsRow?.nel_json ? JSON.parse(limitsRow.nel_json) : [];
    const nmedParsed = limitsRow?.nmed_json ? JSON.parse(limitsRow.nmed_json) : [];
    const medParsed = limitsRow?.med_json ? JSON.parse(limitsRow.med_json) : [];
    const maxLimitParsed = limitsRow?.max_limit_json ? JSON.parse(limitsRow.max_limit_json) : [];
    const underwritingNotes = limitsRow?.underwriting_notes || null;

    return {
        application_id: applicationId,
        gclip_contribution: {
            contribution: provRow?.contribution_text || ""
        },
        gclip_eligible_individuals: {
            eligible_individuals: provRow?.eligible_individuals || ""
        },
        gclip_participation_requirements: {
            participation_percentage: provRow?.participation_percentage || "100%",
            participation_minimum_no: provRow?.participation_minimum_no || ""
        },
        gclip_schedule_of_insurance: {
            amount_of_insurance: provRow?.amount_of_insurance || "",
            coverage_period: provRow?.coverage_period || "",
            refund_of_premiums: provRow?.refund_of_premiums || "",
            termination_age: provRow?.termination_age || "",
            due_dates: provRow?.due_dates || ""
        },
        gclip_special_provision: {
            enrollment: provRow?.provision_enrollment || "",
            rollover_provision: provRow?.provision_rollover || "",
            termination_of_insurance: provRow?.provision_termination || "",
            general_definitions: provRow?.provision_definitions || "",
            claims_procedure: provRow?.provision_claims || ""
        },
        gclip_underwriting_notes: {
            nel: nelParsed,
            nmed: nmedParsed,
            med: medParsed,
            max_limit: maxLimitParsed,
            underwriting_notes: underwritingNotes
        }
    };
};

// Save/Update unified GCLIP Outstanding data compiled together (with Transaction)
export const saveGclipOutstandingData = async (applicationId, data) => {
    await ensureUnderwritingProvisionsTable();
    await ensureUnderwritingLimitsTable();

    const pool = await poolPromise;
    
    // Fetch existing records to prevent clearing previously input values when sending partial updates
    const existingProvRes = await pool.request().input('application_id', sql.Int, applicationId).query(`
        SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting 
        WHERE application_id = @application_id;
    `);
    const existingProv = existingProvRes.recordset?.[0] || null;

    const existingLimitsRes = await pool.request().input('application_id', sql.Int, applicationId).query(`
        SELECT * FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits 
        WHERE application_id = @application_id;
    `);
    const existingLimits = existingLimitsRes.recordset?.[0] || null;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Helper to get non-empty new value or keep existing
        const getVal = (newVal, existingVal) => {
            if (newVal === undefined || newVal === null || String(newVal).trim() === '') {
                return existingVal ?? null;
            }
            return newVal;
        };

        // 1. Save Underwriting Provisions
        const provReq = new sql.Request(transaction);
        const contributionText = getVal(
            data.gclip_contribution?.contribution ?? data.gclip_contribution?.contribution_text,
            existingProv?.contribution_text
        );
        const eligibleIndividuals = getVal(
            data.gclip_eligible_individuals?.eligible_individuals ?? data.gclip_eligible_individuals?.eligible_individuals_text,
            existingProv?.eligible_individuals
        );
        
        const reqPercentage = getVal(
            data.gclip_participation_requirements?.percentage ?? data.gclip_participation_requirements?.participation_percentage,
            existingProv?.participation_percentage
        );
        
        const minVal = data.gclip_participation_requirements?.minimum_no ?? data.gclip_participation_requirements?.participation_minimum_no;
        let participationMinimumNo = null;
        if (minVal !== undefined && minVal !== null && String(minVal).trim() !== '' && !(Array.isArray(minVal) && minVal.length === 0)) {
            participationMinimumNo = typeof minVal === 'string' ? minVal : JSON.stringify(minVal);
        } else {
            participationMinimumNo = existingProv?.participation_minimum_no ?? null;
        }

        const amountOfInsurance = getVal(data.gclip_schedule_of_insurance?.amount_of_insurance, existingProv?.amount_of_insurance);
        const coveragePeriod = getVal(data.gclip_schedule_of_insurance?.coverage_period, existingProv?.coverage_period);
        const refundOfPremiums = getVal(data.gclip_schedule_of_insurance?.refund_of_premiums, existingProv?.refund_of_premiums);
        
        let terminationAge = null;
        const newAge = data.gclip_schedule_of_insurance?.termination_age;
        if (newAge !== undefined && newAge !== null && String(newAge).trim() !== '') {
            terminationAge = parseInt(newAge);
        } else {
            terminationAge = existingProv?.termination_age ?? null;
        }

        const dueDates = getVal(data.gclip_schedule_of_insurance?.due_dates, existingProv?.due_dates);

        const enrollment = getVal(data.gclip_special_provision?.enrollment, existingProv?.provision_enrollment);
        const rollover = getVal(data.gclip_special_provision?.rollover_provision ?? data.gclip_special_provision?.rollover, existingProv?.provision_rollover);
        const termination = getVal(data.gclip_special_provision?.termination_of_insurance ?? data.gclip_special_provision?.termination, existingProv?.provision_termination);
        const definitions = getVal(data.gclip_special_provision?.general_definitions ?? data.gclip_special_provision?.definitions, existingProv?.provision_definitions);
        const claims = getVal(data.gclip_special_provision?.claims_procedure ?? data.gclip_special_provision?.claims, existingProv?.provision_claims);

        provReq.input('application_id', sql.Int, applicationId);
        provReq.input('contribution_text', sql.NVarChar(sql.MAX), contributionText);
        provReq.input('eligible_individuals', sql.NVarChar(sql.MAX), eligibleIndividuals);
        provReq.input('participation_percentage', sql.NVarChar(50), reqPercentage);
        provReq.input('participation_minimum_no', sql.NVarChar(sql.MAX), participationMinimumNo);
        provReq.input('amount_of_insurance', sql.NVarChar(sql.MAX), amountOfInsurance);
        provReq.input('coverage_period', sql.NVarChar(sql.MAX), coveragePeriod);
        provReq.input('refund_of_premiums', sql.NVarChar(sql.MAX), refundOfPremiums);
        provReq.input('termination_age', sql.Int, terminationAge);
        provReq.input('due_dates', sql.NVarChar(sql.MAX), dueDates);
        provReq.input('provision_enrollment', sql.NVarChar(sql.MAX), enrollment);
        provReq.input('provision_rollover', sql.NVarChar(sql.MAX), rollover);
        provReq.input('provision_termination', sql.NVarChar(sql.MAX), termination);
        provReq.input('provision_definitions', sql.NVarChar(sql.MAX), definitions);
        provReq.input('provision_claims', sql.NVarChar(sql.MAX), claims);

        await provReq.query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    contribution_text = @contribution_text,
                    eligible_individuals = @eligible_individuals,
                    participation_percentage = @participation_percentage,
                    participation_minimum_no = @participation_minimum_no,
                    amount_of_insurance = @amount_of_insurance,
                    coverage_period = @coverage_period,
                    refund_of_premiums = @refund_of_premiums,
                    termination_age = @termination_age,
                    due_dates = @due_dates,
                    provision_enrollment = @provision_enrollment,
                    provision_rollover = @provision_rollover,
                    provision_termination = @provision_termination,
                    provision_definitions = @provision_definitions,
                    provision_claims = @provision_claims,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    application_id, contribution_text, eligible_individuals,
                    participation_percentage, participation_minimum_no, amount_of_insurance,
                    coverage_period, refund_of_premiums, termination_age, due_dates,
                    provision_enrollment, provision_rollover, provision_termination,
                    provision_definitions, provision_claims, created_at, updated_at
                )
                VALUES (
                    @application_id, @contribution_text, @eligible_individuals,
                    @participation_percentage, @participation_minimum_no, @amount_of_insurance,
                    @coverage_period, @refund_of_premiums, @termination_age, @due_dates,
                    @provision_enrollment, @provision_rollover, @provision_termination,
                    @provision_definitions, @provision_claims, GETDATE(), GETDATE()
                );
        `);

        // 2. Save Underwriting Limits
        const limitsReq = new sql.Request(transaction);
        const limitsData = data.gclip_underwringting_notes ?? data.gclip_underwriting_notes ?? {};

        const getLimitJson = (newArray, existingJson) => {
            if (!newArray || !Array.isArray(newArray) || newArray.length === 0) {
                return existingJson || '[]';
            }
            // Check if there is actual data inside the new array
            const hasData = newArray.some(item => {
                const amountVal = String(item.amount || item.limit || item.max_amount || item.amount_of_insurance || '').trim();
                const ageVal = String(item.age || item.age_bracket || item.attained_age || item.age_range || '').trim();
                return amountVal !== '' || ageVal !== '';
            });
            if (!hasData && existingJson && existingJson !== '[]') {
                return existingJson;
            }
            return JSON.stringify(newArray);
        };

        const nelJson = getLimitJson(limitsData.nel, existingLimits?.nel_json);
        const nmedJson = getLimitJson(limitsData.nmed, existingLimits?.nmed_json);
        const medJson = getLimitJson(limitsData.med, existingLimits?.med_json);
        const maxLimitJson = getLimitJson(limitsData.max_limit, existingLimits?.max_limit_json);
        const underwritingNotes = getVal(limitsData.underwriting_notes, existingLimits?.underwriting_notes);

        limitsReq.input('application_id', sql.Int, applicationId);
        limitsReq.input('nel_json', sql.NVarChar(sql.MAX), nelJson);
        limitsReq.input('nmed_json', sql.NVarChar(sql.MAX), nmedJson);
        limitsReq.input('med_json', sql.NVarChar(sql.MAX), medJson);
        limitsReq.input('max_limit_json', sql.NVarChar(sql.MAX), maxLimitJson);
        limitsReq.input('underwriting_notes', sql.NVarChar(sql.MAX), underwritingNotes);

        await limitsReq.query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    nel_json = @nel_json,
                    nmed_json = @nmed_json,
                    med_json = @med_json,
                    max_limit_json = @max_limit_json,
                    underwriting_notes = @underwriting_notes,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, nel_json, nmed_json, med_json, max_limit_json, underwriting_notes, created_at, updated_at)
                VALUES (@application_id, @nel_json, @nmed_json, @med_json, @max_limit_json, @underwriting_notes, GETDATE(), GETDATE());
        `);

        // 3. Auto-update EBAM Status
        const complete = isGclipComplete(data);
        const statusReq = new sql.Request(transaction);
        statusReq.input('application_id', sql.Int, applicationId);

        if (complete) {
            await statusReq.query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application
                SET ebam_status_id = 20, updated_at = GETDATE()
                WHERE application_id = @application_id 
                  AND status_id = 7;
            `);
        } else {
            await statusReq.query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application
                SET ebam_status_id = 19, updated_at = GETDATE()
                WHERE application_id = @application_id 
                  AND status_id = 7 
                  AND (ebam_status_id IS NULL OR ebam_status_id = 18);
            `);
        }

        await transaction.commit();
        return await getGclipOutstandingData(applicationId);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};
