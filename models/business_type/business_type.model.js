import { poolPromise, sql} from "../../config/db.js"

// GET ALL
export const getAll = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.NVarChar, 'BUSINESS_TYPE')
        .query(`
            SELECT id, name, parent_id
            FROM sg.financial_insurance_group_lookups
            WHERE category = @category AND is_active = 1
            ORDER BY id ASC
        `);
    return result.recordset;
}

// GET by ID
export const getById = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("id", sql.Int, id)
        .input('category', sql.NVarChar, 'BUSINESS_TYPE')
        .query(`
            SELECT id, name, parent_id FROM sg.financial_insurance_group_lookups
            WHERE id = @id AND category = @category AND is_active = 1
        `);
    return result.recordset[0];
};