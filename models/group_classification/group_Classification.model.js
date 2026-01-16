import { sql, poolPromise } from "../../config/db.js"

// CREATE
export const create = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
        INSERT INTO sg.financial_insurance_group_classifications (name)
        OUTPUT INSERTED.*
        VALUES (@name)
        `);

    return result.recordset[0];
};

// GET ALL
export const getAll = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_insurance_group_classifications
            ORDER BY classification_id DESC
        `);
    return result.recordset;
};

// GET BY ID
export const getById = async (classification_id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("classification_id", sql.Int, classification_id)
        .query(`
            SELECT *
            FROM sg.financial_insurance_group_classifications
            WHERE classification_id = @classification_id
        `);
    return result.recordset[0];
};

// GET BY NAME (for duplicate check)
export const getByName = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            SELECT *
            FROM sg.financial_insurance_group_classifications
            WHERE LOWER(name) = LOWER(@name)
        `);
    return result.recordset[0];
}; 

// UPDATE
export const update = async (classification_id, name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("classification_id", sql.Int, classification_id)
        .input("name", sql.VarChar, name)
        .query(`
            UPDATE sg.financial_insurance_group_classifications
            SET name = @name
            OUTPUT INSERTED.*
            WHERE classification_id = @classification_id
        `);
    return result.recordset[0];
};

// DELETE
export const remove = async (classification_id) => {
    const pool = await poolPromise;

    const recordToDelete = await getById(classification_id);
    if (!recordToDelete) return null;

    await pool.request()
        .input("classification_id", sql.Int, classification_id)
        .query(`
            DELETE FROM sg.financial_insurance_group_classifications
            WHERE classification_id = @classification_id
        `);
    return recordToDelete;
};