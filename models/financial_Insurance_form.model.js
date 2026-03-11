import { poolPromise, sql } from '../config/db.js';

export const createApplication = async (data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const subGroupTypeIdsValue = data.sub_group_type_id ? JSON.stringify(data.sub_group_type_id) : null;
        const levelRankingValue = data.level_ranking ? JSON.stringify(data.level_ranking) : null;
        const salaryRankingValue = data.salary_ranking ? JSON.stringify(data.salary_ranking) : null;

        const appRequest = new sql.Request(transaction);
        const appResult = await appRequest
            .input('user_id', sql.Int, userId)
            .input('group_name', sql.NVarChar, data.group_name)
            .input('business_nature', sql.NVarChar, data.business_nature)
            .input('number_of_lives', sql.Int, data.number_of_lives)
            .input('business_address', sql.NVarChar, data.business_address)
            .input('contact_number', sql.NVarChar, data.contact_number)
            .input('fax_number', sql.NVarChar, data.fax_number || null)
            .input('email', sql.NVarChar, data.email)
            .input('contact_person', sql.NVarChar, data.contact_person)
            .input('designation', sql.NVarChar, data.designation)
            .input('proposal_addressee', sql.NVarChar, data.proposal_addressee)
            .input('addressee_designation', sql.NVarChar, data.addressee_designation)
            .input('group_classification_id', sql.Int, data.group_classification_id)
            .input('other_group_classification', sql.NVarChar, data.other_group_classification || null)
            .input('business_type_id', sql.Int, data.business_type_id)
            .input('other_business_type', sql.NVarChar, data.other_business_type || null)
            .input('group_type_id', sql.Int, data.group_type_id)
            .input('sub_group_type_id', sql.NVarChar, subGroupTypeIdsValue)
            .input('other_group_type', sql.NVarChar, data.other_group_type || null)
            .input('minimum_age', sql.Int, data.minimum_age)
            .input('maximum_age', sql.Int, data.maximum_age)
            .input('payment_mode_id', sql.Int, data.payment_mode_id)
            .input('plan_id', sql.Int, data.plan_id || null)
            .input('basic_plan_id', sql.Int, data.basic_plan_id || null)
            .input('type_of_proposal_id', sql.Int, data.type_of_proposal_id)
            .input('status_id', sql.Int, data.status_id || 1)
            .input('amount_loans_id', sql.Int, data.amount_loans_id || null)
            .input('loans_amount', sql.Decimal(18, 2), data.loans_amount || null)
            .input('payment_term_id', sql.Int, data.payment_term_id || null)
            .input('sub_payment_term_id', sql.Int, data.sub_payment_term_id || null)
            .input('coverage_type_id', sql.Int, data.coverage_type_id || null)
            .query(`
                INSERT INTO DHUB.sg.financial_insurance_application (
                    user_id, group_name, business_nature, number_of_lives, business_address, contact_number, fax_number, email,
                    contact_person, designation, proposal_addressee, addressee_designation, group_classification_id,
                    other_group_classification, business_type_id, other_business_type, group_type_id, sub_group_type_id,
                    other_group_type, minimum_age, maximum_age, payment_mode_id, plan_id, basic_plan_id, type_of_proposal_id, status_id,
                    amount_loans_id, loans_amount, payment_term_id, sub_payment_term_id, coverage_type_id
                ) VALUES (
                    @user_id, @group_name, @business_nature, @number_of_lives, @business_address, @contact_number, @fax_number, @email,
                    @contact_person, @designation, @proposal_addressee, @addressee_designation, @group_classification_id,
                    @other_group_classification, @business_type_id, @other_business_type, @group_type_id, @sub_group_type_id,
                    @other_group_type, @minimum_age, @maximum_age, @payment_mode_id, @plan_id, @basic_plan_id, @type_of_proposal_id, @status_id,
                    @amount_loans_id, @loans_amount, @payment_term_id, @sub_payment_term_id, @coverage_type_id
                );
                SELECT SCOPE_IDENTITY() AS application_id;
            `);

        const applicationId = appResult.recordset[0].application_id;

        // Insert coverage ranking details if applicable
        const coverageTypeId = data.coverage_type_id;
        const levelRanking = data.level_ranking;
        const salaryRanking = data.salary_ranking;
        const uniformAmount = data.uniform_coverage_amount;

        if (coverageTypeId === 32 && levelRanking && levelRanking.length > 0) { // Level Ranking
            for (const rank of levelRanking) {
                const rankRequest = new sql.Request(transaction);
                await rankRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('designation', sql.NVarChar, rank.designation)
                    .input('amount', sql.Decimal(18, 2), rank.amount)
                    .input('total_coverage_amount', sql.Decimal(18, 2), rank.amount) // For Level Ranking, total is the same as amount
                    .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @total_coverage_amount);`);
            }
        } else if (coverageTypeId === 34 && salaryRanking && salaryRanking.length > 0) { // By Salary Rank
            for (const rank of salaryRanking) {
                const multiplier = parseInt(rank.salary_multiplier.replace(/x/i, ''), 10) || 1;
                const totalAmount = parseFloat(rank.amount) * multiplier;

                const rankRequest = new sql.Request(transaction);
                await rankRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('designation', sql.NVarChar, rank.designation)
                    .input('amount', sql.Decimal(18, 2), rank.amount)
                    .input('salary_multiplier', sql.NVarChar, rank.salary_multiplier)
                    .input('total_coverage_amount', sql.Decimal(18, 2), totalAmount)
                    .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, salary_multiplier, total_coverage_amount) VALUES (@application_id, @designation, @amount, @salary_multiplier, @total_coverage_amount);`);
            }
        } else if (coverageTypeId === 33 && uniformAmount != null) { // Uniform Coverage
            const rankRequest = new sql.Request(transaction);
            await rankRequest
                .input('application_id', sql.Int, applicationId)
                .input('uniform_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                .input('total_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, uniform_coverage_amount, total_coverage_amount) VALUES (@application_id, @uniform_coverage_amount, @total_coverage_amount);`);
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
        throw err; // Re-throw the error to be caught by the controller
    }
};


// Get all applications
export const getAllApplications = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT
                fia.application_id, fia.user_id, fia.group_name, fia.number_of_lives, fia.contact_person,
                fia.status_id, fia.group_classification_id, fia.other_group_classification,
                fia.business_type_id, fia.other_business_type, fia.group_type_id, fia.other_group_type, // Removed rider_ids
                fia.plan_id, fia.basic_plan_id, fia.sub_group_type_id,
                fia.type_of_proposal_id,
                fia.created_at, fia.updated_at,
                fis.status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                bp.basic_plan_name
            FROM sg.financial_insurance_application fia
            LEFT JOIN sg.financial_insurance_status fis ON fia.status_id = fis.status_id
            LEFT JOIN sg.financial_insurance_group_lookups gc ON fia.group_classification_id = gc.id
            LEFT JOIN sg.financial_insurance_group_lookups bt ON fia.business_type_id = bt.id
            LEFT JOIN sg.financial_insurance_group_lookups gt ON fia.group_type_id = gt.id
            LEFT JOIN sg.financial_insurance_group_lookups topl ON fia.type_of_proposal_id = topl.id
            LEFT JOIN sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN sg.financial_insurance_basic_plan bp ON fia.basic_plan_id = bp.basic_plan_id
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
                bp.basic_plan_name

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

            WHERE fia.application_id = @id
        `);

    return res.recordset?.[0] ?? null;
};

