import rateLimit from 'express-rate-limit';
import { auditLog, AuditStatus, AuditActions } from '../utils/logger.js';

export const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 requests per window
    keyGenerator: (req) => {
        // Use email as the key if available, otherwise fallback to IP
        // This makes the rate limit "per account" instead of "per IP"
        return req.body?.email || req.ip;
    },
    handler: async (req, res, next, options) => {
        await auditLog(req, {
            action: AuditActions.LOGIN_FAILED,
            entity: 'Auth',
            metadata: { 
                reason: 'IP Rate limit exceeded (10 min block)', 
                message: options.message.message,
                email: req.body?.email 
            },
            status: AuditStatus.CRITICAL
        });

        res.status(options.statusCode).send(options.message);
    },

    message: { 
        status: false, 
        message: "Too many attempts, please try again after 10 minutes" 
    }
});