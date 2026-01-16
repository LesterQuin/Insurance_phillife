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