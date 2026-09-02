import { poolPromise, sql } from '../../config/db.js';

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

// Completeness check for GPA template
const isGpaComplete = (data) => {
    const contributionText = data.gpa_contribution?.contribution ?? data.gpa_contribution?.contribution_text;
    if (!contributionText || contributionText.trim() === '') return false;

    const eligibleIndividuals = data.gpa_eligible_individuals?.eligible_individuals ?? data.gpa_eligible_individuals?.eligible_individuals_text;
    if (!eligibleIndividuals || eligibleIndividuals.trim() === '') return false;

    const reqPercentage = data.gpa_participation_requirements?.percentage ?? data.gpa_participation_requirements?.participation_percentage;
    const minVal = data.gpa_participation_requirements?.minimum_no ?? data.gpa_participation_requirements?.participation_minimum_no;
    if (!reqPercentage || reqPercentage.trim() === '') return false;
    if (!minVal || (typeof minVal === 'string' && minVal.trim() === '')) return false;

    const specialProvisions = data.gpa_special_provisions?.special_provisions ?? data.gpa_special_provisions?.special_underwriting_provisions ?? data.gpa_special_provisions?.provision_text;
    if (!specialProvisions || specialProvisions.trim() === '') return false;

    const firstDueDate = data.gpa_schedule_of_insurance?.first_due_date;
    const renewalDueDate = data.gpa_schedule_of_insurance?.renewal_due_date;
    const additionsDueDate = data.gpa_schedule_of_insurance?.additions_due_date;
    if (!firstDueDate || firstDueDate.trim() === '') return false;
    if (!renewalDueDate || renewalDueDate.trim() === '') return false;
    if (!additionsDueDate || additionsDueDate.trim() === '') return false;

    return true;
};

// Get unified GPA data compiled together
export const getGpaData = async (applicationId) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;
    const res = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT * FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting 
            WHERE application_id = @application_id;
        `);
    
    const row = res.recordset?.[0] || null;

    return {
        application_id: applicationId,
        gpa_contribution: {
            contribution: row?.contribution_text || ""
        },
        gpa_eligible_individuals: {
            eligible_individuals: row?.eligible_individuals || ""
        },
        gpa_participation_requirements: {
            participation_percentage: row?.participation_percentage || "100%",
            participation_minimum_no: row?.participation_minimum_no || ""
        },
        gpa_special_provisions: {
            special_provisions: row?.provision_text || ""
        },
        gpa_schedule_of_insurance: {
            first_due_date: row?.first_due_date || "",
            renewal_due_date: row?.renewal_due_date || "",
            additions_due_date: row?.additions_due_date || ""
        }
    };
};

// Save/Update unified GPA data compiled together (with Transaction)
export const saveGpaData = async (applicationId, data) => {
    await ensureUnderwritingProvisionsTable();
    const pool = await poolPromise;
    
    // Fetch existing records to prevent clearing previously input values when sending partial updates
    const existingProvRes = await pool.request().input('application_id', sql.Int, applicationId).query(`
        SELECT * FROM DHUB_UAT.sg.financial_insurance_gpa_underwriting 
        WHERE application_id = @application_id;
    `);
    const existingProv = existingProvRes.recordset?.[0] || null;

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const req = new sql.Request(transaction);

        // Helper to get non-empty new value or keep existing
        const getVal = (newVal, existingVal) => {
            if (newVal === undefined || newVal === null || String(newVal).trim() === '') {
                return existingVal ?? null;
            }
            return newVal;
        };

        const contributionText = getVal(
            data.gpa_contribution?.contribution ?? data.gpa_contribution?.contribution_text,
            existingProv?.contribution_text
        );
        const eligibleIndividuals = getVal(
            data.gpa_eligible_individuals?.eligible_individuals ?? data.gpa_eligible_individuals?.eligible_individuals_text,
            existingProv?.eligible_individuals
        );

        const reqPercentage = getVal(
            data.gpa_participation_requirements?.percentage ?? data.gpa_participation_requirements?.participation_percentage,
            existingProv?.participation_percentage
        );
        
        const minVal = data.gpa_participation_requirements?.minimum_no ?? data.gpa_participation_requirements?.participation_minimum_no;
        let participationMinimumNo = null;
        if (minVal !== undefined && minVal !== null && String(minVal).trim() !== '' && !(Array.isArray(minVal) && minVal.length === 0)) {
            participationMinimumNo = typeof minVal === 'string' ? minVal : JSON.stringify(minVal);
        } else {
            participationMinimumNo = existingProv?.participation_minimum_no ?? null;
        }

        const specialProvisions = getVal(
            data.gpa_special_provisions?.special_provisions ?? data.gpa_special_provisions?.special_underwriting_provisions ?? data.gpa_special_provisions?.provision_text ?? data.gpa_special_provision?.special_provisions ?? data.gpa_special_provision?.provision_text,
            existingProv?.provision_text
        );

        const firstDueDate = getVal(data.gpa_schedule_of_insurance?.first_due_date, existingProv?.first_due_date);
        const renewalDueDate = getVal(data.gpa_schedule_of_insurance?.renewal_due_date, existingProv?.renewal_due_date);
        const additionsDueDate = getVal(data.gpa_schedule_of_insurance?.additions_due_date, existingProv?.additions_due_date);

        req.input('application_id', sql.Int, applicationId);
        req.input('contribution_text', sql.NVarChar(sql.MAX), contributionText);
        req.input('eligible_individuals', sql.NVarChar(sql.MAX), eligibleIndividuals);
        req.input('participation_percentage', sql.NVarChar(50), reqPercentage);
        req.input('participation_minimum_no', sql.NVarChar(sql.MAX), participationMinimumNo);
        req.input('provision_text', sql.NVarChar(sql.MAX), specialProvisions);
        req.input('first_due_date', sql.NVarChar(sql.MAX), firstDueDate);
        req.input('renewal_due_date', sql.NVarChar(sql.MAX), renewalDueDate);
        req.input('additions_due_date', sql.NVarChar(sql.MAX), additionsDueDate);

        await req.query(`
            MERGE INTO DHUB_UAT.sg.financial_insurance_gpa_underwriting WITH (HOLDLOCK) AS target
            USING (SELECT @application_id AS application_id) AS source
            ON target.application_id = source.application_id
            WHEN MATCHED THEN
                UPDATE SET 
                    contribution_text = @contribution_text,
                    eligible_individuals = @eligible_individuals,
                    participation_percentage = @participation_percentage,
                    participation_minimum_no = @participation_minimum_no,
                    provision_text = @provision_text,
                    first_due_date = @first_due_date,
                    renewal_due_date = @renewal_due_date,
                    additions_due_date = @additions_due_date,
                    updated_at = GETDATE()
            WHEN NOT MATCHED THEN
                INSERT (
                    application_id, contribution_text, eligible_individuals,
                    participation_percentage, participation_minimum_no, provision_text,
                    first_due_date, renewal_due_date, additions_due_date, created_at, updated_at
                )
                VALUES (
                    @application_id, @contribution_text, @eligible_individuals,
                    @participation_percentage, @participation_minimum_no, @provision_text,
                    @first_due_date, @renewal_due_date, @additions_due_date, GETDATE(), GETDATE()
                );
        `);

        // 3. Auto-update EBAM Status
        const complete = isGpaComplete(data);
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
        return await getGpaData(applicationId);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};
