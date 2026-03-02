import express from 'express';
import * as Controller from '../../controllers/user/user_controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { 
    validateRegister, 
    validateLogin, 
    validateVerifyOTP, 
    validateResendOTP, 
    validateResetPassword, 
    validateLogout, 
    validateRefreshToken,
    validateUpdateProfile 
} from '../../middlewares/validate.js';

const router = express.Router();

router.post('/register', validateRegister, Controller.register);
router.post('/login', validateLogin, Controller.login);
router.post('/verify-otp', validateVerifyOTP, Controller.verifyOTP);
router.post('/resend-otp', validateResendOTP, Controller.resendOTP);
router.post('/reset-password', validateResetPassword, Controller.resetPassword);
router.post('/logout', validateLogout, Controller.logout);
router.post('/refresh-token', validateRefreshToken, Controller.refreshToken);
router.put('/update-profile', authenticate, validateUpdateProfile, Controller.updateProfile);

export default router;
