import express from 'express';
import * as Controller from '../../controllers/user/user_controller.js'

const router = express.Router();

router.post('/register', Controller.register);
router.post('/login', Controller.login);
router.post('/verify-otp', Controller.verifyOTP);
router.post('/resend-otp', Controller.resendOTP);
router.post('/reset-password', Controller.resetPassword);
router.post('/logout', Controller.logout);
router.post('/refresh-token', Controller.refreshToken);

export default router;