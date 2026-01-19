import { poolPromise, sql } from "../../config/db.js"

// CREATE
export const create = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            INSERT INTO sg.financial_insurance_payment_modes (name)
            OUTPUT INSERTED.*
            VALUES (@name)
        `);
    return result.recordset[0];
}

// GET ALL
export const getAll = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_insurance_payment_modes
            ORDER BY payment_mode_id
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
            FROM sg.financial_insurance_payment_modes
            WHERE payment_mode_id = @id
        `);
    return res.recordset[0];
};

// GET BY NAME
export const getByName = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            SELECT *
            FROM sg.financial_insurance_payment_modes
            WHERE LOWER(name) = LOWER(@name)
        `);
    return res.recordset[0];
};

// UPDATE
export const update = async (id, name) => {
    const pool = await poolPromise
    const res = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.VarChar, name)
        .query(`
            UPDATE sg.financial_insurance_payment_modes
            SET name = @name
            OUTPUT INSERTED.*
            WHERE payment_mode_id = @id
        `)
    return res.recordset[0];
};

// DELETE 
export const remove = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE FROM sg.financial_insurance_payment_modes
            OUTPUT DELETED.*
            WHERE payment_mode_id = @id
        `);
    return res.recordset[0];
};