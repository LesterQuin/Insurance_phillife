import { poolPromise, sql } from "../../config/db.js";

const CATEGORY = 'TYPE_OF_GROUP';
const TABLE_NAME = '[DHUB].[sg].[financial_insurance_group_lookups]';

// GET ALL
export const getAll = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.NVarChar, CATEGORY)
        .query(`
            SELECT 
                t1.id, 
                t1.name, 
                t1.parent_id,
                t2.name AS parent_name,
                t1.is_active,
                t1.created_at,
                t1.updated_at
            FROM ${TABLE_NAME} t1
            LEFT JOIN ${TABLE_NAME} t2 ON t1.parent_id = t2.id
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
        .input("id", sql.Int, id)
        .input('category', sql.NVarChar, CATEGORY)
        .query(`
            SELECT 
                t1.id, 
                t1.name, 
                t1.parent_id,
                t2.name AS parent_name,
                t1.is_active,
                t1.created_at,
                t1.updated_at
            FROM ${TABLE_NAME} t1
            LEFT JOIN ${TABLE_NAME} t2 ON t1.parent_id = t2.id
            WHERE t1.id = @id AND t1.category = @category
        `);
    return result.recordset[0];
};