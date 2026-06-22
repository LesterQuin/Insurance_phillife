import { poolPromise, sql } from '../config/db.js';

export const AuditStatus = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR',
    CRITICAL: 'CRITICAL'
};

export const AuditActions = {
    LOGIN_ATTEMPT: "LOGIN_ATTEMPT",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    OTP_SENT: "OTP_SENT",
    OTP_VERIFIED: "OTP_VERIFIED",
    PASSWORD_RESET: "PASSWORD_RESET",
    USER_REGISTERED: "USER_REGISTERED",
    USER_UPDATED: "USER_UPDATED",
    USER_DEACTIVATED: "USER_DEACTIVATED",
    LOGOUT: "LOGOUT",
    CREATE_APPLICATION: "CREATE_APPLICATION",
    UPDATE_APPLICATION: "UPDATE_APPLICATION",
    UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS"
};

export const normalizeIp = (ip) => {
    if (!ip) return null;
    if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
    if (ip === '::1') return '127.0.0.1';
    return ip;
};

export const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];

    const ip =
        forwarded ? forwarded.split(',')[0].trim() :
        req.socket?.remoteAddress ||
        req.ip;

    return normalizeIp(ip);
};

const sanitizeMetadata = (metadata = {}) => {
    const blacklist = [
        'password',
        'newPassword',
        'confirmPassword',
        'token',
        'accessToken',
        'refreshToken'
    ];

    const safe = { ...metadata };

    blacklist.forEach(key => {
        delete safe[key];
    });

    return safe;
};

export const auditLog = async (req, {
    userId = null,
    action,
    entity = null,
    entityId = null,
    metadata = {},
    status = AuditStatus.INFO
}) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('user_id', sql.BigInt, userId ?? req.user?.user_id ?? null)
            .input('action', sql.NVarChar(100), action)
            .input('entity', sql.NVarChar(100), entity)
            .input('entity_id', sql.NVarChar(100), entityId ? String(entityId) : null)
            .input('metadata', sql.NVarChar(sql.MAX), JSON.stringify(sanitizeMetadata(metadata)))
            .input('ip_address', sql.NVarChar(50), getClientIp(req))
            .input('user_agent', sql.NVarChar(255), req.headers['user-agent']?.substring(0, 255))
            .input('status', sql.NVarChar(20), status)
            .query(`
                INSERT INTO [DHUB_UAT].[sg].[financial_insurance_audit_logs]
                (user_id, action, entity, entity_id, metadata, ip_address, user_agent, status)
                VALUES
                (@user_id, @action, @entity, @entity_id, @metadata, @ip_address, @user_agent, @status)
            `);

        // Samples to handle specific status triggers
        if (status === AuditStatus.CRITICAL) {
            console.error(`
                🚨 [SECURITY CRITICAL]: Action ${action} performed on ${entity} by User ${userId ?? 'Anonymous'}`
            );
        } else if (status === AuditStatus.ERROR) {
            console.warn(`
                ⚠️ [SYSTEM ERROR]: ${action} failed. Check metadata for details.`
            );
        }
    } catch (err) {
        console.error('[AUDIT FAILURE]:', err.message);
    }
};