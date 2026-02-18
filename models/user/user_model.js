import { sql, poolPromise } from "../../config/db.js";
import bcrypt from "bcryptjs";
import crypto from 'crypto';

export const createUser = async ({ firstname, middlename, lastname, email, agent_code, role_id, location_id, department_id, phoneNumber }) => {
    const pool = await poolPromise;
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await pool.request()
        .input('firstname', sql.VarChar, firstname)
        .input('middlename',sql.VarChar, middlename || null)
        .input('lastname', sql.VarChar, lastname)
        .input('email', sql.VarChar, email)
        .input('agent_code', sql.VarChar, agent_code || null)
        .input('role_id', sql.Int, role_id || null)
        .input('location_id', sql.Int, location_id || null)
        .input('department_id', sql.Int, department_id || null)
        .input('phoneNumber', sql.VarChar, phoneNumber || null)
        .input('password_hash', sql.VarChar, hashedPassword)
        .input('mustChangePassword', sql.Bit,  1)
        .query(`
            INSERT INTO DHUB.sg.financial_insurance_users
            (firstname, middlename, lastname, email, agent_code, role_id, location_id, department_id, phoneNumber, password_hash, mustChangePassword)
            OUTPUT INSERTED.user_id AS userId
            VALUES (@firstname, @middlename, @lastname, @email, @agent_code, @role_id, @location_id, @department_id, @phoneNumber, @password_hash, @mustChangePassword)
        `);

    return { ...result.recordset[0], tempPassword}
}

export const getUserByEmail = async (email) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('email', sql.VarChar, email)
        .query(`
            SELECT u.*, r.name AS roleName, l.name AS locationName, d.name AS departmentName
            FROM DHUB.sg.financial_insurance_users u
            LEFT JOIN DHUB.sg.financial_insurance_system_lookups r ON r.id = u.role_id AND r.category = 'ROLE'
            LEFT JOIN DHUB.sg.financial_insurance_system_lookups l ON l.id = u.location_id AND l.category = 'LOCATION'
            LEFT JOIN DHUB.sg.financial_insurance_system_lookups d ON d.id = u.department_id AND d.category = 'DEPARTMENT'
            WHERE u.email = @email
        `);
    return result.recordset[0];
}

export const updatePassword = async (email, newPassword) => {
    const pool = await poolPromise;
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.request()
        .input('email', sql.VarChar, email)
        .input('password_hash', sql.VarChar, hashed)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET password_hash = @password_hash, mustChangePassword = 0
            WHERE email = @email
        `);
}

export const saveOTP = async (userId, otp) => {
    const pool = await poolPromise;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await pool.request()
        .input('userId', sql.Int, userId)
        .input('otp', sql.Char(6), otp)
        .input('expiresAt', sql.DateTime, expiresAt)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET otpCode = @otp, otpExpiresAt = @expiresAt, mustVerifyOtp = 1
            WHERE user_id = @userId
        `);
}

export const verifyOTP = async (userId, otp) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('otp', sql.Char(6), otp)
        .query(`
            SELECT otpExpiresAt
            FROM DHUB.sg.financial_insurance_users
            WHERE user_id = @userId AND otpCode = @otp AND mustVerifyOtp = 1
        `);

    if (!result.recordset.length) return false;
    return new Date() <= result.recordset[0].otpExpiresAt;
};


export const clearOTP = async (userId) => {
    const pool = await poolPromise;
    await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET mustVerifyOtp = 0, otpCode = NULL, otpExpiresAt = NULL
            WHERE user_id = @userId
        `);
}

export const saveTokens = async (userId, accessToken, refreshToken, accessTokenExpiry) => {
    const pool = await poolPromise;
    await pool.request()
        .input('userId', sql.Int, userId)
        .input('accessToken', sql.VarChar, accessToken)
        .input('refreshToken', sql.VarChar, refreshToken)
        .input('accessTokenExpiry', sql.DateTime, accessTokenExpiry)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET accessToken = @accessToken,
                refreshToken = @refreshToken,
                tokenExpiresAt = @accessTokenExpiry
            WHERE user_id = @userId
        `);
}

export const clearTokens = async (userId) => {
    const pool = await poolPromise;
    await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET accessToken = NULL, refreshToken = NULL, tokenExpiresAt = NULL
            WHERE user_id = @userId
        `);
}

// Fetch valid IDs from lookup table based on category
export const getValidLookupIds = async (category) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.VarChar, category)
        .query(`
            SELECT id FROM DHUB.sg.financial_insurance_system_lookups
            WHERE category = @category AND is_active = 1
        `);
    return result.recordset.map(row => row.id);
}
