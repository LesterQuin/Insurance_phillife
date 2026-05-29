import { poolPromise, sql } from '../../config/db.js';

// Save application rates to the normalized table
export const saveApplicationRates = async (applicationId, ratesData, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const appRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`
                SELECT fia.plan_id, bp.basic_plan_name 
                FROM DHUB.sg.financial_insurance_application fia
                LEFT JOIN DHUB.sg.financial_insurance_basic_plan bp ON fia.basic_plan_id = bp.basic_plan_id
                WHERE fia.application_id = @appId
            `);
        
        const planId = appRes.recordset[0]?.plan_id || 1; 
        const basicPlanName = appRes.recordset[0]?.basic_plan_name || 'Basic Plan';

        const tableName = planId === 1
            ? 'DHUB.sg.financial_insurance_actuarial_rates_gcli'
            : planId === 2 
                ? 'DHUB.sg.financial_insurance_actuarial_rates_gyrt' 
                : planId === 3 
                    ? 'DHUB.sg.financial_insurance_actuarial_rates_gpa' 
                    : 'DHUB.sg.financial_insurance_application_rates';

        await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`DELETE FROM ${tableName} WHERE application_id = @appId`);

        const categories = {
            '18-65': '18_65',
            '66-70': '66_70',
            '71-75': '71_75',
            '76-80': '76_80'
        };

        for (const [jsonKey, dbCategory] of Object.entries(categories)) {
            const data = ratesData[jsonKey] || (jsonKey === '18-65' ? ratesData['18-64'] : null);
            if (!data) continue;

            // Helper to save individual rate row
            const saveRow = async (item, ageOverride = null, bandOverride = null, basicPlanIdOverride = null, rateOverride = null) => {
                    let term = null;
                    let age = ageOverride;
                    const riderId = item.rider_id !== undefined ? item.rider_id.toString() : '0';
                    const basicPlanId = basicPlanIdOverride || (item.basic_plan_id !== undefined && item.basic_plan_id !== null ? Number(item.basic_plan_id) : null);
                    const inputRate = rateOverride || item.basic_rate || item.rider_rate || item.rate;
                    
                    if (item.term_or_months) {
                        const match = item.term_or_months.toString().match(/\d+/);
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

                    if ([2, 3].includes(planId)) {
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
                    if (!Array.isArray(ageItems)) continue;

                    if (ageKey === 'basic_plan') {
                        for (const item of ageItems) {
                            // 1. Save the basic rate for this month
                            await saveRow(item, null, basicPlanName, bracketBasicPlanId);

                            // 2. Save nested riders for this specific month (GCLI Nested Format)
                            if (planId === 1 && item.riders && Array.isArray(item.riders)) {
                                for (const rider of item.riders) {
                                    await saveRow({
                                        ...rider,
                                        term_or_months: item.term_or_months
                                    }, null, basicPlanName, bracketBasicPlanId);
                        }
                            }
                        }
                        continue;
                    }

                    const isBand = ageKey.includes('_to_') || ageKey.split('_').length > 2;
                    const numericAgeMatch = ageKey.match(/\d+/g);
                    const numericAge = !isBand && numericAgeMatch ? parseInt(numericAgeMatch[0], 10) : null;
                    const bandLabel = isBand ? ageKey.replace('age_', '').replace('_', '-') : null;

                    if (Array.isArray(ageItems)) {
                        for (const item of ageItems) await saveRow(item, numericAge, bandLabel);
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
    
    const appRes = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query('SELECT plan_id FROM DHUB.sg.financial_insurance_application WHERE application_id = @application_id');
    
    const planId = appRes.recordset[0]?.plan_id;
    if (!planId) return [];

    let query = '';
    if (planId === 2 || planId === 3) {
        const targetTable = planId === 2 ? 'DHUB.sg.financial_insurance_actuarial_rates_gyrt' : 'DHUB.sg.financial_insurance_actuarial_rates_gpa';
        // Query for product specific table
        query = `SELECT r.*, rider.rider_name, rider.acronym, bp.basic_plan_name
                 FROM ${targetTable} r
                 LEFT JOIN DHUB.sg.financial_insurance_riders rider ON r.rider_id = rider.rider_id
                 LEFT JOIN DHUB.sg.financial_insurance_basic_plan bp ON r.basic_plan_id = bp.basic_plan_id
                 WHERE r.application_id = @application_id`;
    } else {
        // Standard rates table
        const targetTable = planId === 1 
            ? 'DHUB.sg.financial_insurance_actuarial_rates_gcli' 
            : 'DHUB.sg.financial_insurance_application_rates';
        query = `SELECT r.*, rider.rider_name, rider.acronym
                 FROM ${targetTable} r
                 LEFT JOIN DHUB.sg.financial_insurance_riders rider ON r.rider_id = rider.rider_id
                 WHERE r.application_id = @application_id`;
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
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB.sg.financial_insurance_month_lookups ml ON fia.sub_payment_term_id = ml.month_id
            WHERE fia.status_id IN (1, 5)
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
            WHERE fia.status_id IN (1, 5) AND fia.total_annual_premium IS NULL
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};