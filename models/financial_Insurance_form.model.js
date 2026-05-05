import { poolPromise, sql } from '../config/db.js';

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
            INSERT INTO DHUB.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
            VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
        `);
};

export const createApplication = async (data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const paymentTerm = (data.payment && Array.isArray(data.payment) && data.payment.length > 0) ? data.payment[0] : null;


        const appRequest = new sql.Request(transaction);
        const appResult = await appRequest
            .input('user_id', sql.Int, userId)
            .input('group_name', sql.NVarChar, data.group_name)
            .input('business_nature', sql.NVarChar, data.business_nature || null)
            .input('business_nature_id', sql.Int, data.business_nature_id || null)
            .input('sub_business_nature_id', sql.Int, data.sub_business_nature_id ? Number(data.sub_business_nature_id) : null)
            .input('number_of_lives', sql.Int, data.number_of_lives)
            .input('business_address', sql.NVarChar, data.business_address)
            .input('contact_number', sql.NVarChar, data.contact_number)
            .input('fax_number', sql.NVarChar, data.fax_number || null)
            .input('email', sql.NVarChar, data.email)
            .input('contact_person_salutation', sql.NVarChar, data.contact_person_salutation)
            .input('contact_person_firstname', sql.NVarChar, data.contact_person_firstname)
            .input('contact_person_mi', sql.NVarChar, data.contact_person_mi || null)
            .input('contact_person_lastname', sql.NVarChar, data.contact_person_lastname)
            .input('designation', sql.NVarChar, data.designation)
            .input('proposal_addressee', sql.NVarChar, data.proposal_addressee)
            .input('addressee_designation', sql.NVarChar, data.addressee_designation)
            .input('group_classification_id', sql.Int, data.group_classification_id)
            .input('other_group_classification', sql.NVarChar, data.other_group_classification || null)
            .input('business_type_id', sql.Int, data.business_type_id)
            .input('other_business_type', sql.NVarChar, data.other_business_type || null)
            .input('group_type_id', sql.Int, data.group_type_id)
            .input('other_group_type', sql.NVarChar, data.other_group_type || null)
            .input('minimum_age', sql.Int, data.minimum_age)
            .input('maximum_age', sql.Int, data.maximum_age)
            .input('payment_mode_id', sql.Int, data.payment_mode_id)
            .input('plan_id', sql.Int, data.plan_id || null)
            .input('basic_plan_id', sql.Int, data.basic_plan_id || null)
            .input('type_of_proposal_id', sql.Int, data.type_of_proposal_id)
            .input('prototype_id', sql.Int, data.prototype_id || null)
            .input('status_id', sql.Int, data.status_id || 1)
            .input('amount_loans_id', sql.Int, data.amount_loans_id || null)
            .input('loans_amount', sql.Decimal(18, 2), data.loans_amount || null)
            .input('coverage_type_id', sql.Int, data.coverage_type_id || null)
            .input('payment_term_id', sql.Int, paymentTerm ? paymentTerm.payment_term_id : null)
            .input('sub_payment_term_id', sql.Int, paymentTerm ? paymentTerm.sub_payment_term_id : null)
            .input('borrower_age_66_70', sql.Bit, data.borrower_age_66_70 || false)
            .input('borrower_age_71_75', sql.Bit, data.borrower_age_71_75 || false)
            .input('borrower_age_76_80', sql.Bit, data.borrower_age_76_80 || false)
            .input('channel_type_id', sql.Int, data.channel_type_id || null)
            .input('channel_name', sql.NVarChar, data.channel_name || null)
            .input('commission_rate', sql.NVarChar, data.commission_rate || null)
            .input('service_fee', sql.NVarChar, data.service_fee || null)
            .input('total_annual_premium', sql.Decimal(18, 2), data.total_annual_premium || null)
            .input('max_amount_18_64', sql.Decimal(18, 2), data.max_amount_18_64 || null)
            .input('max_amount_66_70', sql.Decimal(18, 2), data.max_amount_66_70 || null)
            .input('max_amount_71_75', sql.Decimal(18, 2), data.max_amount_71_75 || null)
            .input('max_amount_76_80', sql.Decimal(18, 2), data.max_amount_76_80 || null)
            .input('notes', sql.NVarChar(sql.MAX), data.notes || null)
            .input('excel_file_path', sql.NVarChar(sql.MAX), data.excel_file_path || null)
            .query(`
                INSERT INTO DHUB.sg.financial_insurance_application (
                    user_id, group_name, business_nature, business_nature_id, sub_business_nature_id, number_of_lives, business_address, contact_number, fax_number, email,
                    contact_person_salutation, contact_person_firstname, contact_person_mi, contact_person_lastname, designation, proposal_addressee, addressee_designation, group_classification_id,
                    other_group_classification, business_type_id, other_business_type, group_type_id, other_group_type,
                    minimum_age, maximum_age, payment_mode_id, plan_id, basic_plan_id, type_of_proposal_id, prototype_id, status_id,
                    amount_loans_id, loans_amount, coverage_type_id, payment_term_id, sub_payment_term_id, excel_file_path,
                    borrower_age_66_70, borrower_age_71_75, borrower_age_76_80, channel_type_id, channel_name, commission_rate, service_fee, total_annual_premium, max_amount_18_64, max_amount_66_70, max_amount_71_75, max_amount_76_80, notes
                ) VALUES (
                    @user_id, @group_name, @business_nature, @business_nature_id, @sub_business_nature_id, @number_of_lives, @business_address, @contact_number, @fax_number, @email,
                    @contact_person_salutation, @contact_person_firstname, @contact_person_mi, @contact_person_lastname, @designation, @proposal_addressee, @addressee_designation, @group_classification_id,
                    @other_group_classification, @business_type_id, @other_business_type, @group_type_id, @other_group_type,
                    @minimum_age, @maximum_age, @payment_mode_id, @plan_id, @basic_plan_id, @type_of_proposal_id, @prototype_id, @status_id,
                    @amount_loans_id, @loans_amount, @coverage_type_id, @payment_term_id, @sub_payment_term_id, @excel_file_path,
                    @borrower_age_66_70, @borrower_age_71_75, @borrower_age_76_80, @channel_type_id, @channel_name, @commission_rate, @service_fee, @total_annual_premium, @max_amount_18_64, @max_amount_66_70, @max_amount_71_75, @max_amount_76_80, @notes
                );
                SELECT SCOPE_IDENTITY() AS application_id;
            `);

        const applicationId = appResult.recordset[0].application_id;

        // Log the creation action
        await logApplicationAction(transaction, {
            applicationId,
            userId,
            actionType: 'CREATE',
            changes: data,
            ipAddress: data.ip_address
        });

        // Insert sub_group_type_ids into the new table
        if (data.sub_group_type_id) {
            const subGroupIds = Array.isArray(data.sub_group_type_id) ? data.sub_group_type_id : [data.sub_group_type_id];
            if (subGroupIds.length > 0) {
                for (const subGroupId of subGroupIds) {
                    const subGroupRequest = new sql.Request(transaction);
                    await subGroupRequest
                        .input('application_id', sql.Int, applicationId)
                        .input('sub_group_type_id', sql.Int, subGroupId)
                        .query(`
                            INSERT INTO DHUB.sg.financial_insurance_application_subgroup (application_id, sub_group_type_id)
                            VALUES (@application_id, @sub_group_type_id);
                        `);
                }
            }
        }

        // Insert coverage ranking details if applicable
        const coverageTypeId = data.coverage_type_id;
        const levelRanking = data.level_ranking;
        const salaryRanking = data.salary_ranking;
        const uniformAmount = data.uniform_coverage_amount;

        // Helper to insert ranking-specific riders (scoped to transaction)
        const insertRankingRiders = async (rankingId, designation, riders) => {
            if (riders && Array.isArray(riders) && riders.length > 0) {
                for (const rider of riders) {
                    const riderValue = rider.values && Array.isArray(rider.values) 
                        ? rider.values.find(v => v.designation === designation) 
                        : null;

                    // Fallback: If no specific value found (e.g. during partial update), use the base values
                    const finalValue = riderValue || (rider.amount !== undefined || rider.unit !== undefined ? { amount: rider.amount, unit: rider.unit } : null);

                    if (finalValue) {
                        await new sql.Request(transaction)
                            .input('coverage_ranking_id', sql.Int, rankingId)
                            .input('rider_id', sql.Int, rider.rider_id)
                            .input('rider_amount', sql.Decimal(18, 2), finalValue.amount || null)
                            .input('rider_unit', sql.Int, finalValue.unit || null)
                            .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking_rider (coverage_ranking_id, rider_id, rider_amount, rider_unit) VALUES (@coverage_ranking_id, @rider_id, @rider_amount, @rider_unit);`);
                    }
                }
            }
        };

        if (coverageTypeId === 32 && levelRanking && levelRanking.length > 0) { 
            for (const rank of levelRanking) {
                const rankRequest = new sql.Request(transaction);
                const rankResult = await rankRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('designation', sql.NVarChar, rank.designation)
                    .input('amount', sql.Decimal(18, 2), rank.amount)
                    .input('total_coverage_amount', sql.Decimal(18, 2), rank.amount) 
                    .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                
                const rankingId = rankResult.recordset[0].id;
                await insertRankingRiders(rankingId, rank.designation, data.riders);
            }
        } else if (coverageTypeId === 34 && salaryRanking && salaryRanking.length > 0) { 
            for (const rank of salaryRanking) {
                const multiplier = parseInt(rank.salary_multiplier.replace(/x/i, ''), 10) || 1;
                const totalAmount = parseFloat(rank.amount) * multiplier;

                const rankRequest = new sql.Request(transaction);
                const rankResult = await rankRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('designation', sql.NVarChar, rank.designation)
                    .input('amount', sql.Decimal(18, 2), rank.amount)
                    .input('salary_multiplier', sql.NVarChar, rank.salary_multiplier)
                    .input('total_coverage_amount', sql.Decimal(18, 2), totalAmount)
                    .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, salary_multiplier, total_coverage_amount) VALUES (@application_id, @designation, @amount, @salary_multiplier, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                
                const rankingId = rankResult.recordset[0].id;
                await insertRankingRiders(rankingId, rank.designation, data.riders);
            }
        } else if (coverageTypeId === 33 && uniformAmount != null) {
            const rankRequest = new sql.Request(transaction);
            await rankRequest
                .input('application_id', sql.Int, applicationId)
                .input('designation', sql.NVarChar, 'All Rank')
                .input('amount', sql.Decimal(18, 2), uniformAmount)
                .input('uniform_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                .input('total_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, uniform_coverage_amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @uniform_coverage_amount, @total_coverage_amount);`);
        }

        if (data.riders && Array.isArray(data.riders) && data.riders.length > 0) {
            for (const rider of data.riders) {
                const riderRequest = new sql.Request(transaction);
                await riderRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('rider_id', sql.Int, rider.rider_id)
                    .input('rider_amount', sql.Decimal(18, 2), rider.amount || null)
                    .input('rider_unit', sql.Int, rider.unit || null)
                    .query(`
                        INSERT INTO DHUB.sg.financial_insurance_application_rider
                        (application_id, rider_id, rider_amount, rider_unit)
                        VALUES (@application_id, @rider_id, @rider_amount, @rider_unit);
                    `);
            }
        }

        await transaction.commit();
        return { application_id: applicationId };
    } catch (err) {
        await transaction.rollback();
        throw err; 
    }
};

// Get coverage rankings for multiple applications in bulk
export const getBulkCoverageRankings = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT application_id, designation, amount, salary_multiplier, uniform_coverage_amount, total_coverage_amount
        FROM DHUB.sg.financial_insurance_coverage_ranking
        WHERE application_id IN (${idParams})`);
    return result.recordset ?? [];
};

