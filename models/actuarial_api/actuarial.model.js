import { poolPromise, sql } from '../../config/db.js';
import path from 'path';

// Helper to log application actions
const logApplicationAction = async (transaction, { applicationId, userId, actionType, changes, ipAddress }) => {
    const request = new sql.Request(transaction);
    await request
        .input('application_id', sql.Int, applicationId)
        .input('user_id', sql.Int, userId)
        .input('action_type', sql.NVarChar, actionType)
        .input('changes', sql.NVarChar(sql.MAX), JSON.stringify(changes))
        .input('ip_address', sql.NVarChar, ipAddress || null)
        .query(`
            INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
            VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
        `);
};

// Save application rates to the normalized table
export const saveApplicationRates = async (applicationId, ratesData, userId, ipAddress = null, diff = []) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const appRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`
                SELECT fia.plan_id, fia.number_of_lives, fia.minimum_age, fia.maximum_age, bp.basic_plan_name 
                FROM DHUB_UAT.sg.financial_insurance_application fia
                LEFT JOIN DHUB_UAT.sg.financial_insurance_basic_plan bp ON fia.basic_plan_id = bp.basic_plan_id
                WHERE fia.application_id = @appId
            `);
        
        const planId = appRes.recordset[0]?.plan_id || 1; 
        const basicPlanName = appRes.recordset[0]?.basic_plan_name || 'Basic Plan';
        const numLives = appRes.recordset[0]?.number_of_lives || 0;
        const minAge = appRes.recordset[0]?.minimum_age || 18;
        const maxAge = appRes.recordset[0]?.maximum_age || 65;
        const isCustomAge = minAge !== 18 || maxAge !== 65;
        const isScale2 = numLives > 30;

        const tableName = planId === 1
            ? 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gcli'
            : planId === 2 
                ? 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gyrt' 
                : planId === 3 
                    ? 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gpa' 
                    : planId === 4
                        ? 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gci'
                        : null;

        if (!tableName) {
            throw new Error(`Invalid plan_id (${planId}) for saving rates. Valid plan IDs are 1 (GCLI), 2 (GYRT), 3 (GPA), or 4 (GCI).`);
        }

        await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`DELETE FROM ${tableName} WHERE application_id = @appId`);

        const categories = {};
        if (planId !== 1 && isScale2 && isCustomAge) {
            categories[`${minAge}-${maxAge}`] = `${minAge}_${maxAge}`;
            if (maxAge < 65) {
                categories[`${maxAge + 1}-65`] = `${maxAge + 1}_65`;
            }
        } else {
            categories['18-65'] = '18_65';
        }

        categories['66-70'] = '66_70';
        categories['71-75'] = '71_75';
        categories['76-80'] = '76_80';

        for (const [jsonKey, dbCategory] of Object.entries(categories)) {
            const data = ratesData[jsonKey] || (jsonKey === '18-65' ? ratesData['18-64'] : null);
            if (!data) continue;

            // Helper to save individual rate row
            const saveRow = async (item, ageOverride = null, bandOverride = null, basicPlanIdOverride = null, rateOverride = null) => {
                    let term = null;
                    let age = ageOverride;
                    const riderId = (item.rider_id !== undefined && item.rider_id !== null) ? item.rider_id.toString() : '0';
                    const basicPlanId = basicPlanIdOverride || (item.basic_plan_id !== undefined && item.basic_plan_id !== null ? Number(item.basic_plan_id) : null);
                    const inputRate = rateOverride || item.basic_rate || item.rider_rate || (riderId === '0' ? item.rate : null) || (riderId !== '0' ? item.rate : null);
                    
                    if (item.term_of_months) {
                        const match = item.term_of_months.toString().match(/\d+/);
                        if (match) term = parseInt(match[0], 10);
                    }
                    if (!age && item.term_or_age) {
                        const match = item.term_or_age.toString().match(/\d+/);
                        if (match) age = parseInt(match[0], 10);
                    }

                    const rateValue = (inputRate !== undefined && inputRate !== null) ? String(inputRate).trim() : '0';

                    const request = new sql.Request(transaction)
                        .input('application_id', sql.Int, applicationId)
                        .input('borrower_category', sql.VarChar(20), dbCategory)
                        .input('attained_age', sql.Int, age)
                        .input('basic_plan_id', sql.Int, basicPlanId)
                        .input('age_band', sql.VarChar(100), bandOverride) // Matches the DB change
                        .input('rider_id', sql.VarChar(50), riderId)
                        .input('premium_rate', sql.VarChar(50), rateValue)
                        .input('created_by', sql.Int, userId);

                    if ([2, 3, 4].includes(planId)) {
                        await request.query(`INSERT INTO ${tableName} (application_id, basic_plan_id, rider_id, borrower_category, attained_age, age_band, premium_rate, created_by) 
                            VALUES (@application_id, @basic_plan_id, @rider_id, @borrower_category, @attained_age, @age_band, @premium_rate, @created_by)`);
                    } else {
                        await request
                            .input('plan_id', sql.Int, planId)
                            .input('term_months', sql.Int, term)
                            .query(`INSERT INTO ${tableName} (plan_id, application_id, borrower_category, term_months, attained_age, rider_id, basic_plan_id, premium_amount, updated_at, created_by)
                                VALUES (@plan_id, @application_id, @borrower_category, @term_months, @attained_age, @rider_id, @basic_plan_id, @premium_rate, GETDATE(), @created_by)`);
                    }
            };

            if (Array.isArray(data)) {
                for (const item of data) await saveRow(item);
            } else if (typeof data === 'object') {
                const bracketBasicPlanId = data.basic_plan_id;
                for (const [ageKey, ageItems] of Object.entries(data)) {
                    if (ageKey === 'basic_plan_id') continue;
                    const itemsArray = Array.isArray(ageItems) ? ageItems : [ageItems];

                    let numericAge = null;
                    let bandLabel = null;

                    if (ageKey === 'basic_plan') {
                        bandLabel = 'BASIC';
                    } else {
                        const isBand = ageKey.includes('_to_') || ageKey.split('_').length > 2;
                        const numericAgeMatch = ageKey.match(/\d+/g);
                        numericAge = !isBand && numericAgeMatch ? parseInt(numericAgeMatch[0], 10) : null;
                        bandLabel = isBand ? ageKey.replace('age_', '').replace('_', '-') : null;
                    }

                    for (const item of itemsArray) {
                        // 1. Save the basic rate entry. Pass bracketBasicPlanId to ensure consistency with the application.
                        await saveRow(item, numericAge, bandLabel, bracketBasicPlanId || item.basic_plan_id);

                        // 2. Save nested riders if present (identifies as their actual rider_id)
                        if (item.riders && Array.isArray(item.riders)) {
                            for (const rider of item.riders) {
                                await saveRow({
                                    ...rider,
                                    term_of_months: item.term_of_months 
                                }, numericAge, bandLabel, bracketBasicPlanId);
                            }
                        }
                    }
                }
            }
        }

        // Log the rates change action
        if (diff && diff.length > 0) {
            await logApplicationAction(transaction, {
                applicationId,
                userId,
                actionType: 'UPDATE_RATES',
                changes: diff,
                ipAddress
            });
        }

        await transaction.commit();
        return true;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Get application rates from normalized table
