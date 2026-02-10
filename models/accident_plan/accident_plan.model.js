import { poolPromise, sql } from "../../config/db.js"

// CREATE
export const createPlan = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            INSERT INTO sg.financial_personal_accident_plans(name)
            OUTPUT INSERTED.*
            VALUES (@name)
        `);
    return res.recordset[0];
};

// GET PLAN BY NAME
export const getPlanByName = async (name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            SELECT *
            FROM sg.financial_personal_accident_plans
            WHERE LOWER(name) = LOWER(@name)
        `);
    return res.recordset[0];
};

// GET ALL PLAN
export const getAllPlans = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_personal_accident_plans
            ORDER BY created_at
        `);
    return res.recordset;
};

// GET PLAN BY ID
export const getPlanById = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT * 
            FROM sg.financial_personal_accident_plans
            WHERE personal_plan_id = @id
        `);
    return res.recordset[0];
};

// UPDATE PLAN
export const updatePlan = async (id, name) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql.VarChar, name)
        .query(`
            UPDATE sg.financial_personal_accident_plans
            SET name = @name
            OUTPUT INSERTED.*
            WHERE personal_plan_id = @id
        `);
    return res.recordset[0];
};

// DELETE PLAN
export const deletePlan = async (id) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE
            FROM sg.financial_personal_accident_plans
            OUTPUT DELETED.*
            WHERE personal_plan_id = @id
        `);
    return res.recordset[0];
};