// Get nested riders for coverage rankings in bulk
export const getBulkCoverageRankingRiders = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT 
            cr.application_id,
            crr.rider_id,
            cr.designation,
            crr.rider_amount,
            crr.rider_unit
        FROM DHUB.sg.financial_insurance_coverage_ranking_rider crr
        JOIN DHUB.sg.financial_insurance_coverage_ranking cr ON crr.coverage_ranking_id = cr.ranking_id
        WHERE cr.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Get all applications
export const getAllApplications = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT
                fia.application_id,
                fia.user_id,
                fia.group_name,
                fia.business_nature,
                fia.business_nature_id,
                fia.sub_business_nature_id,
                fia.number_of_lives,
                fia.business_address,
                fia.contact_number,
                fia.fax_number,
                fia.email,
                fia.contact_person_salutation,
                fia.contact_person_firstname,
                fia.contact_person_mi,
                fia.contact_person_lastname,
                fia.designation,
                fia.proposal_addressee,
                fia.addressee_designation,
                fia.minimum_age,
                fia.maximum_age,
                fia.payment_mode_id,
                fia.status_id,
                fia.group_classification_id,
                fia.other_group_classification,
                fia.business_type_id,
                fia.other_business_type,
                fia.group_type_id,
                fia.other_group_type,
                fia.plan_id,
                fia.basic_plan_id,
                fia.prototype_id,
                fia.type_of_proposal_id,
                fia.amount_loans_id,
                fia.loans_amount,
                fia.coverage_type_id,
                fia.borrower_age_66_70,
                fia.borrower_age_71_75,
                fia.borrower_age_76_80,
                fia.channel_type_id,
                fia.channel_name,
                fia.commission_rate,
                fia.service_fee,
                fia.total_annual_premium,
                fia.max_amount_18_64,
                fia.max_amount_66_70,
                fia.max_amount_71_75,
                fia.max_amount_76_80,
                fia.notes,
                fia.created_at,
                fia.updated_at,
                fis.status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                pm.name AS payment_mode_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                p.acronym AS plan_acronym,
                bp.basic_plan_name,
                pp.name AS prototype_plan_name,
                pp.acronym AS prototype_plan_acronym,
                ind.name AS business_nature_name,
                subind.name AS sub_business_nature_name,
                al.name AS amount_loans_name,
                ct.name AS coverage_type_name,
                chant.name AS channel_type_name,
                u.firstname AS creator_firstname,
                u.middlename AS creator_middlename,
                u.lastname AS creator_lastname,
                u.suffix AS creator_suffix
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_status fis
                ON fia.status_id = fis.status_id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gc
                ON fia.group_classification_id = gc.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups bt
                ON fia.business_type_id = bt.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gt
                ON fia.group_type_id = gt.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups pm
                ON fia.payment_mode_id = pm.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups topl
                ON fia.type_of_proposal_id = topl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p
                ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_basic_plan bp
                ON fia.basic_plan_id = bp.basic_plan_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp
                ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups al
                ON fia.amount_loans_id = al.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups ct
                ON fia.coverage_type_id = ct.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups chant
                ON fia.channel_type_id = chant.id
            LEFT JOIN DHUB.sg.financial_insurance_industries ind
                ON fia.business_nature_id = ind.id
            LEFT JOIN DHUB.sg.financial_insurance_industries subind
                ON fia.sub_business_nature_id = subind.id
            LEFT JOIN DHUB.sg.financial_insurance_users u
                ON fia.user_id = u.user_id
            ORDER BY fia.created_at DESC;
        `);

    return res.recordset ?? [];
};

// Get prototypes (type 30)
export const getPrototypes = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT
                fia.application_id, fia.user_id, fia.group_name, fia.number_of_lives,
                fia.contact_person_salutation, fia.contact_person_firstname, fia.contact_person_mi, fia.contact_person_lastname,
                fia.status_id, fia.group_classification_id, fia.other_group_classification,
                fia.business_type_id, fia.other_business_type, fia.group_type_id, fia.other_group_type,
                fia.plan_id, fia.basic_plan_id, fia.prototype_id,
                fia.type_of_proposal_id,
                fia.amount_loans_id,
                fia.loans_amount,
                fia.coverage_type_id,
                fia.borrower_age_66_70,
                fia.borrower_age_71_75,
                fia.borrower_age_76_80,
                fia.channel_type_id,
                fia.channel_name,
                fia.commission_rate,
                fia.service_fee,
                fia.total_annual_premium,
                fia.max_amount_18_64,
                fia.max_amount_66_70,
                fia.max_amount_71_75,
                fia.max_amount_76_80,
                fia.notes,
                fia.created_at, fia.updated_at,
                fis.status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                p.acronym AS plan_acronym,
                bp.basic_plan_name,
                pp.name as prototype_plan_name,
                pp.acronym AS prototype_plan_acronym,
                al.name AS amount_loans_name,
                ct.name AS coverage_type_name,
                chant.name AS channel_type_name,
                u.firstname AS creator_firstname,
                u.middlename AS creator_middlename,
                u.lastname AS creator_lastname,
                u.suffix AS creator_suffix
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN sg.financial_insurance_status fis ON fia.status_id = fis.status_id
            LEFT JOIN sg.financial_insurance_group_lookups gc ON fia.group_classification_id = gc.id
            LEFT JOIN sg.financial_insurance_group_lookups bt ON fia.business_type_id = bt.id
            LEFT JOIN sg.financial_insurance_group_lookups gt ON fia.group_type_id = gt.id
            LEFT JOIN sg.financial_insurance_group_lookups topl ON fia.type_of_proposal_id = topl.id
            LEFT JOIN sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN sg.financial_insurance_basic_plan bp ON fia.basic_plan_id = bp.basic_plan_id
            LEFT JOIN sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups al ON fia.amount_loans_id = al.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups ct ON fia.coverage_type_id = ct.id
            LEFT JOIN DHUB.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups chant
                ON fia.channel_type_id = chant.id
            WHERE fia.type_of_proposal_id = 30
            ORDER BY fia.created_at DESC
        `);

    return res.recordset ?? [];
};

