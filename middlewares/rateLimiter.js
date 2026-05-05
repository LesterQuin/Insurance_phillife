import rateLimit from 'express-rate-limit';
import { auditLog, AuditStatus, AuditActions } from '../utils/logger.js';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per window
    handler: async (req, res, next, options) => {
        await auditLog(req, {
            action: AuditActions.LOGIN_FAILED,
            entity: 'Auth',
            metadata: { 
                reason: 'IP Rate limit exceeded (15 min block)', 
                message: options.message.message,
                email: req.body?.email 
            },
            status: AuditStatus.CRITICAL
        });
        res.status(options.statusCode).send(options.message);
    },
    message: { status: false, message: "Too many attempts, please try again after 15 minutes" }
});