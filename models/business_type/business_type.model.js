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