// Get application by ID
export const getApplicationById = async (id) => {
    const pool = await poolPromise;

    const res = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT 
                fia.*,
                fis.status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                pm.name AS payment_mode_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                p.acronym AS plan_acronym,
                bp.basic_plan_name,
                pp.name as prototype_plan_name,
                pp.acronym AS prototype_plan_acronym,
                ind.name AS business_nature_name,
                subind.name AS sub_business_nature_name,
                al.name as amount_loans_name,
                ct.name AS coverage_type_name,
                chant.name AS channel_type_name,
                u.firstname AS creator_firstname,
                u.middlename AS creator_middlename,
                u.lastname AS creator_lastname,
                u.suffix AS creator_suffix
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_status fis
                ON fia.status_id = fis.status_id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gc
                ON fia.group_classification_id = gc.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups bt
                ON fia.business_type_id = bt.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gt
                ON fia.group_type_id = gt.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups pm
                ON fia.payment_mode_id = pm.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups topl
                ON fia.type_of_proposal_id = topl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p
                ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_basic_plan bp
                ON fia.basic_plan_id = bp.basic_plan_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp
                ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups al
                ON fia.amount_loans_id = al.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups ct
                ON fia.coverage_type_id = ct.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups chant
                ON fia.channel_type_id = chant.id
            LEFT JOIN DHUB.sg.financial_insurance_industries ind
                ON fia.business_nature_id = ind.id
            LEFT JOIN DHUB.sg.financial_insurance_industries subind
                ON fia.sub_business_nature_id = subind.id
            LEFT JOIN DHUB.sg.financial_insurance_users u
                ON fia.user_id = u.user_id
            WHERE fia.application_id = @id
        `);

    return res.recordset?.[0] ?? null;
};

// Update application - handles partial updates
export const updateApplication = async (id, data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Helper to insert ranking-specific riders (scoped to transaction)
        const insertRankingRiders = async (rankingId, designation, riders) => {
            if (riders && Array.isArray(riders) && riders.length > 0) {
                for (const rider of riders) {
                    let riderValue = rider.values && Array.isArray(rider.values) 
                        ? rider.values.find(v => v.designation === designation) 
                        : null;

                    // Fallback: Check for generic value in values[0] (if single item & no designation) or root-level amount
                    const finalValue = riderValue 
                        || (rider.values && rider.values.length === 1 && !rider.values[0].designation ? rider.values[0] : null)
                        || (rider.amount !== undefined || rider.unit !== undefined ? { amount: rider.amount, unit: rider.unit } : null);

                    if (finalValue) {
                        await new sql.Request(transaction)
                            .input('coverage_ranking_id', sql.Int, rankingId)
                            .input('rider_id', sql.Int, rider.rider_id)
                            .input('rider_amount', sql.Decimal(18, 2), finalValue.amount || null)
                            .input('rider_unit', sql.Int, finalValue.unit || null)
                            .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking_rider (coverage_ranking_id, rider_id, rider_amount, rider_unit) VALUES (@coverage_ranking_id, @rider_id, @rider_amount, @rider_unit);`);
                    }
                }
            }
        };

        // Handle sub_group_type_id update
        if (data.sub_group_type_id !== undefined) {
            const deleteSubGroupsRequest = new sql.Request(transaction);
            await deleteSubGroupsRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB.sg.financial_insurance_application_subgroup WHERE application_id = @application_id');
            
            if (data.sub_group_type_id) {
                const subGroupIds = Array.isArray(data.sub_group_type_id) ? data.sub_group_type_id : [data.sub_group_type_id];
                if (subGroupIds.length > 0) {
                    for (const subGroupId of subGroupIds) {
                        const insertSubGroupRequest = new sql.Request(transaction);
                        await insertSubGroupRequest
                            .input('application_id', sql.Int, id)
                            .input('sub_group_type_id', sql.Int, subGroupId)
                            .query('INSERT INTO DHUB.sg.financial_insurance_application_subgroup (application_id, sub_group_type_id) VALUES (@application_id, @sub_group_type_id);');
                    }
                }
            }
        }

        // --- Handle Coverage, Ranking, and Rider Updates ---
        const isRankingStructureUpdate = (data.level_ranking !== undefined || data.salary_ranking !== undefined || data.coverage_type_id !== undefined || data.uniform_coverage_amount !== undefined);
        const areRidersUpdated = data.riders !== undefined;

        if (isRankingStructureUpdate) {
            const deleteRankingsRequest = new sql.Request(transaction);
            await deleteRankingsRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB.sg.financial_insurance_coverage_ranking WHERE application_id = @application_id');

            let coverageTypeId = data.coverage_type_id;
            
            if (coverageTypeId === undefined) {
                const currentApp = await new sql.Request(transaction)
                    .input('id', sql.Int, id)
                    .query('SELECT coverage_type_id FROM DHUB.sg.financial_insurance_application WHERE application_id = @id');
                coverageTypeId = currentApp.recordset[0]?.coverage_type_id;
            }

            const levelRanking = data.level_ranking;
            const salaryRanking = data.salary_ranking;
            const uniformAmount = data.uniform_coverage_amount;

            if (coverageTypeId === 32 && levelRanking && levelRanking.length > 0) {
                for (const rank of levelRanking) {
                    const rankRequest = new sql.Request(transaction);
                    const rankResult = await rankRequest
                        .input('application_id', sql.Int, id)
                        .input('designation', sql.NVarChar, rank.designation)
                        .input('amount', sql.Decimal(18, 2), rank.amount)
                        .input('total_coverage_amount', sql.Decimal(18, 2), rank.amount)
                        .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                    const rankingId = rankResult.recordset[0].id;
                    // Use new riders if provided, otherwise this will use undefined which is handled by insertRankingRiders
                    await insertRankingRiders(rankingId, rank.designation, data.riders); 
                }
            } else if (coverageTypeId === 34 && salaryRanking && salaryRanking.length > 0) { 
                for (const rank of salaryRanking) {
                    const multiplier = parseInt(rank.salary_multiplier.replace(/x/i, ''), 10) || 1;
                    const totalAmount = parseFloat(rank.amount) * multiplier;

                    const rankRequest = new sql.Request(transaction);
                    const rankResult = await rankRequest
                        .input('application_id', sql.Int, id)
                        .input('designation', sql.NVarChar, rank.designation)
                        .input('amount', sql.Decimal(18, 2), rank.amount)
                        .input('salary_multiplier', sql.NVarChar, rank.salary_multiplier)
                        .input('total_coverage_amount', sql.Decimal(18, 2), totalAmount)
                        .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, salary_multiplier, total_coverage_amount) VALUES (@application_id, @designation, @amount, @salary_multiplier, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                    const rankingId = rankResult.recordset[0].id;
                    await insertRankingRiders(rankingId, rank.designation, data.riders);
                }
            } else if (coverageTypeId === 33 && uniformAmount != null) {
                const rankRequest = new sql.Request(transaction);
                await rankRequest
                    .input('application_id', sql.Int, id)
                    .input('designation', sql.NVarChar, 'All Rank')
                    .input('amount', sql.Decimal(18, 2), uniformAmount)
                    .input('uniform_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                    .input('total_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                    .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, uniform_coverage_amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @uniform_coverage_amount, @total_coverage_amount);`);
            }
        } else if (areRidersUpdated) {
            // This block handles the case where ONLY riders are updated, but the ranking structure is not.
            // We need to update the nested riders for the existing ranks.
            let currentCoverageTypeId;
            const typeRes = await new sql.Request(transaction)
                .input('appId', sql.Int, id)
                .query('SELECT coverage_type_id FROM DHUB.sg.financial_insurance_application WHERE application_id = @appId');
            currentCoverageTypeId = typeRes.recordset[0]?.coverage_type_id;

            if (currentCoverageTypeId === 32 || currentCoverageTypeId === 34) {
                const existingRankingsRes = await new sql.Request(transaction)
                    .input('appId', sql.Int, id)
                    .query('SELECT ranking_id, designation FROM DHUB.sg.financial_insurance_coverage_ranking WHERE application_id = @appId');
                
                const existingRankings = existingRankingsRes.recordset || [];

                if (existingRankings.length > 0) {
                    // Delete existing ranking riders and re-insert new ones based on the updated rider list
                    await new sql.Request(transaction).input('appId', sql.Int, id).query(`DELETE crr FROM DHUB.sg.financial_insurance_coverage_ranking_rider crr JOIN DHUB.sg.financial_insurance_coverage_ranking cr ON crr.coverage_ranking_id = cr.ranking_id WHERE cr.application_id = @appId`);

                    for (const rank of existingRankings) {
                        await insertRankingRiders(rank.ranking_id, rank.designation, data.riders);
                    }
                }
            }
        }

        // Always update the main rider table if riders are provided
        if (areRidersUpdated) {
            const deleteRidersRequest = new sql.Request(transaction);
            await deleteRidersRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB.sg.financial_insurance_application_rider WHERE application_id = @application_id');

            if (Array.isArray(data.riders) && data.riders.length > 0) {
                for (const rider of data.riders) {
                    const insertRiderRequest = new sql.Request(transaction);
                    await insertRiderRequest
                        .input('application_id', sql.Int, id)
                        .input('rider_id', sql.Int, rider.rider_id)
                        .input('rider_amount', sql.Decimal(18, 2), rider.amount || null)
                        .input('rider_unit', sql.Int, rider.unit || null)
                        .query(`
                            INSERT INTO DHUB.sg.financial_insurance_application_rider
                            (application_id, rider_id, rider_amount, rider_unit)
                            VALUES (@application_id, @rider_id, @rider_amount, @rider_unit);
                        `);
                }
            }
        }

        const setClauses = [];
        const inputs = [];

        const addClause = (field, value, type = sql.NVarChar) => {
            if (value !== undefined) {
                setClauses.push(`${field} = @${field}`);
                inputs.push({ name: field, value: value, type: type });
            }
        };

        addClause('group_name', data.group_name);
        addClause('business_nature', data.business_nature);
        addClause('business_nature_id', data.business_nature_id, sql.Int);
        addClause('sub_business_nature_id', data.sub_business_nature_id, sql.Int);
        addClause('number_of_lives', data.number_of_lives, sql.Int);
        addClause('business_address', data.business_address);
        addClause('contact_number', data.contact_number);
        addClause('fax_number', data.fax_number);
        addClause('email', data.email);
        addClause('contact_person_salutation', data.contact_person_salutation);
        addClause('contact_person_firstname', data.contact_person_firstname);
        addClause('contact_person_mi', data.contact_person_mi);
        addClause('contact_person_lastname', data.contact_person_lastname);
        addClause('designation', data.designation);
        addClause('proposal_addressee', data.proposal_addressee);
        addClause('addressee_designation', data.addressee_designation);
        addClause('group_classification_id', data.group_classification_id, sql.Int);
        addClause('other_group_classification', data.other_group_classification);
        addClause('business_type_id', data.business_type_id, sql.Int);
        addClause('other_business_type', data.other_business_type);
        addClause('group_type_id', data.group_type_id, sql.Int);
        addClause('other_group_type', data.other_group_type);
        addClause('minimum_age', data.minimum_age, sql.Int);
        addClause('maximum_age', data.maximum_age, sql.Int);
        addClause('payment_mode_id', data.payment_mode_id, sql.Int);
        addClause('type_of_proposal_id', data.type_of_proposal_id, sql.Int);
        addClause('prototype_id', data.prototype_id, sql.Int);
        addClause('plan_id', data.plan_id, sql.Int);
        addClause('basic_plan_id', data.basic_plan_id, sql.Int);
        addClause('status_id', data.status_id, sql.Int);

        // New product-specific fields
        addClause('amount_loans_id', data.amount_loans_id, sql.Int);
        addClause('loans_amount', data.loans_amount, sql.Decimal(18, 2));
        addClause('coverage_type_id', data.coverage_type_id, sql.Int);

        // Borrower age selections
        addClause('borrower_age_66_70', data.borrower_age_66_70, sql.Bit);
        addClause('borrower_age_71_75', data.borrower_age_71_75, sql.Bit);
        addClause('borrower_age_76_80', data.borrower_age_76_80, sql.Bit);
        addClause('notes', data.notes, sql.NVarChar(sql.MAX));

        // Channel fields
        addClause('channel_type_id', data.channel_type_id, sql.Int);
        addClause('channel_name', data.channel_name);

        // New fields
        addClause('commission_rate', data.commission_rate);
        addClause('service_fee', data.service_fee);
        addClause('total_annual_premium', data.total_annual_premium, sql.Decimal(18, 2));
        addClause('max_amount_18_64', data.max_amount_18_64, sql.Decimal(18, 2));
        addClause('max_amount_66_70', data.max_amount_66_70, sql.Decimal(18, 2));
        addClause('max_amount_71_75', data.max_amount_71_75, sql.Decimal(18, 2));
        addClause('max_amount_76_80', data.max_amount_76_80, sql.Decimal(18, 2));

        // Add excel_file_path to update clause
        addClause('excel_file_path', data.excel_file_path, sql.NVarChar(sql.MAX));
        if (data.payment !== undefined) {
            const paymentTerm = (Array.isArray(data.payment) && data.payment.length > 0) ? data.payment[0] : null;
            addClause('payment_term_id', paymentTerm ? paymentTerm.payment_term_id : null, sql.Int);
            addClause('sub_payment_term_id', paymentTerm ? paymentTerm.sub_payment_term_id : null, sql.Int);
        }

        if (setClauses.length > 0) {
            setClauses.push('updated_at = GETDATE()');
            const request = new sql.Request(transaction);
            request.input('id', sql.Int, id);
            for (const input of inputs) {
                request.input(input.name, input.type, input.value);
            }
            const query = `UPDATE DHUB.sg.financial_insurance_application SET ${setClauses.join(', ')} WHERE application_id = @id`;
            await request.query(query);
        }

        // Log the update action
        await logApplicationAction(transaction, {
            applicationId: id,
            userId,
            actionType: 'UPDATE',
            changes: data,
            ipAddress: data.ip_address
        });

        await transaction.commit();
        return getApplicationById(id);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Delete application
export const deleteApplication = async (id) => {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.Int, id)
        .query(`
            DELETE FROM sg.financial_insurance_application
            WHERE application_id = @id
        `);
    return { deleted: true };
};

// Lookup list by category
export const getLookupListByCategory = async (category) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('category', sql.NVarChar, category)
        .query(`
            SELECT id, name, parent_id
            FROM sg.financial_insurance_group_lookups
            WHERE category=@category AND is_active=1
        `);
    return res.recordset ?? [];
};

// Industry/Business Nature list
export const getIndustries = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT id, category, name, parent_id
            FROM sg.financial_insurance_industries
            WHERE is_active = 1
        `);
    return res.recordset ?? [];
};

