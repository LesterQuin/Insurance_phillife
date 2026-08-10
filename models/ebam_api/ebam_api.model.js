import { poolPromise, sql } from '../../config/db.js';
import * as Model from '../financial_Insurance_form.model.js';
import * as User from '../user/user_model.js';

// Ensure table for tracking custom Special Underwriting Provisions & Contribution exists
export const ensureUnderwritingProvisionsTable = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        IF OBJECT_ID('DHUB_UAT.sg.financial_insurance_ebam_underwriting', 'U') IS NULL
        BEGIN
            CREATE TABLE DHUB_UAT.sg.financial_insurance_ebam_underwriting (
                provision_id INT IDENTITY(1,1) PRIMARY KEY,
                application_id INT NOT NULL UNIQUE,
                provision_text NVARCHAR(MAX) NULL,
                contribution_text NVARCHAR(MAX) NULL,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            );
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
            SELECT provision_id, application_id, provision_text, contribution_text, created_at, updated_at
            FROM DHUB_UAT.sg.financial_insurance_ebam_underwriting
            WHERE application_id = @application_id
        `);

    return result.recordset[0] || null;
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
            MERGE INTO DHUB_UAT.sg.financial_insurance_ebam_underwriting WITH (HOLDLOCK) AS target
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
            MERGE INTO DHUB_UAT.sg.financial_insurance_ebam_underwriting WITH (HOLDLOCK) AS target
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

export const getCOCPdfData = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) return null;
    
    const riders = await Model.getApplicationRiders(id);
    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);
    const provisionsRow = await getUnderwritingProvisions(id);
    const user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    return {
        appData,
        riders,
        rankings,
        rankingRiders,
        provisions: provisionsRow ? provisionsRow.provision_text : null,
        contribution_text: provisionsRow ? provisionsRow.contribution_text : null,
        user
    };
};
