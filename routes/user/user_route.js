import express from 'express';
import * as Controller from '../../controllers/user/user_controller.js';
import { authenticate, isSuperAdmin } from '../../middlewares/authenticate.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { 
    validateRegister, 
    validateLogin, 
    validateVerifyOTP, 
    validateResendOTP, 
    validateResetPassword, 
    validateLogout,
    validateAdminUpdateUser, 
    validateAdminIT,
    validateUpdateProfile 
} from '../../middlewares/validate.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, validateRegister, Controller.register);
router.post('/login', authLimiter, validateLogin, Controller.login);
router.post('/verify-otp', authLimiter, validateVerifyOTP, Controller.verifyOTP);
router.post('/resend-otp', authLimiter, validateResendOTP, Controller.resendOTP);
router.post('/reset-password', validateResetPassword, Controller.resetPassword);
router.post('/logout', validateLogout, Controller.logout);
router.post('/refresh-token', Controller.refreshToken);
router.put('/update-profile', authenticate, validateUpdateProfile, Controller.updateProfile);

// super admin routes for user management
router.put('/admin/update-user/:userId', authenticate, validateAdminIT, validateAdminUpdateUser, Controller.adminUpdateUser);
router.post('/admin/reset-password/:userId', authenticate, validateAdminIT, Controller.adminResetPassword);
router.put('/deactivate/:userId', authenticate, validateAdminIT, Controller.deactivateAccount);
router.put('/activate/:userId', authenticate, validateAdminIT, Controller.activateAccount);

// Super admin routes to view users
router.get('/', authenticate, isSuperAdmin, Controller.getAllUsers);
router.get('/:userId', authenticate, isSuperAdmin, Controller.getUserById);

export default router;
