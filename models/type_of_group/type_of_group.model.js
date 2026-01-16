import { poolPromise, sql } from "../../config/db.js"

// CREATE
export const create = async (name, parent_id = null) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .input("parent_id", sql.Int, parent_id)
        .query(`
            INSERT INTO sg.financial_insurance_typesof_group
                (name, parent_id)
            OUTPUT INSERTED.*
            VALUES (@name, @parent_id)
        `);
    return result.recordset[0];
};

// GET BY NAME
export const getByName = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            SELECT * 
            FROM sg.financial_insurance_typesof_group
            WHERE LOWER(name) = LOWER(@name)
        `);
    return res.recordset[0];
};

// GET ALL
export const getAll =async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_insurance_typesof_group
            ORDER BY parent_id, group_type_id
        `);
    return res.recordset;
};

// GET BY ID
export const getById = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT * 
            FROM sg.financial_insurance_typesof_group
            WHERE group_type_id = @id
        `);
    return res.recordset[0];
};

// GET SUB-TYPES
export const getSubTypes = async (parent_id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("parent_id", sql.Int, parent_id)
        .query(`
            SELECT * 
            FROM sg.financial_insurance_typeof_group
            WHERE parent_id = @parentid
        `);
    return res.recordset;
};

// UPDATE
export const update = async (id, name, parent_id = null) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.VarChar, name)
        .input("parent_id", sql.Int, parent_id)
        .query(`
            UPDATE sg.financial_insurance_typesof_group
            SET name=@name, parent_id=@parent_id
            OUTPUT INSERTED.*
            WHERE group_type_id=@id
        `);
    return res.recordset[0];
};

// DELETE
export const remove = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE 
            FROM sg.financial_insurance_group_types
            OUTPUT DELETED.*
            WEHERE group_type_id = @id
        `);
    return res.recordset[0];
};