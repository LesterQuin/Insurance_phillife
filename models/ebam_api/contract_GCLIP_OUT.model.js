import { poolPromise, sql } from '../../config/db.js';
import { getCOCPdfData } from './ebam_api.model.js';
export { getCOCPdfData };

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

// Fetch custom special underwriting provisions & contribution for an application
export const getUnderwritingProvisions = async (applicationId) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT provision_id, application_id, provision_text, contribution_text, eligible_individuals,
                   participation_percentage, participation_minimum_no, termination_age,
                   provision_enrollment, provision_rollover, provision_termination, provision_definitions, provision_claims, refund_of_premiums,
                   amount_of_insurance, coverage_period, due_dates, created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting
            WHERE application_id = @application_id
        `);

    const row = result.recordset[0];
    if (row) {
        return {
            ...row,
            participation_percentage: row.participation_percentage || '100%',
            participation_minimum_no: row.participation_minimum_no,
            termination_age: row.termination_age,
            provision_enrollment: row.provision_enrollment,
            provision_rollover: row.provision_rollover,
            provision_termination: row.provision_termination,
            provision_definitions: row.provision_definitions,
            provision_claims: row.provision_claims,
            refund_of_premiums: row.refund_of_premiums,
            amount_of_insurance: row.amount_of_insurance,
            coverage_period: row.coverage_period,
            due_dates: row.due_dates
        };
    }
    return null;
};

// Save/update special underwriting provisions for an application
export const saveUnderwritingProvisions = async (applicationId, provisionText = null) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    const textToSave = Array.isArray(provisionText)
        ? provisionText.join('')
        : (typeof provisionText === 'string' ? provisionText : (provisionText ? String(provisionText) : null));

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('provision_text', sql.NVarChar(sql.MAX), textToSave)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    provision_text = @provision_text,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, provision_text, created_at, updated_at)
                VALUES (@application_id, @provision_text, GETDATE(), GETDATE());
            `);

    return await getUnderwritingProvisions(applicationId);
};



// Save/update special underwriting provisions sections for an application
export const saveSpecialProvisions = async (applicationId, params = {}) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    const existing = await getUnderwritingProvisions(applicationId) || {};

    const merged = {
        provision_enrollment: params.enrollment !== undefined ? params.enrollment : existing.provision_enrollment,
        provision_rollover: params.rollover !== undefined ? params.rollover : existing.provision_rollover,
        provision_termination: params.termination !== undefined ? params.termination : existing.provision_termination,
        provision_definitions: params.definitions !== undefined ? params.definitions : existing.provision_definitions,
        provision_claims: params.claims !== undefined ? params.claims : existing.provision_claims
    };

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('provision_enrollment', sql.NVarChar(sql.MAX), merged.provision_enrollment)
        .input('provision_rollover', sql.NVarChar(sql.MAX), merged.provision_rollover)
        .input('provision_termination', sql.NVarChar(sql.MAX), merged.provision_termination)
        .input('provision_definitions', sql.NVarChar(sql.MAX), merged.provision_definitions)
        .input('provision_claims', sql.NVarChar(sql.MAX), merged.provision_claims)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    provision_enrollment = @provision_enrollment,
                    provision_rollover = @provision_rollover,
                    provision_termination = @provision_termination,
                    provision_definitions = @provision_definitions,
                    provision_claims = @provision_claims,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, provision_enrollment, provision_rollover, provision_termination, provision_definitions, provision_claims, created_at, updated_at)
                VALUES (@application_id, @provision_enrollment, @provision_rollover, @provision_termination, @provision_definitions, @provision_claims, GETDATE(), GETDATE());
        `);

    return await getUnderwritingProvisions(applicationId);
};



// Save/update contribution text for an application
export const saveContributionText = async (applicationId, contributionText = null) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    const textToSave = typeof contributionText === 'string' 
        ? contributionText 
        : (contributionText ? String(contributionText) : null);

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('contribution_text', sql.NVarChar(sql.MAX), textToSave)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    contribution_text = @contribution_text,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, contribution_text, created_at, updated_at)
                VALUES (@application_id, @contribution_text, GETDATE(), GETDATE());
        `);

    return await getUnderwritingProvisions(applicationId);
};

