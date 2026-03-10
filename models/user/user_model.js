import { sql, poolPromise } from "../../config/db.js";
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const createUser = async ({ firstname, middlename, lastname, suffix, email, agent_code, role_id, location_id, department_id, phoneNumber }) => {
    const pool = await poolPromise;
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await pool.request()
        .input('firstname', sql.VarChar, firstname)
        .input('middlename',sql.VarChar, middlename || null)
        .input('lastname', sql.VarChar, lastname)
        .input('suffix', sql.VarChar, suffix || null)
        .input('email', sql.VarChar, email)
        .input('agent_code', sql.VarChar, agent_code || null)
        .input('role_id', sql.Int, role_id || null)
        .input('location_id', sql.Int, location_id || null)
        .input('department_id', sql.Int, department_id || null)
        .input('phoneNumber', sql.VarChar, phoneNumber || null)
        .input('password_hash', sql.VarChar, hashedPassword)
        .input('mustChangePassword', sql.Bit,  1)
        .input('is_active', sql.Bit, 1) 
        .query(`
            INSERT INTO DHUB.sg.financial_insurance_users
            (firstname, middlename, lastname, suffix, email, agent_code, role_id, location_id, department_id, phoneNumber, password_hash, mustChangePassword, is_active)
            OUTPUT INSERTED.user_id AS userId
            VALUES (@firstname, @middlename, @lastname, @suffix, @email, @agent_code, @role_id, @location_id, @department_id, @phoneNumber, @password_hash, @mustChangePassword, @is_active)
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

export const getUserById = async (userId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
            SELECT u.*, r.name AS roleName, l.name AS locationName, d.name AS departmentName
            FROM DHUB.sg.financial_insurance_users u
            LEFT JOIN DHUB.sg.financial_insurance_system_lookups r ON r.id = u.role_id AND r.category = 'ROLE'
            LEFT JOIN DHUB.sg.financial_insurance_system_lookups l ON l.id = u.location_id AND l.category = 'LOCATION'
            LEFT JOIN DHUB.sg.financial_insurance_system_lookups d ON d.id = u.department_id AND d.category = 'DEPARTMENT'
            WHERE u.user_id = @userId
        `);
    return result.recordset[0];
}

// Check if agent_code already exists
export const getUserByAgentCode = async (agent_code) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('agent_code', sql.VarChar, agent_code)
        .query(`
            SELECT user_id, agent_code, email, firstname, lastname
            FROM DHUB.sg.financial_insurance_users
            WHERE agent_code = @agent_code
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

// Helper function to check if value is provided and not empty
const hasValue = (value) => value !== undefined && value !== null && value !== '';

export const updateProfile = async (userId, { firstname, middlename, lastname, suffix, phoneNumber, newPassword }) => {
    const pool = await poolPromise;
    
    // Get current user data
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    // If newPassword is provided, hash it; otherwise keep the existing password
    let hashedPassword = user.password_hash;
    let mustChangePasswordValue = user.mustChangePassword;
    
    if (newPassword) {
        hashedPassword = await bcrypt.hash(newPassword, 10);
        mustChangePasswordValue = 0; // User has changed their password
    }

    // For firstname and lastname: keep existing if not provided or empty
    // For other fields: allow empty string
    const updatedFirstname = hasValue(firstname) ? firstname : user.firstname;
    const updatedLastname = hasValue(lastname) ? lastname : user.lastname;
    const updatedMiddlename = middlename !== undefined ? middlename : user.middlename;
    const updatedSuffix = suffix !== undefined ? suffix : user.suffix;
    const updatedPhoneNumber = phoneNumber !== undefined ? phoneNumber : user.phoneNumber;

    await pool.request()
        .input('userId', sql.Int, userId)
        .input('firstname', sql.VarChar, updatedFirstname)
        .input('middlename', sql.VarChar, updatedMiddlename)
        .input('lastname', sql.VarChar, updatedLastname)
        .input('suffix', sql.VarChar, updatedSuffix)
        .input('phoneNumber', sql.VarChar, updatedPhoneNumber)
        .input('password_hash', sql.VarChar, hashedPassword)
        .input('mustChangePassword', sql.Bit, mustChangePasswordValue)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET firstname = @firstname,
                middlename = @middlename,
                lastname = @lastname,
                suffix = @suffix,
                phoneNumber = @phoneNumber,
                password_hash = @password_hash,
                mustChangePassword = @mustChangePassword
            WHERE user_id = @userId
        `);

    return await getUserById(userId);
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

export const getLookupListByCategory = async (category) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('category', sql.VarChar, category)
        .query(`
            SELECT id, name 
            FROM DHUB.sg.financial_insurance_system_lookups
            WHERE category = @category AND is_active = 1
        `);

    return result.recordset;
};

export const setUserStatus = async (userId, isActive) => {
    const pool = await poolPromise;
    await pool.request()
        .input('userId', sql.Int, userId)
        .input('isActive', sql.Bit, isActive)
        .query(`
            UPDATE DHUB.sg.financial_insurance_users
            SET is_active = @isActive
            WHERE user_id = @userId
        `);
    
    // If deactivating, also clear their tokens to force logout
    if (!isActive) {
        await clearTokens(userId);
    }
};