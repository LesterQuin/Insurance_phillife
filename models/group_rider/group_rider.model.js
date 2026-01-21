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