export const getApplicationRates = async (applicationId) => {
    const pool = await poolPromise;
    
    const appRes = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query('SELECT plan_id FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @application_id');
    
    const planId = appRes.recordset[0]?.plan_id;
    if (!planId) return [];

    let query = '';
    if (planId === 2 || planId === 3 || planId === 4) {
        const targetTable = planId === 2 
            ? 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gyrt' 
            : planId === 3 
                ? 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gpa'
                : 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gci';
        // Query for product specific table
        query = `SELECT r.*, rider.rider_name, rider.acronym, bp.basic_plan_name, bp.acronym as basic_plan_acronym
                 FROM ${targetTable} r
                 LEFT JOIN DHUB_UAT.sg.financial_insurance_riders rider ON r.rider_id = rider.rider_id
                 LEFT JOIN DHUB_UAT.sg.financial_insurance_basic_plan bp ON r.basic_plan_id = bp.basic_plan_id
                 WHERE r.application_id = @application_id`;
    } else if (planId === 1) {
        // Standard rates table
        const targetTable = 'DHUB_UAT.sg.financial_insurance_actuarial_rates_gcli';
        query = `SELECT r.*, rider.rider_name, rider.acronym, bp.basic_plan_name, bp.acronym as basic_plan_acronym
                 FROM ${targetTable} r
                 LEFT JOIN DHUB_UAT.sg.financial_insurance_riders rider ON r.rider_id = rider.rider_id
                 LEFT JOIN DHUB_UAT.sg.financial_insurance_basic_plan bp ON r.basic_plan_id = bp.basic_plan_id
                 WHERE r.application_id = @application_id`;
    } else {
        return [];
    }

    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(query);

    return result.recordset ?? [];
};