// Get all top-level plans
export const getAllPlans = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT product_id AS plan_id, product_name AS plan_name, acronym, is_active
            FROM sg.financial_insurance_product
            WHERE is_active = 1
        `);
    return res.recordset ?? [];
};

// Get list of prototype plans (definitions)
export const getPrototypePlans = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT id, name, acronym FROM sg.financial_insurance_prototype_plans WHERE is_active = 1
        `);
    return res.recordset ?? [];
};

// Get basic plans for a specific top-level plan
export const getBasicPlansByPlanId = async (planId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('planId', sql.Int, planId)
        .query(`
            SELECT basic_plan_id, basic_plan_name, acronym, is_active
            FROM sg.financial_insurance_basic_plan
            WHERE product_id = @planId AND is_active = 1
        `);
    return res.recordset ?? [];
};

// Get attachable riders for a specific product (plan)
export const getRidersByProductId = async (productId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('productId', sql.Int, productId)
        .query(`
            SELECT rider_id, rider_name, is_active
            FROM sg.financial_insurance_riders
            WHERE product_id = @productId AND is_active = 1
        `);
    return res.recordset ?? [];
};

// Get lookup names by a list of IDs
export const getLookupNamesByIds = async (ids) => {
    if (!ids || ids.length === 0) return new Map();

    const pool = await poolPromise;
    const request = pool.request();
    const parameters = [];

    const uniqueIds = [...new Set(ids.filter(id => id != null))];

    if (uniqueIds.length === 0) return new Map();

    uniqueIds.forEach((id, index) => {
        const paramName = `id${index}`;
        request.input(paramName, sql.Int, id);
        parameters.push(`@${paramName}`);
    });

    const result = await request.query(`
        SELECT id, name FROM sg.financial_insurance_group_lookups 
        WHERE id IN (${parameters.join(',')})
    `);

    const namesMap = new Map();
    result.recordset.forEach(row => {
        namesMap.set(row.id, row.name);
    });
    return namesMap;
};

