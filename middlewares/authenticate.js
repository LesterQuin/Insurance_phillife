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