// Get list of applications that are pending rates
export const getApplicationsPendingRates = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT fia.application_id, fia.group_name, fia.created_at, fia.borrower_age_66_70, fia.borrower_age_71_75, fia.borrower_age_76_80,
                gl.name as proposal_type, p.product_name as plan_name, pp.name as prototype_name, u.firstname + ' ' + u.lastname as creator_name,
                fia.total_annual_premium, fia.evidence_notes, ml.month_name as loan_maturity_name
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml ON fia.sub_payment_term_id = ml.month_id
            WHERE fia.status_id IN (5, 8)
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};

// Get list of applications that are pending total annual premium
export const getApplicationsPendingTotalPremium = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT fia.application_id, fia.group_name, fia.created_at, fia.borrower_age_66_70, fia.borrower_age_71_75, fia.borrower_age_76_80,
                gl.name as proposal_type, p.product_name as plan_name, pp.name as prototype_name, u.firstname + ' ' + u.lastname as creator_name,
                fia.total_annual_premium, fia.evidence_notes, ml.month_name as loan_maturity_name
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml ON fia.sub_payment_term_id = ml.month_id
            WHERE fia.status_id IN (5, 8, 13) AND fia.total_annual_premium IS NULL
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};

// Get rate change history logs for all applications matching the same company name
export const getRatesHistoryByApplicationId = async (applicationId) => {
    const pool = await poolPromise;
    
    // 1. Get the group name of the current application
    const appRes = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query('SELECT group_name FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @application_id');
        
    const groupName = appRes.recordset[0]?.group_name;
    if (!groupName) return [];

    // 2. Fetch all rate log entries for all applications sharing the same group name
    const result = await pool.request()
        .input('group_name', sql.NVarChar, groupName)
        .query(`
            SELECT 
                l.log_id, 
                l.application_id, 
                l.user_id, 
                l.action_type, 
                l.changes, 
                l.ip_address, 
                l.created_at,
                u.firstname, 
                u.lastname, 
                u.email,
                fia.group_name
            FROM DHUB_UAT.sg.financial_insurance_application_history_logs l
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON l.user_id = u.user_id
            JOIN DHUB_UAT.sg.financial_insurance_application fia ON l.application_id = fia.application_id
            WHERE l.action_type = 'UPDATE_RATES'
              AND REPLACE(UPPER(fia.group_name), ' ', '') = REPLACE(UPPER(@group_name), ' ', '')
            ORDER BY l.created_at DESC
        `);

    return result.recordset.map(row => {
        let parsedRates = null;
        try {
            parsedRates = row.changes ? JSON.parse(row.changes) : null;
        } catch (e) {
            parsedRates = row.changes;
        }

        const dateObj = new Date(row.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'UTC' });

        return {
            log_id: row.log_id,
            application_id: row.application_id,
            group_name: row.group_name,
            created_at: row.created_at,
            change_date: formattedDate,
            change_time: formattedTime,
            ip_address: row.ip_address,
            user: {
                id: row.user_id,
                name: [row.firstname, row.lastname].filter(Boolean).join(' '),
                email: row.email
            },
            rates: parsedRates
        };
    }) ?? [];
};

