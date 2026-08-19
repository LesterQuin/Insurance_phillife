import { poolPromise, sql } from '../../config/db.js';
import { getCOCPdfData } from './ebam_api.model.js';
export { getCOCPdfData };

// Ensure table for tracking GPA Special Underwriting Provisions, Contribution, Participation, and Schedule Due Dates exists
export const ensureUnderwritingProvisionsTable = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        IF OBJECT_ID('DHUB_UAT.sg.financial_insurance_gpa_underwriting', 'U') IS NULL
        BEGIN
            CREATE TABLE DHUB_UAT.sg.financial_insurance_gpa_underwriting (
                provision_id INT IDENTITY(1,1) PRIMARY KEY,
                application_id INT NOT NULL UNIQUE,
                provision_text NVARCHAR(MAX) NULL,
                contribution_text NVARCHAR(MAX) NULL,
                eligible_individuals NVARCHAR(MAX) NULL,
                participation_percentage NVARCHAR(50) NULL,
                participation_minimum_no NVARCHAR(MAX) NULL,
                first_due_date NVARCHAR(MAX) NULL,
                renewal_due_date NVARCHAR(MAX) NULL,
                additions_due_date NVARCHAR(MAX) NULL,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            );
        END
        ELSE
        BEGIN
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gpa_underwriting', 'participation_percentage') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gpa_underwriting
                ADD participation_percentage NVARCHAR(50) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gpa_underwriting', 'participation_minimum_no') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gpa_underwriting
                ADD participation_minimum_no NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gpa_underwriting', 'first_due_date') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gpa_underwriting
                ADD first_due_date NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gpa_underwriting', 'renewal_due_date') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gpa_underwriting
                ADD renewal_due_date NVARCHAR(MAX) NULL;
            END
            IF COL_LENGTH('DHUB_UAT.sg.financial_insurance_gpa_underwriting', 'additions_due_date') IS NULL
            BEGIN
                ALTER TABLE DHUB_UAT.sg.financial_insurance_gpa_underwriting
                ADD additions_due_date NVARCHAR(MAX) NULL;
            END
        END
    `);
};

// Get custom Underwriting Provisions for a specific GPA application
export const getUnderwritingProvisions = async (applicationId) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;
    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT provision_id, application_id, provision_text, contribution_text, eligible_individuals,
                   participation_percentage, participation_minimum_no,
                   first_due_date, renewal_due_date, additions_due_date,
                   created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting
            WHERE application_id = @application_id;
        `);

    if (!res.recordset || res.recordset.length === 0) {
        return null;
    }

    const row = res.recordset[0];
    return {
        provision_id: row.provision_id,
        application_id: row.application_id,
        provision_text: row.provision_text,
        contribution_text: row.contribution_text,
        eligible_individuals: row.eligible_individuals,
        participation_percentage: row.participation_percentage,
        participation_minimum_no: row.participation_minimum_no,
        first_due_date: row.first_due_date,
        renewal_due_date: row.renewal_due_date,
        additions_due_date: row.additions_due_date,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
};

// Save/Update Special Underwriting Provisions text
export const saveSpecialProvisions = async (applicationId, text) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;

    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('provision_text', sql.NVarChar(sql.MAX), typeof text === 'string' ? text : JSON.stringify(text))
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gpa_underwriting AS target
            USING (SELECT @application_id AS application_id) AS source
            ON (target.application_id = source.application_id)
            WHEN MATCHED THEN
                UPDATE SET provision_text = @provision_text, updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, provision_text, created_at, updated_at)
                VALUES (@application_id, @provision_text, GETDATE(), GETDATE());

            SELECT provision_id, application_id, provision_text, contribution_text, eligible_individuals,
                   participation_percentage, participation_minimum_no,
                   first_due_date, renewal_due_date, additions_due_date,
                   created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting
            WHERE application_id = @application_id;
        `);

    return res.recordset[0];
};

// Save/Update Contribution text
export const saveContributionText = async (applicationId, text) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;

    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('contribution_text', sql.NVarChar(sql.MAX), typeof text === 'string' ? text : JSON.stringify(text))
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gpa_underwriting AS target
            USING (SELECT @application_id AS application_id) AS source
            ON (target.application_id = source.application_id)
            WHEN MATCHED THEN
                UPDATE SET contribution_text = @contribution_text, updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, contribution_text, created_at, updated_at)
                VALUES (@application_id, @contribution_text, GETDATE(), GETDATE());

            SELECT provision_id, application_id, provision_text, contribution_text, eligible_individuals,
                   participation_percentage, participation_minimum_no,
                   first_due_date, renewal_due_date, additions_due_date,
                   created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting
            WHERE application_id = @application_id;
        `);

    return res.recordset[0];
};

