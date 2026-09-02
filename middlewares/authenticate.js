import jwt from 'jsonwebtoken';
import * as User from '../models/user/user_model.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ status: false, message: 'Access token missing' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.getUserById(payload.userId);
        if (!user) return res.status(404).json({ status: false, message: 'User not found' });

        req.user = user;
        next();
    } catch (err) {
        console.error('AUTH ERROR:', err);
        return res.status(401).json({ status: false, message: 'Invalid token' });
    }
};

export const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.roleName === 'Super Admin') {
        next();
    } else {
        return res.status(403).json({ status: false, message: 'Forbidden: Super Admin access required.' });
    }
};

export const isMarketing = (req, res, next) => {
    const allowedRoles = [
        'Group Sales & Marketing Head',
        'Team Leader',
        'Corporate Financial Executive',
        'Marketing Officer',
        'Marketing Assistant',
        'Assistant Vice President',
        'Super Admin'
    ];
    if (req.user && allowedRoles.includes(req.user.roleName)) {
        next();
    } else {
        return res.status(403).json({ status: false, message: 'Forbidden: Marketing or Sales access required.' });
    }
};

export const isCFE = (req, res, next) => {
    const allowedRoles = ['Corporate Financial Executive', 'Super Admin'];
    if (req.user && allowedRoles.includes(req.user.roleName)) {
        next();
    } else {
        return res.status(403).json({ status: false, message: 'Forbidden: Corporate Financial Executive access required.' });
    }
};

export const isActuarial = (req, res, next) => {
    const DEPT_ACTUARIAL_ID = 18;
    if (req.user && (Number(req.user.department_id) === DEPT_ACTUARIAL_ID || req.user.roleName === 'Super Admin')) {
        next();
    } else {
        return res.status(403).json({ status: false, message: 'Forbidden: Actuarial department access required.' });
    }
};

export const isEbam = (req, res, next) => {
    const DEPT_EBAM_ID = 20;
    if (req.user && (Number(req.user.department_id) === DEPT_EBAM_ID || req.user.roleName === 'Super Admin')) {
        next();
    } else {
        return res.status(403).json({ status: false, message: 'Forbidden: EBAM department access required.' });
    }
};