// Save/update eligible individuals text for an application
export const saveEligibleIndividuals = async (applicationId, eligibleIndividualsText = null) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    const textToSave = typeof eligibleIndividualsText === 'string' 
        ? eligibleIndividualsText 
        : (eligibleIndividualsText ? String(eligibleIndividualsText) : null);

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('eligible_individuals', sql.NVarChar(sql.MAX), textToSave)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    eligible_individuals = @eligible_individuals,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, eligible_individuals, created_at, updated_at)
                VALUES (@application_id, @eligible_individuals, GETDATE(), GETDATE());
        `);

    return await getUnderwritingProvisions(applicationId);
};

// Save/update participation requirements (percentage & minimum_no) for an application
export const saveParticipationRequirements = async (applicationId, params = {}) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    let percentage = null;
    let minimumNo = null;

    if (typeof params === 'string') {
        try {
            const parsed = JSON.parse(params);
            percentage = parsed.percentage || null;
            minimumNo = typeof parsed.minimum_no === 'string' ? parsed.minimum_no : (Array.isArray(parsed.minimum_no) ? JSON.stringify(parsed.minimum_no) : null);
        } catch (e) {
            minimumNo = params;
        }
    } else if (typeof params === 'object' && params !== null) {
        const bodyObj = params.participation_requirements || params;
        percentage = bodyObj.percentage || bodyObj.participation_percentage || null;
        const minVal = bodyObj.minimum_no ?? bodyObj.participation_minimum_no;
        minimumNo = typeof minVal === 'string' ? minVal : (Array.isArray(minVal) ? JSON.stringify(minVal) : (minVal ? JSON.stringify(minVal) : null));
    }

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('participation_percentage', sql.NVarChar(50), percentage)
        .input('participation_minimum_no', sql.NVarChar(sql.MAX), minimumNo)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    participation_percentage = COALESCE(@participation_percentage, target.participation_percentage),
                    participation_minimum_no = COALESCE(@participation_minimum_no, target.participation_minimum_no),
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, participation_percentage, participation_minimum_no, created_at, updated_at)
                VALUES (@application_id, @participation_percentage, @participation_minimum_no, GETDATE(), GETDATE());
        `);

    return await getUnderwritingProvisions(applicationId);
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

// Fetch custom underwriting limits for an application
export const getUnderwritingLimits = async (applicationId) => {
    const pool = await poolPromise;
    await ensureUnderwritingLimitsTable();

    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT limit_id, application_id, nel_json, nmed_json, med_json, max_limit_json, underwriting_notes, created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting_limits
            WHERE application_id = @application_id
        `);

    const row = result.recordset[0];
    if (row) {
        return {
            limit_id: row.limit_id,
            application_id: row.application_id,
            nel: row.nel_json ? JSON.parse(row.nel_json) : [],
            nmed: row.nmed_json ? JSON.parse(row.nmed_json) : [],
            med: row.med_json ? JSON.parse(row.med_json) : [],
            max_limit: row.max_limit_json ? JSON.parse(row.max_limit_json) : [],
            underwriting_notes: row.underwriting_notes,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }
    return null;
};

// Save/update custom underwriting limits for an application
export const saveUnderwritingLimits = async (applicationId, params = {}) => {
    const pool = await poolPromise;
    await ensureUnderwritingLimitsTable();

    const existing = await getUnderwritingLimits(applicationId) || {};

    const merged = {
        nel: params.nel !== undefined ? params.nel : (existing.nel || []),
        nmed: params.nmed !== undefined ? params.nmed : (existing.nmed || []),
        med: params.med !== undefined ? params.med : (existing.med || []),
        max_limit: params.max_limit !== undefined ? params.max_limit : (existing.max_limit || []),
        underwriting_notes: params.underwriting_notes !== undefined ? params.underwriting_notes : existing.underwriting_notes
    };

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('nel_json', sql.NVarChar(sql.MAX), JSON.stringify(merged.nel))
        .input('nmed_json', sql.NVarChar(sql.MAX), JSON.stringify(merged.nmed))
        .input('med_json', sql.NVarChar(sql.MAX), JSON.stringify(merged.med))
        .input('max_limit_json', sql.NVarChar(sql.MAX), JSON.stringify(merged.max_limit))
        .input('underwriting_notes', sql.NVarChar(sql.MAX), merged.underwriting_notes)
        .query(`
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

    return await getUnderwritingLimits(applicationId);
};

// Save/update Schedule of Insurance parameter fields for an application
export const saveScheduleOfInsurance = async (applicationId, params = {}) => {
    const pool = await poolPromise;
    await ensureUnderwritingProvisionsTable();

    const existing = await getUnderwritingProvisions(applicationId) || {};

    const merged = {
        amount_of_insurance: params.amount_of_insurance !== undefined ? params.amount_of_insurance : existing.amount_of_insurance,
        coverage_period: params.coverage_period !== undefined ? params.coverage_period : existing.coverage_period,
        refund_of_premiums: params.refund_of_premiums !== undefined ? params.refund_of_premiums : existing.refund_of_premiums,
        termination_age: params.termination_age !== undefined ? (params.termination_age === null ? null : parseInt(params.termination_age)) : existing.termination_age,
        due_dates: params.due_dates !== undefined ? params.due_dates : existing.due_dates
    };

    await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('amount_of_insurance', sql.NVarChar(sql.MAX), merged.amount_of_insurance)
        .input('coverage_period', sql.NVarChar(sql.MAX), merged.coverage_period)
        .input('refund_of_premiums', sql.NVarChar(sql.MAX), merged.refund_of_premiums)
        .input('termination_age', sql.Int, merged.termination_age)
        .input('due_dates', sql.NVarChar(sql.MAX), merged.due_dates)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gcli_outstanding_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    amount_of_insurance = @amount_of_insurance,
                    coverage_period = @coverage_period,
                    refund_of_premiums = @refund_of_premiums,
                    termination_age = @termination_age,
                    due_dates = @due_dates,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, amount_of_insurance, coverage_period, refund_of_premiums, termination_age, due_dates, created_at, updated_at)
                VALUES (@application_id, @amount_of_insurance, @coverage_period, @refund_of_premiums, @termination_age, @due_dates, GETDATE(), GETDATE());
        `);

    return await getUnderwritingProvisions(applicationId);
};
