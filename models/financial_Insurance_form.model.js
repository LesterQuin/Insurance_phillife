import { poolPromise, sql } from '../config/db.js';

// Create a new application
export const createApplication = async (data) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('group_name', sql.NVarChar, data.group_name)
        .input('business_nature', sql.NVarChar, data.business_nature)
        .input('number_of_lives', sql.Int, data.number_of_lives)
        .input('business_address', sql.NVarChar, data.business_address)
        .input('contact_number', sql.NVarChar, data.contact_number)
        .input('fax_number', sql.NVarChar, data.fax_number || null)
        .input('email', sql.NVarChar, data.email)
        .input('contact_person', sql.NVarChar, data.contact_person)
        .input('designation', sql.NVarChar, data.designation || null)
        .input('proposal_addressee', sql.NVarChar, data.proposal_addressee || null)
        .input('addressee_designation', sql.NVarChar, data.addressee_designation || null)
        .input('status_id', sql.Int, data.status_id || 1)
        .query(`
            INSERT INTO sg.financial_insurance_application
            (group_name, business_nature, number_of_lives, business_address, contact_number, fax_number, email, contact_person, designation, proposal_addressee, addressee_designation, status_id)
            VALUES
            (@group_name, @business_nature, @number_of_lives, @business_address, @contact_number, @fax_number, @email, @contact_person, @designation, @proposal_addressee, @addressee_designation, @status_id);
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
            SELECT fia.*, fis.status_name
            FROM sg.financial_insurance_application fia
            JOIN sg.financial_insurance_status fis
            ON fia.status_id = fis.status_id
            WHERE fia.application_id = @id
        `);
    return res.recordset?.[0] ?? null;
};