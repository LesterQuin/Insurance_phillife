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
            const items = ratesData[jsonKey];
            if (Array.isArray(items)) {
                for (const item of items) {
                    let term = null;
                    let age = null;

                    if (item.term_or_months) {
                        const match = item.term_or_months.toString().match(/\d+/);
                        if (match) term = parseInt(match[0], 10);
                    }
                    if (item.term_or_age) {
                        const match = item.term_or_age.toString().match(/\d+/);
                        if (match) age = parseInt(match[0], 10);
                    }

                    const rateValue = parseFloat(item.rate);

                    await new sql.Request(transaction)
                        .input('plan_id', sql.Int, planId)
                        .input('application_id', sql.Int, applicationId)
                        .input('borrower_category', sql.VarChar(20), dbCategory)
                        .input('term_months', sql.Int, term)
                        .input('attained_age', sql.Int, age)
                        .input('premium_amount', sql.Decimal(18, 2), rateValue)
                        .query(`
                            INSERT INTO DHUB.sg.financial_insurance_application_rates 
                            (plan_id, application_id, borrower_category, term_months, attained_age, premium_amount, updated_at)
                            VALUES (@plan_id, @application_id, @borrower_category, @term_months, @attained_age, @premium_amount, GETDATE())
                        `);
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
            SELECT * FROM DHUB.sg.financial_insurance_application_rates WHERE application_id = @application_id
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
                fia.total_annual_premium, fia.evidence_notes
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u ON fia.user_id = u.user_id
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
                fia.total_annual_premium, fia.evidence_notes
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u ON fia.user_id = u.user_id
            WHERE fia.status_id = 1 AND fia.total_annual_premium IS NULL
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};