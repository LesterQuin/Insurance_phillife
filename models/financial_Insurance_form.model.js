import { poolPromise, sql } from '../config/db.js';

export const createApplication = async (data) => {
    const pool = await poolPromise;

    // Convert rider_ids array to JSON string if it's an array
    const riderIdsValue = data.rider_ids
        ? Array.isArray(data.rider_ids) ? JSON.stringify(data.rider_ids) : data.rider_ids
        : null;

    const res = await pool.request()
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
        .input('sub_group_type_id', sql.Int, data.sub_group_type_id || null)
        .input('other_group_type', sql.NVarChar, data.other_group_type || null)
        .input('payment_mode_id', sql.Int, data.payment_mode_id)
        .input('plan_id', sql.Int, data.plan_id || null)
        .input('basic_plan_id', sql.Int, data.basic_plan_id || null)
        .input('rider_ids', sql.NVarChar, riderIdsValue)
        .input('status_id', sql.Int, data.status_id || 1)
        .query(`
            INSERT INTO sg.financial_insurance_application
            (group_name, business_nature, number_of_lives, business_address, contact_number, fax_number, email,
            contact_person, designation, proposal_addressee, addressee_designation, group_classification_id,
            other_group_classification, business_type_id, other_business_type, group_type_id, sub_group_type_id,
            other_group_type, payment_mode_id, plan_id, basic_plan_id, rider_ids, status_id)
            VALUES
            (@group_name, @business_nature, @number_of_lives, @business_address, @contact_number, @fax_number, @email,
            @contact_person, @designation, @proposal_addressee, @addressee_designation, @group_classification_id,
            @other_group_classification, @business_type_id, @other_business_type, @group_type_id, @sub_group_type_id,
            @other_group_type, @payment_mode_id, @plan_id, @basic_plan_id, @rider_ids, @status_id);
            SELECT SCOPE_IDENTITY() AS application_id;
        `);

    return res.recordset?.[0] ?? null;
};


// Get all applications
export const getAllApplications = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT fia.*, fis.status_name
            FROM sg.financial_insurance_application fia
            JOIN sg.financial_insurance_status fis
            ON fia.status_id = fis.status_id
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
                sgt.name AS sub_group_type_name,
                pm.name AS payment_mode_name,

                p.proposal_plan AS plan_name,
                bp.basic_plan_name

            FROM sg.financial_insurance_application fia

            LEFT JOIN sg.financial_insurance_status fis
                ON fia.status_id = fis.status_id

            LEFT JOIN sg.financial_insurance_group_lookups gc
                ON fia.group_classification_id = gc.id

            LEFT JOIN sg.financial_insurance_group_lookups bt
                ON fia.business_type_id = bt.id

            LEFT JOIN sg.financial_insurance_group_lookups gt
                ON fia.group_type_id = gt.id

            LEFT JOIN sg.financial_insurance_group_lookups sgt
                ON fia.sub_group_type_id = sgt.id

            LEFT JOIN sg.financial_insurance_group_lookups pm
                ON fia.payment_mode_id = pm.id

            LEFT JOIN sg.financial_insurance_plan p
                ON fia.plan_id = p.plan_id

            LEFT JOIN sg.financial_basic_plan bp
                ON fia.basic_plan_id = bp.basic_plan_id

            WHERE fia.application_id = @id
        `);

    const app = res.recordset?.[0];
    if (!app) return null;

    /* -----------------------------
       Build structured response
    ----------------------------- */

    const response = {
        application_id: app.application_id,
        group_name: app.group_name,
        business_nature: app.business_nature,
        number_of_lives: app.number_of_lives,
        business_address: app.business_address,
        contact_number: app.contact_number,
        fax_number: app.fax_number,
        email: app.email,
        contact_person: app.contact_person,
        designation: app.designation,
        proposal_addressee: app.proposal_addressee,
        addressee_designation: app.addressee_designation,
        status: {
            id: app.status_id,
            name: app.status_name
        },
        group_classification: {
            id: app.group_classification_id,
            name: app.group_classification_name
        },
        business_type: {
            id: app.business_type_id,
            name: app.business_type_name
        },
        group_type: {
            id: app.group_type_id,
            name: app.group_type_name
        },
        sub_group_type: {
            id: app.sub_group_type_id,
            name: app.sub_group_type_name
        },
        payment_mode: {
            id: app.payment_mode_id,
            name: app.payment_mode_name
        },
        plan: {
            id: app.plan_id,
            name: app.plan_name
        },
        basic_plan: {
            id: app.basic_plan_id,
            name: app.basic_plan_name
        },
        riders: [],
        created_at: app.created_at,
        updated_at: app.updated_at
    };

    /* -----------------------------
       Fetch Riders (Optimized)
    ----------------------------- */

    let riderIds = [];

    if (app.rider_ids) {
        try {
            riderIds = JSON.parse(app.rider_ids);
        } catch {
            riderIds = [];
        }
    }

    if (riderIds.length > 0) {
        const riderRes = await pool.request()
            .query(`
                SELECT rider_id AS id, rider_name AS name
                FROM sg.financial_attachable_rider
                WHERE rider_id IN (${riderIds.join(',')})
            `);

        response.riders = riderRes.recordset;
    }

    return response;
};

// Update application
export const updateApplication = async (id, data) => {
    const pool = await poolPromise;

    const riderIdsValue = data.rider_ids
        ? Array.isArray(data.rider_ids) ? JSON.stringify(data.rider_ids) : data.rider_ids
        : null;

    await pool.request()
        .input('id', sql.Int, id)
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
        .input('sub_group_type_id', sql.Int, data.sub_group_type_id || null)
        .input('other_group_type', sql.NVarChar, data.other_group_type || null)
        .input('payment_mode_id', sql.Int, data.payment_mode_id)
        .input('plan_id', sql.Int, data.plan_id || null)
        .input('basic_plan_id', sql.Int, data.basic_plan_id || null)
        .input('rider_ids', sql.NVarChar, riderIdsValue)
        .input('status_id', sql.Int, data.status_id || 1)
        .query(`
            UPDATE sg.financial_insurance_application
            SET group_name=@group_name, business_nature=@business_nature, number_of_lives=@number_of_lives,
                business_address=@business_address, contact_number=@contact_number, fax_number=@fax_number, email=@email,
                contact_person=@contact_person, designation=@designation, proposal_addressee=@proposal_addressee,
                addressee_designation=@addressee_designation, group_classification_id=@group_classification_id,
                other_group_classification=@other_group_classification, business_type_id=@business_type_id,
                other_business_type=@other_business_type, group_type_id=@group_type_id, sub_group_type_id=@sub_group_type_id,
                other_group_type=@other_group_type, payment_mode_id=@payment_mode_id, plan_id=@plan_id,
                basic_plan_id=@basic_plan_id, rider_ids=@rider_ids,
                status_id=@status_id, updated_at=GETDATE()
            WHERE application_id=@id
        `);

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
            SELECT plan_id, proposal_plan, acronym, is_active
            FROM sg.financial_insurance_plan
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
            FROM sg.financial_basic_plan
            WHERE plan_id = @planId AND is_active = 1
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
            FROM sg.financial_attachable_rider
            WHERE basic_plan_id = @basicPlanId AND is_active = 1
        `);
    return res.recordset ?? [];
};
