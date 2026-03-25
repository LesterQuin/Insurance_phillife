import { poolPromise, sql } from '../../config/db.js';

export const getAll = async () => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM DHUB.sg.financial_insurance_system_lookups WHERE is_active = 1 ORDER BY category, name');
    return result.recordset;
};

export const getById = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT * FROM DHUB.sg.financial_insurance_system_lookups WHERE id = @id');
    return result.recordset[0];
};

export const getByCategory = async (category) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.NVarChar, category)
        .query('SELECT * FROM DHUB.sg.financial_insurance_system_lookups WHERE category = @category AND is_active = 1 ORDER BY name');
    return result.recordset;
};

export const getCategories = async () => {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT DISTINCT category FROM DHUB.sg.financial_insurance_system_lookups WHERE is_active = 1 ORDER BY category');
    return result.recordset.map(row => row.category);
};

export const create = async (data) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.NVarChar, data.category)
        .input('name', sql.NVarChar, data.name)
        .input('code', sql.NVarChar, data.code)
        .input('is_active', sql.Bit, data.is_active ?? 1)
        .query(`
            INSERT INTO DHUB.sg.financial_insurance_system_lookups (category, name, code, is_active, created_at)
            VALUES (@category, @name, @code, @is_active, GETDATE());
            SELECT SCOPE_IDENTITY() AS id;
        `);
    return { id: result.recordset[0].id, ...data };
};

export const update = async (id, data) => {
    const pool = await poolPromise;
    const request = pool.request();
    request.input('id', sql.Int, id);

    const setClauses = [];

    if (data.category !== undefined) {
        request.input('category', sql.NVarChar, data.category);
        setClauses.push('category = @category');
    }
    if (data.name !== undefined) {
        request.input('name', sql.NVarChar, data.name);
        setClauses.push('name = @name');
    }
    if (data.code !== undefined) {
        request.input('code', sql.NVarChar, data.code);
        setClauses.push('code = @code');
    }
    if (data.is_active !== undefined) {
        request.input('is_active', sql.Bit, data.is_active);
        setClauses.push('is_active = @is_active');
    }

    if (setClauses.length > 0) {
        await request.query(`
            UPDATE DHUB.sg.financial_insurance_system_lookups
            SET ${setClauses.join(', ')}
            WHERE id = @id
        `);
    }
    return { id, ...data };
};

export const deleteLookup = async (id) => {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.Int, id)
        .query('UPDATE DHUB.sg.financial_insurance_system_lookups SET is_active = 0 WHERE id = @id');
    return { deleted: true };
};