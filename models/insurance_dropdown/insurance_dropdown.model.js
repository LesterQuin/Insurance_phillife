import { poolPromise, sql } from '../../config/db.js';

export const getIndustries = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT [id]
                ,[category]
                ,[name]
                ,[parent_id]
                ,[is_active]
                ,[created_at]
                ,[updated_at]
            FROM [DHUB].[sg].[financial_insurance_industries]
            WHERE [is_active] = 1
            ORDER BY [id] ASC
        `);
    return res.recordset ?? [];
};