// Save or update actuarial notes for an application
export const saveActuarialNotes = async (applicationId, notes, userId, showInPdf = true) => {
    const pool = await poolPromise;
    const showVal = (showInPdf === false || showInPdf === 'false' || showInPdf === 0) ? 0 : 1;
    
    // Check if notes already exist for this application and department
    const checkRes = await pool.request()
        .input('appId', sql.Int, applicationId)
        .input('department', sql.NVarChar(100), 'actuarial')
        .query(`
            SELECT id FROM DHUB_UAT.sg.financial_insurance_application_notes
            WHERE application_id = @appId AND department = @department
        `);

    if (checkRes.recordset && checkRes.recordset.length > 0) {
        // Update existing row
        await pool.request()
            .input('appId', sql.Int, applicationId)
            .input('department', sql.NVarChar(100), 'actuarial')
            .input('userId', sql.Int, userId)
            .input('notes', sql.NVarChar(sql.MAX), notes)
            .input('show_in_pdf', sql.Bit, showVal)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application_notes
                SET notes = @notes, user_id = @userId, show_in_pdf = @show_in_pdf, updated_at = GETDATE()
                WHERE application_id = @appId AND department = @department
            `);
    } else {
        // Insert new row
        await pool.request()
            .input('appId', sql.Int, applicationId)
            .input('department', sql.NVarChar(100), 'actuarial')
            .input('userId', sql.Int, userId)
            .input('notes', sql.NVarChar(sql.MAX), notes)
            .input('show_in_pdf', sql.Bit, showVal)
            .query(`
                INSERT INTO DHUB_UAT.sg.financial_insurance_application_notes (application_id, department, user_id, notes, show_in_pdf)
                VALUES (@appId, @department, @userId, @notes, @show_in_pdf)
            `);
    }
};

// Retrieve actuarial notes for an application
export const getActuarialNotes = async (applicationId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('appId', sql.Int, applicationId)
        .input('department', sql.NVarChar(100), 'actuarial')
        .query(`
            SELECT TOP 1 notes FROM DHUB_UAT.sg.financial_insurance_application_notes
            WHERE application_id = @appId AND department = @department
            ORDER BY updated_at DESC
        `);
    return res.recordset?.[0]?.notes ?? null;
};

// Save actuarial files
export const saveActuarialFiles = async (applicationId, filePaths, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();


        for (const file of filePaths) {
            if (file) {
                const filePath = typeof file === 'string' ? file : file.filePath;
                const fileName = typeof file === 'string' ? path.basename(file) : file.originalName;
                const insertRequest = new sql.Request(transaction);
                await insertRequest
                    .input('appId', sql.Int, applicationId)
                    .input('department', sql.NVarChar(100), 'actuarial')
                    .input('file_path', sql.NVarChar(500), filePath)
                    .input('file_name', sql.NVarChar(255), fileName)
                    .input('userId', sql.Int, userId)
                    .query(`
                        INSERT INTO DHUB_UAT.sg.financial_insurance_application_department_files (application_id, department, file_path, file_name, uploaded_by_user_id, created_at)
                        VALUES (@appId, @department, @file_path, @file_name, @userId, GETDATE())
                    `);
            }
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Retrieve actuarial files
export const getActuarialFiles = async (applicationId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('appId', sql.Int, applicationId)
        .input('department', sql.NVarChar(100), 'actuarial')
        .query(`
            SELECT file_path FROM DHUB_UAT.sg.financial_insurance_application_department_files
            WHERE application_id = @appId AND department = @department
        `);
    return (res.recordset || []).map(f => f.file_path);
};

// Save or update actuarial to cfe notes for an application
export const saveActuarialToCfeNotes = async (applicationId, notes, userId) => {
    const pool = await poolPromise;
    const department = 'actuarial_to_cfe';
    
    // Check if notes already exist for this application and department
    const checkRes = await pool.request()
        .input('appId', sql.Int, applicationId)
        .input('department', sql.NVarChar(100), department)
        .query(`
            SELECT id FROM DHUB_UAT.sg.financial_insurance_application_notes
            WHERE application_id = @appId AND department = @department
        `);

    if (checkRes.recordset && checkRes.recordset.length > 0) {
        // Update existing row
        await pool.request()
            .input('appId', sql.Int, applicationId)
            .input('department', sql.NVarChar(100), department)
            .input('userId', sql.Int, userId)
            .input('notes', sql.NVarChar(sql.MAX), notes)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application_notes
                SET notes = @notes, user_id = @userId, show_in_pdf = 0, updated_at = GETDATE()
                WHERE application_id = @appId AND department = @department
            `);
    } else {
        // Insert new row
        await pool.request()
            .input('appId', sql.Int, applicationId)
            .input('department', sql.NVarChar(100), department)
            .input('userId', sql.Int, userId)
            .input('notes', sql.NVarChar(sql.MAX), notes)
            .query(`
                INSERT INTO DHUB_UAT.sg.financial_insurance_application_notes (application_id, department, user_id, notes, show_in_pdf)
                VALUES (@appId, @department, @userId, @notes, 0)
            `);
    }
};

// Retrieve actuarial to cfe notes for an application
export const getActuarialToCfeNotes = async (applicationId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('appId', sql.Int, applicationId)
        .input('department', sql.NVarChar(100), 'actuarial_to_cfe')
        .query(`
            SELECT TOP 1 notes FROM DHUB_UAT.sg.financial_insurance_application_notes
            WHERE application_id = @appId AND department = @department
            ORDER BY updated_at DESC
        `);
    return res.recordset?.[0]?.notes ?? null;
};