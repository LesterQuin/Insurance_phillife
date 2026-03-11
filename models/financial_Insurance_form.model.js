import { poolPromise, sql } from '../config/db.js';

export const createApplication = async (data, userId) => {
    const pool = await poolPromise;

    // Convert rider_ids array to JSON string if it's an array
    const riderIdsValue = data.rider_ids
        ? Array.isArray(data.rider_ids) ? JSON.stringify(data.rider_ids) : data.rider_ids
        : null;

    // Convert sub_group_type_id array to JSON string if it's an array (for Employer-Employee)
    const subGroupTypeIdsValue = data.sub_group_type_id
        ? Array.isArray(data.sub_group_type_id) ? JSON.stringify(data.sub_group_type_id) : data.sub_group_type_id
        : null;

    const res = await pool.request()
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
        .input('rider_ids', sql.NVarChar, riderIdsValue)
        .input('type_of_proposal_id', sql.Int, data.type_of_proposal_id)
        .input('status_id', sql.Int, data.status_id || 1)
        .query(`
            INSERT INTO DHUB.sg.financial_insurance_application
            (user_id, group_name, business_nature, number_of_lives, business_address, contact_number, fax_number, email,
            contact_person, designation, proposal_addressee, addressee_designation, group_classification_id,
            other_group_classification, business_type_id, other_business_type, group_type_id, sub_group_type_id,
            other_group_type, minimum_age, maximum_age, payment_mode_id, plan_id, basic_plan_id, rider_ids, type_of_proposal_id, status_id)
            VALUES
            (@user_id, @group_name, @business_nature, @number_of_lives, @business_address, @contact_number, @fax_number, @email,
            @contact_person, @designation, @proposal_addressee, @addressee_designation, @group_classification_id,
            @other_group_classification, @business_type_id, @other_business_type, @group_type_id, @sub_group_type_id,
            @other_group_type, @minimum_age, @maximum_age, @payment_mode_id, @plan_id, @basic_plan_id, @rider_ids, @type_of_proposal_id, @status_id);
            SELECT SCOPE_IDENTITY() AS application_id;
        `);

    return res.recordset?.[0] ?? null;
};