// Save/Update Eligible Individuals text
export const saveEligibleIndividuals = async (applicationId, text) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;

    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('eligible_individuals', sql.NVarChar(sql.MAX), typeof text === 'string' ? text : JSON.stringify(text))
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gpa_underwriting AS target
            USING (SELECT @application_id AS application_id) AS source
            ON (target.application_id = source.application_id)
            WHEN MATCHED THEN
                UPDATE SET eligible_individuals = @eligible_individuals, updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, eligible_individuals, created_at, updated_at)
                VALUES (@application_id, @eligible_individuals, GETDATE(), GETDATE());

            SELECT provision_id, application_id, provision_text, contribution_text, eligible_individuals,
                   participation_percentage, participation_minimum_no,
                   first_due_date, renewal_due_date, additions_due_date,
                   created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting
            WHERE application_id = @application_id;
        `);

    return res.recordset[0];
};

// Save/Update Participation Requirements (Percentage & Minimum Number)
export const saveParticipationRequirements = async (applicationId, params = {}) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;

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

    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('participation_percentage', sql.NVarChar(50), percentage)
        .input('participation_minimum_no', sql.NVarChar(sql.MAX), minimumNo)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gpa_underwriting AS target
            USING (SELECT @application_id AS application_id) AS source
            ON (target.application_id = source.application_id)
            WHEN MATCHED THEN
                UPDATE SET 
                    participation_percentage = COALESCE(@participation_percentage, target.participation_percentage),
                    participation_minimum_no = COALESCE(@participation_minimum_no, target.participation_minimum_no),
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, participation_percentage, participation_minimum_no, created_at, updated_at)
                VALUES (@application_id, @participation_percentage, @participation_minimum_no, GETDATE(), GETDATE());

            SELECT provision_id, application_id, provision_text, contribution_text, eligible_individuals,
                   participation_percentage, participation_minimum_no,
                   first_due_date, renewal_due_date, additions_due_date,
                   created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting
            WHERE application_id = @application_id;
        `);

    return res.recordset[0];
};

// Save/Update Schedule of Insurance Due Dates for GPA
export const saveScheduleOfInsurance = async (applicationId, params = {}) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;

    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .input('first_due_date', sql.NVarChar(sql.MAX), params.first_due_date !== undefined ? params.first_due_date : null)
        .input('renewal_due_date', sql.NVarChar(sql.MAX), params.renewal_due_date !== undefined ? params.renewal_due_date : null)
        .input('additions_due_date', sql.NVarChar(sql.MAX), params.additions_due_date !== undefined ? params.additions_due_date : null)
        .query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gpa_underwriting AS target
            USING (SELECT @application_id AS application_id) AS source
            ON (target.application_id = source.application_id)
            WHEN MATCHED THEN
                UPDATE SET 
                    first_due_date = COALESCE(@first_due_date, target.first_due_date),
                    renewal_due_date = COALESCE(@renewal_due_date, target.renewal_due_date),
                    additions_due_date = COALESCE(@additions_due_date, target.additions_due_date),
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (application_id, first_due_date, renewal_due_date, additions_due_date, created_at, updated_at)
                VALUES (@application_id, @first_due_date, @renewal_due_date, @additions_due_date, GETDATE(), GETDATE());

            SELECT provision_id, application_id, first_due_date, renewal_due_date, additions_due_date, created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting
            WHERE application_id = @application_id;
        `);

    return res.recordset[0];
};

// Safe fallback for GPA (GPA contracts do not use custom NEL limits table)
export const getUnderwritingLimits = async (applicationId) => {
    return null;
};