// Update application - handles partial updates
export const updateApplication = async (id, data) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Handle coverage ranking update
        if (data.level_ranking !== undefined || data.salary_ranking !== undefined || data.coverage_type_id !== undefined || data.uniform_coverage_amount !== undefined) {
            const deleteRankingsRequest = new sql.Request(transaction);
            await deleteRankingsRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB.sg.financial_insurance_coverage_ranking WHERE application_id = @application_id');

            const coverageTypeId = data.coverage_type_id;
            const levelRanking = data.level_ranking;
            const salaryRanking = data.salary_ranking;
            const uniformAmount = data.uniform_coverage_amount;

            if (coverageTypeId === 32 && levelRanking && levelRanking.length > 0) { // Level Ranking
                for (const rank of levelRanking) {
                    const rankRequest = new sql.Request(transaction);
                    await rankRequest
                        .input('application_id', sql.Int, id)
                        .input('designation', sql.NVarChar, rank.designation)
                        .input('amount', sql.Decimal(18, 2), rank.amount)
                        .input('total_coverage_amount', sql.Decimal(18, 2), rank.amount)
                        .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @total_coverage_amount);`);
                }
            } else if (coverageTypeId === 34 && salaryRanking && salaryRanking.length > 0) { // By Salary Rank
                for (const rank of salaryRanking) {
                    const multiplier = parseInt(rank.salary_multiplier.replace(/x/i, ''), 10) || 1;
                    const totalAmount = parseFloat(rank.amount) * multiplier;

                    const rankRequest = new sql.Request(transaction);
                    await rankRequest
                        .input('application_id', sql.Int, id)
                        .input('designation', sql.NVarChar, rank.designation)
                        .input('amount', sql.Decimal(18, 2), rank.amount)
                        .input('salary_multiplier', sql.NVarChar, rank.salary_multiplier)
                        .input('total_coverage_amount', sql.Decimal(18, 2), totalAmount)
                        .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, designation, amount, salary_multiplier, total_coverage_amount) VALUES (@application_id, @designation, @amount, @salary_multiplier, @total_coverage_amount);`);
                }
            } else if (coverageTypeId === 33 && uniformAmount != null) { // Uniform Coverage
                const rankRequest = new sql.Request(transaction);
                await rankRequest
                    .input('application_id', sql.Int, id)
                    .input('uniform_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                    .input('total_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                    .query(`INSERT INTO DHUB.sg.financial_insurance_coverage_ranking (application_id, uniform_coverage_amount, total_coverage_amount) VALUES (@application_id, @uniform_coverage_amount, @total_coverage_amount);`);
            }
        }

        // Handle riders update first (delete and re-insert)
        if (data.riders !== undefined) {
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
        addClause('number_of_lives', data.number_of_lives, sql.Int);
        addClause('business_address', data.business_address);
        addClause('contact_number', data.contact_number);
        addClause('fax_number', data.fax_number || null);
        addClause('email', data.email);
        addClause('contact_person', data.contact_person);
        addClause('designation', data.designation);
        addClause('proposal_addressee', data.proposal_addressee);
        addClause('addressee_designation', data.addressee_designation);
        addClause('group_classification_id', data.group_classification_id, sql.Int);
        addClause('other_group_classification', data.other_group_classification || null);
        addClause('business_type_id', data.business_type_id, sql.Int);
        addClause('other_business_type', data.other_business_type || null);
        addClause('group_type_id', data.group_type_id, sql.Int);
        if (data.group_type_id !== undefined && data.sub_group_type_id === undefined) {
             setClauses.push('sub_group_type_id = NULL');
        }
        if (data.sub_group_type_id !== undefined) {
            const subGroupValue = data.sub_group_type_id ? JSON.stringify(data.sub_group_type_id) : null;
            addClause('sub_group_type_id', subGroupValue);
        }
        addClause('other_group_type', data.other_group_type || null);
        addClause('minimum_age', data.minimum_age, sql.Int);
        addClause('maximum_age', data.maximum_age, sql.Int);
        addClause('payment_mode_id', data.payment_mode_id, sql.Int);
        addClause('type_of_proposal_id', data.type_of_proposal_id, sql.Int);
        addClause('plan_id', data.plan_id, sql.Int);
        addClause('basic_plan_id', data.basic_plan_id, sql.Int);
        addClause('status_id', data.status_id, sql.Int);

        // New product-specific fields
        addClause('amount_loans_id', data.amount_loans_id, sql.Int);
        addClause('loans_amount', data.loans_amount, sql.Decimal(18, 2));
        addClause('payment_term_id', data.payment_term_id, sql.Int);
        addClause('sub_payment_term_id', data.sub_payment_term_id, sql.Int);
        addClause('coverage_type_id', data.coverage_type_id, sql.Int);

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

// Get attachable riders for a specific basic plan
export const getRidersByBasicPlanId = async (basicPlanId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('basicPlanId', sql.Int, basicPlanId)
        .query(`
            SELECT rider_id, rider_name, is_active
            FROM sg.financial_insurance_rider
            WHERE basic_plan_id = @basicPlanId AND is_active = 1
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

// Get riders by a list of IDs
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
            JOIN sg.financial_insurance_rider r ON ar.rider_id = r.rider_id
            WHERE ar.application_id = @application_id
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
        JOIN sg.financial_insurance_rider r ON ar.rider_id = r.rider_id
        WHERE ar.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};