// Get lookups by a list of IDs
export const getLookupsByIds = async (ids) => {
    if (!ids || ids.length === 0) return new Map();
    const pool = await poolPromise;
    const subGroupRes = await pool.request()
        .query(`SELECT id, name FROM sg.financial_insurance_group_lookups WHERE id IN (${ids.join(',')})`);
    const lookupsMap = new Map();
    subGroupRes.recordset.forEach(sg => lookupsMap.set(sg.id, sg.name));
    return lookupsMap;
};

// Get riders for a single application
export const getApplicationRiders = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                r.rider_id,
                r.rider_name,
                r.input_type,
                r.unit_value,
                ar.rider_amount as amount,
                ar.rider_unit as unit
            FROM sg.financial_insurance_application_rider ar
            JOIN sg.financial_insurance_riders r ON ar.rider_id = r.rider_id
            WHERE ar.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get application history logs
export const getApplicationHistory = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                l.log_id, l.application_id, l.user_id, l.action_type, l.changes, l.ip_address, l.created_at,
                u.firstname, u.lastname, u.email
            FROM DHUB.sg.financial_insurance_application_history_logs l
            LEFT JOIN DHUB.sg.financial_insurance_users u ON l.user_id = u.user_id
            WHERE l.application_id = @application_id
            ORDER BY l.created_at DESC
        `);
    return result.recordset ?? [];
};

// Get sub_group_types for a single application
export const getApplicationSubGroups = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT l.id, l.name FROM DHUB.sg.financial_insurance_application_subgroup s
            JOIN DHUB.sg.financial_insurance_group_lookups l ON s.sub_group_type_id = l.id
            WHERE s.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get payment terms for a single application
export const getApplicationPaymentTerms = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                pt.id as payment_term_id, 
                pt.name as payment_term_name,
                spt.id as sub_payment_term_id,
                spt.name as sub_payment_term_name
            FROM DHUB.sg.financial_insurance_application p
            JOIN DHUB.sg.financial_insurance_group_lookups pt ON p.payment_term_id = pt.id
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups spt ON p.sub_payment_term_id = spt.id
            WHERE p.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get coverage rankings for a single application
export const getCoverageRankingsByAppId = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT designation, amount, salary_multiplier, uniform_coverage_amount, total_coverage_amount
            FROM DHUB.sg.financial_insurance_coverage_ranking
            WHERE application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get nested riders for coverage rankings
export const getCoverageRankingRiders = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                cr.ranking_id,
                cr.designation,
                crr.rider_id,
                r.rider_name,
                crr.rider_amount,
                crr.rider_unit
            FROM DHUB.sg.financial_insurance_coverage_ranking_rider crr
            JOIN DHUB.sg.financial_insurance_coverage_ranking cr ON crr.coverage_ranking_id = cr.ranking_id
            JOIN DHUB.sg.financial_insurance_riders r ON crr.rider_id = r.rider_id
            WHERE cr.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get sub_group_types for multiple applications
export const getBulkApplicationSubGroups = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT s.application_id, l.id, l.name FROM DHUB.sg.financial_insurance_application_subgroup s
        JOIN DHUB.sg.financial_insurance_group_lookups l ON s.sub_group_type_id = l.id
        WHERE s.application_id IN (${idParams})`);
    return result.recordset ?? [];
};