// Get all applications
export const getAllApplications = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT
                fia.application_id, fia.user_id, fia.group_name, fia.number_of_lives, fia.contact_person,
                fia.status_id, fia.group_classification_id, fia.other_group_classification,
                fia.business_type_id, fia.other_business_type, fia.group_type_id, fia.other_group_type,
                fia.plan_id, fia.basic_plan_id, fia.rider_ids, fia.sub_group_type_id,
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
    
    const setClauses = [];
    const inputs = [];
    
    if (data.group_name !== undefined) {
        setClauses.push('group_name = @group_name');
        inputs.push({ name: 'group_name', value: data.group_name });
    }
    if (data.business_nature !== undefined) {
        setClauses.push('business_nature = @business_nature');
        inputs.push({ name: 'business_nature', value: data.business_nature });
    }
    if (data.number_of_lives !== undefined) {
        setClauses.push('number_of_lives = @number_of_lives');
        inputs.push({ name: 'number_of_lives', value: data.number_of_lives });
    }
    if (data.business_address !== undefined) {
        setClauses.push('business_address = @business_address');
        inputs.push({ name: 'business_address', value: data.business_address });
    }
    if (data.contact_number !== undefined) {
        setClauses.push('contact_number = @contact_number');
        inputs.push({ name: 'contact_number', value: data.contact_number });
    }
    if (data.fax_number !== undefined) {
        setClauses.push('fax_number = @fax_number');
        inputs.push({ name: 'fax_number', value: data.fax_number || null });
    }
    if (data.email !== undefined) {
        setClauses.push('email = @email');
        inputs.push({ name: 'email', value: data.email });
    }
    if (data.contact_person !== undefined) {
        setClauses.push('contact_person = @contact_person');
        inputs.push({ name: 'contact_person', value: data.contact_person });
    }
    if (data.designation !== undefined) {
        setClauses.push('designation = @designation');
        inputs.push({ name: 'designation', value: data.designation });
    }
    if (data.proposal_addressee !== undefined) {
        setClauses.push('proposal_addressee = @proposal_addressee');
        inputs.push({ name: 'proposal_addressee', value: data.proposal_addressee });
    }
    if (data.addressee_designation !== undefined) {
        setClauses.push('addressee_designation = @addressee_designation');
        inputs.push({ name: 'addressee_designation', value: data.addressee_designation });
    }
    if (data.group_classification_id !== undefined) {
        setClauses.push('group_classification_id = @group_classification_id');
        inputs.push({ name: 'group_classification_id', value: data.group_classification_id });
    }
    if (data.other_group_classification !== undefined) {
        setClauses.push('other_group_classification = @other_group_classification');
        inputs.push({ name: 'other_group_classification', value: data.other_group_classification || null });
    }
    if (data.business_type_id !== undefined) {
        setClauses.push('business_type_id = @business_type_id');
        inputs.push({ name: 'business_type_id', value: data.business_type_id });
    }
    if (data.other_business_type !== undefined) {
        setClauses.push('other_business_type = @other_business_type');
        inputs.push({ name: 'other_business_type', value: data.other_business_type || null });
    }
    if (data.group_type_id !== undefined) {
        setClauses.push('group_type_id = @group_type_id');
        inputs.push({ name: 'group_type_id', value: data.group_type_id });

        if (data.sub_group_type_id === undefined) {
            setClauses.push('sub_group_type_id = NULL');
        }
    }
    if (data.sub_group_type_id !== undefined) {
        const subGroupTypeIdsValue = data.sub_group_type_id
            ? Array.isArray(data.sub_group_type_id) ? JSON.stringify(data.sub_group_type_id) : data.sub_group_type_id
            : null;
        setClauses.push('sub_group_type_id = @sub_group_type_id');
        inputs.push({ name: 'sub_group_type_id', value: subGroupTypeIdsValue });
    }
    if (data.other_group_type !== undefined) {
        setClauses.push('other_group_type = @other_group_type');
        inputs.push({ name: 'other_group_type', value: data.other_group_type || null });
    }
    if (data.minimum_age !== undefined) {
        setClauses.push('minimum_age = @minimum_age');
        inputs.push({ name: 'minimum_age', value: data.minimum_age });
    }
    if (data.maximum_age !== undefined) {
        setClauses.push('maximum_age = @maximum_age');
        inputs.push({ name: 'maximum_age', value: data.maximum_age });
    }
    if (data.payment_mode_id !== undefined) {
        setClauses.push('payment_mode_id = @payment_mode_id');
        inputs.push({ name: 'payment_mode_id', value: data.payment_mode_id });
    }
    if (data.type_of_proposal_id !== undefined) {
        setClauses.push('type_of_proposal_id = @type_of_proposal_id');
        inputs.push({ name: 'type_of_proposal_id', value: data.type_of_proposal_id });
    }
    if (data.plan_id !== undefined) {
        setClauses.push('plan_id = @plan_id');
        inputs.push({ name: 'plan_id', value: data.plan_id || null });
    }
    if (data.basic_plan_id !== undefined) {
        setClauses.push('basic_plan_id = @basic_plan_id');
        inputs.push({ name: 'basic_plan_id', value: data.basic_plan_id || null });
    }
    if (data.rider_ids !== undefined) {
        const riderIdsValue = data.rider_ids
            ? Array.isArray(data.rider_ids) ? JSON.stringify(data.rider_ids) : data.rider_ids
            : null;
        setClauses.push('rider_ids = @rider_ids');
        inputs.push({ name: 'rider_ids', value: riderIdsValue });
    }
    if (data.status_id !== undefined) {
        setClauses.push('status_id = @status_id');
        inputs.push({ name: 'status_id', value: data.status_id });
    }
    
    // Always update timestamp
    setClauses.push('updated_at = GETDATE()');
    
    // Add WHERE clause
    const whereClause = 'WHERE application_id = @id';
    
    // Build and execute query
    const request = pool.request();
    request.input('id', sql.Int, id);
    
    for (const input of inputs) {
        request.input(input.name, input.name.includes('age') || input.name.includes('id') ? sql.Int : sql.NVarChar, input.value);
    }
    
    const query = `UPDATE DHUB.sg.financial_insurance_application SET ${setClauses.join(', ')} ${whereClause}`;
    await request.query(query);

    return getApplicationById(id);
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
            SELECT product_id AS plan_id, product_name AS proposal_plan, acronym, is_active
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
export const getRidersByIds = async (ids) => {
    if (!ids || ids.length === 0) return new Map();
    const pool = await poolPromise;
    const riderRes = await pool.request()
        .query(`SELECT rider_id AS id, rider_name AS name FROM sg.financial_insurance_rider WHERE rider_id IN (${ids.join(',')})`);
    const ridersMap = new Map();
    riderRes.recordset.forEach(r => ridersMap.set(r.id, r.name));
    return ridersMap;
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
