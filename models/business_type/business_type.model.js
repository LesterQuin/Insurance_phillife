import { poolPromise, sql} from "../../config/db.js"

// CREATE 
export const create = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            INSERT INTO sg.financial_insurance_business_types (name)
            OUTPUT INSERTED.*
            VALUES (@name)
        `);
    return result.recordset[0];
};

// GET BY NAME
export const getByName = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`SELECT * FROM sg.financial_insurance_business_types WHERE LOWER(name) = LOWER(@name)`);
    return result.recordset[0];
};

// GET ALL
export const getAll = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT *
            FROM sg.financial_insurance_business_types
            ORDER BY business_type_id
        `);
    return result.recordset;
}

// GET by ID
export const getById = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT *
            FROM sg.financial_insurance_business_types
            WHERE business_type_id = @id
        `);
    return result.recordset[0];
};

// UPDATE
export const update = async (id, name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("id", sql.Int, id)
        .input("name", sql. VarChar, name)
        .query(`
            UPDATE sg.financial_insurance_business_types
            SET name = @name
            OUTPUT INSERTED.*
            WHERE business_type_id = @id
        `);
    return result.recordset[0];
};

// DELETE
export const remove = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            DELETE FROM sg.financial_insurance_business_types
            OUTPUT DELETED.*
            WHERE business_type_id = @id
        `);
    return result.recordset[0];
};