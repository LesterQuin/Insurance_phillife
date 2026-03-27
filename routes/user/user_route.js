import express from 'express';
import * as Controller from '../../controllers/user/user_controller.js';
import { authenticate, isSuperAdmin } from '../../middlewares/authenticate.js';
import { 
    validateRegister, 
    validateLogin, 
    validateVerifyOTP, 
    validateResendOTP, 
    validateResetPassword, 
    validateLogout,
    validateAdminUpdateUser, 
    validateRefreshToken,
    validateUpdateProfile 
} from '../../middlewares/validate.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, Controller.register);
router.post('/login', validateLogin, Controller.login);
router.post('/verify-otp', validateVerifyOTP, Controller.verifyOTP);
router.post('/resend-otp', validateResendOTP, Controller.resendOTP);
router.post('/reset-password', validateResetPassword, Controller.resetPassword);
router.post('/logout', validateLogout, Controller.logout);
router.post('/refresh-token', Controller.refreshToken);
router.put('/update-profile', authenticate, validateUpdateProfile, Controller.updateProfile);

// super admin routes for user management
router.put('/admin/update-user/:userId', authenticate, isSuperAdmin, validateAdminUpdateUser, Controller.adminUpdateUser);
router.put('/deactivate/:userId', authenticate, isSuperAdmin, Controller.deactivateAccount);
router.put('/activate/:userId', authenticate, isSuperAdmin, Controller.activateAccount);

// Super admin routes to view users
router.get('/', authenticate, isSuperAdmin, Controller.getAllUsers);
router.get('/:userId', authenticate, isSuperAdmin, Controller.getUserById);

export default router;
