import { poolPromise, sql } from "../../config/db.js";

// GET BY CATEGORY
export const getByCategory = async (category) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.NVarChar, category)
        .query(`
            SELECT 
                t1.id, 
                t1.category,
                t1.name, 
                t1.parent_id,
                t2.name AS parent_name,
                t1.is_active,
                t1.created_at,
                t1.updated_at
            FROM [IAF].[sg].[financial_insurance_group_lookups] t1
            LEFT JOIN [IAF].[sg].[financial_insurance_group_lookups] t2 ON t1.parent_id = t2.id
            WHERE t1.category = @category 
            AND t1.is_active = 1
            ORDER BY t1.created_at DESC
        `);
    return result.recordset;
};

// GET BY ID
export const getById = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT 
                t1.id, 
                t1.category,
                t1.name, 
                t1.parent_id,
                t2.name AS parent_name,
                t1.is_active,
                t1.created_at,
                t1.updated_at
            FROM [IAF].[sg].[financial_insurance_group_lookups] t1
            LEFT JOIN [IAF].[sg].[financial_insurance_group_lookups] t2 ON t1.parent_id = t2.id
            WHERE t1.id = @id
        `);
    return result.recordset[0];
};

// GET ALL
export const getAll = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT 
                t1.id, 
                t1.category,
                t1.name, 
                t1.parent_id,
                t2.name AS parent_name,
                t1.is_active,
                t1.created_at,
                t1.updated_at
            FROM [IAF].[sg].[financial_insurance_group_lookups] t1
            LEFT JOIN [IAF].[sg].[financial_insurance_group_lookups] t2 ON t1.parent_id = t2.id
            WHERE t1.is_active = 1
            ORDER BY t1.category ASC, t1.created_at DESC
        `);
    return result.recordset;
};