// Get payment terms for multiple applications
export const getBulkApplicationPaymentTerms = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT 
            p.application_id,
            pt.id as payment_term_id, 
            pt.name as payment_term_name,
            spt.id as sub_payment_term_id,
            spt.name as sub_payment_term_name
        FROM DHUB.sg.financial_insurance_application p
        JOIN DHUB.sg.financial_insurance_group_lookups pt ON p.payment_term_id = pt.id
        LEFT JOIN DHUB.sg.financial_insurance_group_lookups spt ON p.sub_payment_term_id = spt.id
        WHERE p.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Get riders for multiple applications in bulk
export const getBulkApplicationRiders = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT ar.application_id, r.rider_id, r.rider_name, r.input_type, r.unit_value, ar.rider_amount as amount, ar.rider_unit as unit
        FROM sg.financial_insurance_application_rider ar
        JOIN sg.financial_insurance_riders r ON ar.rider_id = r.rider_id
        WHERE ar.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Save application rates to the normalized table
export const saveApplicationRates = async (applicationId, ratesData) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        // 1. Fetch Plan ID associated with the application (needed for the rates table schema)
        const appRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query('SELECT plan_id FROM DHUB.sg.financial_insurance_application WHERE application_id = @appId');
        
        const planId = appRes.recordset[0]?.plan_id || 1; 

        // 2. Delete existing rates for this application
        await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query('DELETE FROM DHUB.sg.financial_insurance_application_rates WHERE application_id = @appId');

        // 3. Insert new rates
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

