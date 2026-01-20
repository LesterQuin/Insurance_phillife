import { poolPromise, sql } from "../../config/db.js"

// CREATE
export const createPlan = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            INSERT INTO sg.financial_insurance_plans(name)
            OUTPUT INSERTED.*
            VALUES (@name)
        `);

    return res.recordset?.[0] || null;
};

// GET BY NAME
export const getPlanByName = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            SELECT *
            FROM sg.financial_insurance_plans
            WHERE LOWER(name) = LOWER(@name)
        `);

    return res.recordset?.[0] || null;
};

// GET ALl
export const getAllPlans = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_insurance_plans
            ORDER BY plan_id
        `);
    return res.recordset;
};