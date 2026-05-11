import { poolPromise, sql } from '../../config/db.js';

// Save application rates to the normalized table
export const saveApplicationRates = async (applicationId, ratesData) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const appRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query('SELECT plan_id FROM DHUB.sg.financial_insurance_application WHERE application_id = @appId');
        
        const planId = appRes.recordset[0]?.plan_id || 1; 

        await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query('DELETE FROM DHUB.sg.financial_insurance_application_rates WHERE application_id = @appId');

        const categories = {
            '18-64': '18_64',
            '66-70': '66_70',
            '71-75': '71_75',
            '76-80': '76_80'
        };

        for (const [jsonKey, dbCategory] of Object.entries(categories)) {
            const data = ratesData[jsonKey];
            if (!data) continue;

            // Helper to save individual rate row
            const saveRow = async (item, ageOverride = null) => {
                    let term = null;
                    let age = ageOverride;
                    const riderId = item.rider_id ? parseInt(item.rider_id, 10) : null;

                    if (item.term_or_months) {
                        const match = item.term_or_months.toString().match(/\d+/);
                        if (match) term = parseInt(match[0], 10);
                    }
                    if (!age && item.term_or_age) {
                        const match = item.term_or_age.toString().match(/\d+/);
                        if (match) age = parseInt(match[0], 10);
                    }

                    const rateValue = typeof item.rate === 'string' 
                        ? parseFloat(item.rate.replace(/,/g, '')) 
                        : parseFloat(item.rate);

                    await new sql.Request(transaction)
                        .input('plan_id', sql.Int, planId)
                        .input('application_id', sql.Int, applicationId)
                        .input('borrower_category', sql.VarChar(20), dbCategory)
                        .input('term_months', sql.Int, term)
                        .input('attained_age', sql.Int, age)
                        .input('rider_id', sql.Int, riderId)
                        .input('premium_amount', sql.Decimal(18, 2), rateValue)
                        .query(`
                            INSERT INTO DHUB.sg.financial_insurance_application_rates 
                            (plan_id, application_id, borrower_category, term_months, attained_age, rider_id, premium_amount, updated_at)
                            VALUES (@plan_id, @application_id, @borrower_category, @term_months, @attained_age, @rider_id, @premium_amount, GETDATE())
                        `);
            };

            if (Array.isArray(data)) {
                // Standard flat array (usually 18-64)
                for (const item of data) await saveRow(item);
            } else if (typeof data === 'object') {
                // New nested structure (Senior age groups)
                for (const [ageKey, ageItems] of Object.entries(data)) {
                    const numericAgeMatch = ageKey.match(/\d+/);
                    const numericAge = numericAgeMatch ? parseInt(numericAgeMatch[0], 10) : null;
                    if (Array.isArray(ageItems)) {
                        for (const item of ageItems) await saveRow(item, numericAge);
                    }
                }
            }
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
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT r.*, rider.rider_name 
            FROM DHUB.sg.financial_insurance_application_rates r
            LEFT JOIN DHUB.sg.financial_insurance_riders rider ON r.rider_id = rider.rider_id
            WHERE r.application_id = @application_id
        `);
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
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB.sg.financial_insurance_month_lookups ml ON fia.sub_payment_term_id = ml.month_id
            WHERE fia.status_id = 1 AND fia.total_annual_premium IS NULL
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
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB.sg.financial_insurance_month_lookups ml ON fia.sub_payment_term_id = ml.month_id
            WHERE fia.status_id = 1 AND fia.total_annual_premium IS NULL
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};