// Get list of applications that are pending rates (Status ID: 1)
export const getApplicationsPendingRates = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT 
                fia.application_id, 
                fia.group_name, 
                fia.created_at,
                fia.borrower_age_66_70,
                fia.borrower_age_71_75,
                fia.borrower_age_76_80,
                gl.name as proposal_type,
                p.product_name as plan_name,
                pp.name as prototype_name,
                u.firstname + ' ' + u.lastname as creator_name,
                fia.total_annual_premium,
                fia.max_amount_18_64,
                fia.max_amount_66_70,
                fia.max_amount_71_75,
                fia.max_amount_76_80
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl 
                ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p 
                ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp
                ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u 
                ON fia.user_id = u.user_id
            WHERE fia.status_id = 1
                AND fia.total_annual_premium IS NULL
                AND fia.max_amount_18_64 IS NULL
                AND fia.max_amount_66_70 IS NULL
                AND fia.max_amount_71_75 IS NULL
                AND fia.max_amount_76_80 IS NULL
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};

// Get list of applications that are pending total annual premium (Status ID: 2, total_annual_premium IS NULL)
export const getApplicationsPendingTotalPremium = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT
                fia.application_id,
                fia.group_name,
                fia.created_at,
                fia.borrower_age_66_70,
                fia.borrower_age_71_75,
                fia.borrower_age_76_80,
                gl.name as proposal_type,
                p.product_name as plan_name,
                pp.name as prototype_name,
                u.firstname + ' ' + u.lastname as creator_name,
                fia.total_annual_premium
            FROM DHUB.sg.financial_insurance_application fia
            LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl
                ON fia.type_of_proposal_id = gl.id
            LEFT JOIN DHUB.sg.financial_insurance_product p
                ON fia.plan_id = p.product_id
            LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp
                ON fia.prototype_id = pp.id
            LEFT JOIN DHUB.sg.financial_insurance_users u
                ON fia.user_id = u.user_id
            WHERE fia.status_id = 1 
                AND fia.total_annual_premium IS NULL
            ORDER BY fia.created_at ASC
        `);
    return result.recordset ?? [];
};

// Get list of applications that are pending max amounts (strictly where NO values have been input yet)
// export const getApplicationsPendingMaxAmounts = async () => {
//     const pool = await poolPromise;
//     const result = await pool.request()
//         .query(`
//             SELECT
//                 fia.application_id,
//                 fia.group_name,
//                 fia.created_at,
//                 fia.borrower_age_66_70,
//                 fia.borrower_age_71_75,
//                 fia.borrower_age_76_80,
//                 gl.name as proposal_type,
//                 p.product_name as plan_name,
//                 pp.name as prototype_name,
//                 u.firstname + ' ' + u.lastname as creator_name,
//                 fia.max_amount_18_64,
//                 fia.max_amount_66_70,
//                 fia.max_amount_71_75,
//                 fia.max_amount_76_80
//             FROM DHUB.sg.financial_insurance_application fia
//             LEFT JOIN DHUB.sg.financial_insurance_group_lookups gl
//                 ON fia.type_of_proposal_id = gl.id
//             LEFT JOIN DHUB.sg.financial_insurance_product p
//                 ON fia.plan_id = p.product_id
//             LEFT JOIN DHUB.sg.financial_insurance_prototype_plans pp
//                 ON fia.prototype_id = pp.id
//             LEFT JOIN DHUB.sg.financial_insurance_users u
//                 ON fia.user_id = u.user_id
//             WHERE fia.status_id = 1 
//                 AND fia.max_amount_18_64 IS NULL
//                 AND fia.max_amount_66_70 IS NULL
//                 AND fia.max_amount_71_75 IS NULL
//                 AND fia.max_amount_76_80 IS NULL
//             ORDER BY fia.created_at ASC
//         `);
//     return result.recordset ?? [];
// };
