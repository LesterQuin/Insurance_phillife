import { poolPromise, sql } from "../../config/db.js";

// CREATE
export const createRider = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
        INSERT INTO sg.financial_insurance_riders (name)
        OUTPUT INSERTED.*
        VALUES (@name)
        `);

    return res.recordset[0];
};

// GET BY NAME
export const getRiderByName = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
        SELECT TOP 1 *
        FROM sg.financial_insurance_riders
        WHERE name = @name
        `);

    return res.recordset[0] || null;
};

// GET ALL
export const getAllRiders = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_insurance_riders
            ORDER BY rider_id
        `);

    return res.recordset;
};

// GET BY ID
export const getRiderById = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT *
            FROM sg.financial_insurance_riders
            WHERE rider_id = @id
        `);
    
    return res.recordset[0] || null;
};

// UPDATE
export const updateRider = async (id, name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.VarChar, name)
        .query(`
            UPDATE sg.financial_insurance_riders
            SET name = @name
            OUTPUT INSERTED.*
            WHERE rider_id = @id
        `);

    return res.recordset[0] || null;
};

// DELETE
export const deleteRider = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE 
            FROM sg.financial_insurance_riders
            OUTPUT DELETED.*
            WHERE rider_id = @id
        `);

    return res.recordset[0] || null;
};