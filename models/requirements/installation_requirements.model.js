import { poolPromise, sql } from '../../config/db.js';

// Helper to log application actions
const logApplicationAction = async (transaction, { applicationId, userId, actionType, changes, ipAddress }) => {
    const request = new sql.Request(transaction);
    await request
        .input('application_id', sql.Int, applicationId)
        .input('user_id', sql.Int, userId)
        .input('action_type', sql.NVarChar, actionType)
        .input('changes', sql.NVarChar(sql.MAX), JSON.stringify(changes))
        .input('ip_address', sql.NVarChar, ipAddress || null)
        .query(`
            INSERT INTO IAF.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
            VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
        `);
};

// New method to handle separate requirements table
export const upsertInstallationRequirements = async (applicationId, data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const request = new sql.Request(transaction);
        
        const columns = Object.keys(data);
        const updateClauses = columns.map(col => `${col} = @${col}`).join(', ');
        
        request.input('application_id', sql.Int, applicationId);
        columns.forEach(col => {
            // Simplified mapping; you can refine types if needed
            const type = col === 'booking_date' ? sql.DateTime : sql.NVarChar(sql.MAX);
            request.input(col, type, data[col]);
        });

        // SQL Server Merge (Upsert) logic
        await request.query(`
            IF EXISTS (SELECT 1 FROM IAF.sg.financial_insurance_installation_requirements WHERE application_id = @application_id)
            BEGIN
                UPDATE IAF.sg.financial_insurance_installation_requirements
                SET ${updateClauses}, updated_at = GETDATE()
                WHERE application_id = @application_id;
            END
            ELSE
            BEGIN
                INSERT INTO IAF.sg.financial_insurance_installation_requirements (application_id, ${columns.join(', ')})
                VALUES (@application_id, ${columns.map(c => `@${c}`).join(', ')});
            END
        `);

        await logApplicationAction(transaction, {
            applicationId,
            userId,
            actionType: 'UPDATE_REQUIREMENTS',
            changes: data
        });

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};