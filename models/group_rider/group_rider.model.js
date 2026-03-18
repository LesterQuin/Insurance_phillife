import { poolPromise, sql } from "../../config/db.js";

// GET ALL RIDERS (Joined with Basic Plan and Product)
export const getAllRiders = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`
            SELECT 
                r.rider_id,
                r.rider_name,
                r.acronym,
                r.product_id,
                p.product_name,
                r.input_type,
                r.min_amount,
                r.max_amount,
                r.unit_value,
                r.is_active,
                r.created_at,
                r.updated_at
            FROM [DHUB].[sg].[financial_insurance_riders] r
            LEFT JOIN [DHUB].[sg].[financial_insurance_product] p ON r.product_id = p.product_id
            WHERE r.is_active = 1
            ORDER BY p.product_name, r.rider_name
        `);
    return result.recordset;
};

// GET RIDERS BY PRODUCT NAME
export const getRidersByProductName = async (productName) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('productName', sql.VarChar, productName)
        .query(`
            SELECT 
                r.rider_id,
                r.rider_name,
                r.acronym,
                r.product_id,
                p.product_name,
                r.input_type,
                r.min_amount,
                r.max_amount,
                r.unit_value,
                r.is_active,
                r.created_at,
                r.updated_at
            FROM [DHUB].[sg].[financial_insurance_riders] r
            LEFT JOIN [DHUB].[sg].[financial_insurance_product] p 
                ON r.product_id = p.product_id
            WHERE (
                p.acronym LIKE '%' + @productName + '%'
                OR p.product_name LIKE '%' + @productName + '%'
            )
            AND r.is_active = 1
            ORDER BY r.rider_name
        `);
    return result.recordset;
};

// GET RIDERS BY PRODUCT ACRONYM
export const getRidersByProductAcronym = async (acronym) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('acronym', sql.VarChar, acronym)
        .query(`
            SELECT 
                r.rider_id,
                r.rider_name,
                r.acronym,
                r.product_id,
                p.product_name,
                p.acronym as product_acronym,
                r.input_type,
                r.min_amount,
                r.max_amount,
                r.unit_value,
                r.is_active,
                r.created_at,
                r.updated_at
            FROM [DHUB].[sg].[financial_insurance_riders] r
            LEFT JOIN [DHUB].[sg].[financial_insurance_product] p ON r.product_id = p.product_id
            WHERE LTRIM(RTRIM(p.acronym)) = LTRIM(RTRIM(@acronym)) AND r.is_active = 1
            ORDER BY r.rider_name
        `);
    return result.recordset;
};

// GET RIDER BY ID
export const getRiderById = async (id) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("id", sql.Int, id)
        .query(`
            SELECT 
                r.*,
                p.product_name
            FROM [DHUB].[sg].[financial_insurance_riders] r
            LEFT JOIN [DHUB].[sg].[financial_insurance_product] p ON r.product_id = p.product_id
            WHERE r.rider_id = @id
        `);
    return result.recordset[0];
};

// GET RIDER BY NAME (For duplicate check)
export const getRiderByName = async (name) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input("name", sql.VarChar, name)
        .query(`
            SELECT * FROM [DHUB].[sg].[financial_insurance_riders]
            WHERE rider_name = @name AND is_active = 1
        `);
    return result.recordset[0];
};

// NOTE: 'createRider', 'updateRider', and 'deleteRider' functions should be implemented 
// here as well to fully support the controller, using 'financial_insurance_rider' table.