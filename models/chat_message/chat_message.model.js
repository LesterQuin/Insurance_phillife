import { poolPromise, sql } from '../../config/db.js';

export const getCommentsByApplicationId = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('applicationId', sql.Int, applicationId)
        .query(`
            SELECT 
                c.comment_id,
                c.application_id,
                c.user_id,
                c.comment_text,
                c.attachment_path,
                c.attachment_name,
                c.created_at,
                c.updated_at,
                c.is_deleted,
                c.deleted_at,
                u.firstname + ISNULL(' ' + NULLIF(u.middlename, '') + '.', '') + ' ' + u.lastname AS commenter_name,
                d.name AS department_name,
                r.name AS role_name
            FROM IAF.sg.financial_insurance_application_comments c
            JOIN IAF.sg.financial_insurance_users u ON c.user_id = u.user_id
            LEFT JOIN IAF.sg.financial_insurance_system_lookups d ON u.department_id = d.id AND d.category = 'DEPARTMENT'
            LEFT JOIN IAF.sg.financial_insurance_system_lookups r ON u.role_id = r.id AND r.category = 'ROLE'
            WHERE c.application_id = @applicationId
        `);
    return result.recordset;
};

export const isUserAuthorizedToView = async (applicationId, userId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('applicationId', sql.Int, applicationId)
        .input('userId', sql.Int, userId)
        .query(`
            SELECT TOP 1 1 as authorized
            FROM IAF.sg.financial_insurance_application a
            WHERE a.application_id = @applicationId 
                AND (
                    a.user_id = @userId 
                    OR EXISTS (
                        SELECT 1 FROM IAF.sg.financial_insurance_application_comments 
                        WHERE application_id = @applicationId AND user_id = @userId
                    )
                )
        `);
    return result.recordset.length > 0;
};

export const createComment = async (data) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('applicationId', sql.Int, data.application_id)
        .input('userId', sql.Int, data.user_id)
        .input('commentText', sql.NVarChar(sql.MAX), data.comment_text || null)
        .input('attachmentPath', sql.NVarChar(500), data.attachment_path || null)
        .input('attachmentName', sql.NVarChar(255), data.attachment_name || null)
        .query(`
            INSERT INTO IAF.sg.financial_insurance_application_comments (application_id, user_id, comment_text, attachment_path, attachment_name)
            VALUES (@applicationId, @userId, @commentText, @attachmentPath, @attachmentName);
            SELECT SCOPE_IDENTITY() AS comment_id;
        `);
    return result.recordset[0];
};

export const getCommentById = async (commentId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('commentId', sql.Int, commentId)
        .query(`
            SELECT 
                c.*, 
                u.firstname + ISNULL(' ' + NULLIF(u.middlename, '') + '.', '') + ' ' + u.lastname AS commenter_name,
                d.name AS department_name,
                r.name AS role_name
            FROM IAF.sg.financial_insurance_application_comments c
            JOIN IAF.sg.financial_insurance_users u ON c.user_id = u.user_id
            LEFT JOIN IAF.sg.financial_insurance_system_lookups d ON u.department_id = d.id AND d.category = 'DEPARTMENT'
            LEFT JOIN IAF.sg.financial_insurance_system_lookups r ON u.role_id = r.id AND r.category = 'ROLE'
            WHERE c.comment_id = @commentId AND (c.is_deleted = 0 OR c.is_deleted IS NULL)
        `);
    return result.recordset[0];
};

export const updateComment = async (commentId, text) => {
    const pool = await poolPromise;
    await pool.request()
        .input('commentId', sql.Int, commentId)
        .input('commentText', sql.NVarChar(sql.MAX), text)
        .query(`
            UPDATE IAF.sg.financial_insurance_application_comments 
            SET comment_text = @commentText, updated_at = GETDATE()
            WHERE comment_id = @commentId AND (is_deleted = 0 OR is_deleted IS NULL)
        `);
    return getCommentById(commentId);
};

export const deleteComment = async (commentId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('commentId', sql.Int, commentId)
        .query(`
            UPDATE IAF.sg.financial_insurance_application_comments 
            SET is_deleted = 1, deleted_at = GETDATE() 
            WHERE comment_id = @commentId
        `);
    return result.rowsAffected[0] > 0;
};
