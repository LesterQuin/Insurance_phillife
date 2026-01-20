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

// GET BY ID
export const getPlanById = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT *
            FROM sg.financial_insurance_plans
            WHERE plan_id = @id
        `);
    return res.recordset[0];
};

// UPDATE
export const updatePlan = async (id, name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.VarChar, name)
        .query(`
            UPDATE sg.financial_insurance_plans
            SET name = @name
            OUTPUT INSERTED.*
            WHERE plan_id = @id
        `);
    return res.recordset[0];
};