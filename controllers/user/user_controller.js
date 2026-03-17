// user_controller.js
import * as User from '../../models/user/user_model.js';
import { tempPasswordTemplate } from '../../templates/tempPasswordTemplate.js';
import { otpTemplate } from '../../templates/otpTemplate.js';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,   
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    logger: true,    
    debug: true      
});

// Cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Helper: generate random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
    try {
        let {
            firstname,
            middlename,
            lastname,
            suffix,
            email,
            agent_code,
            role_id,
            department_id,
            location_id,
            phoneNumber
        } = req.body;

        // Validation is now handled by middleware
        agent_code = agent_code?.trim() || null;
        phoneNumber = phoneNumber?.trim() || null;
        role_id = role_id ? Number(role_id) : 1;
        department_id = department_id ? Number(department_id) : null;
        location_id = location_id ? Number(location_id) : null;

        // Check if email already exists
        const existing = await User.getUserByEmail(email);
        if (existing) {
            return res.status(400).json({
                status: false,
                message: "Email already registered."
            });
        }

        const newAgent = await User.createUser({
            firstname,
            middlename,
            lastname,
            suffix,
            email,
            agent_code,
            role_id,
            department_id,
            location_id,
            phoneNumber
        });

        await transporter.sendMail({
            from: `"Insurance System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your Temporary Password',
            html: tempPasswordTemplate(
                lastname,
                newAgent.tempPassword,
                process.env.APP_BASE_URL
            )
        });

        res.status(201).json({
            status: true,
            message: "User registered, temporary password sent via email"
        });

    } catch (err) {
        //console.error('REGISTRATION ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation is now handled by middleware
        // Fetch user from DB
        const user = await User.getUserByEmail(email);
        if (!user || !user.is_active) { // Check if user exists AND is active
            return res.status(401).json({
                status: false,
                message: "Invalid credentials or account is inactive."
            });
        }

        // Compare password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({
                status: false,
                message: "Invalid credentials"
            });
        }

        // Generate OTP and save to DB
        const otp = generateOTP();
        await User.saveOTP(user.user_id, otp);

        // Send OTP email
        await transporter.sendMail({
            from: `"Insurance System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Login OTP',
            html: otpTemplate(user.lastname, otp)
        });

        res.json({
            status: true,
            message: 'OTP sent to your email.',
            mustChangePassword: user.mustChangePassword // Indicates if user needs to change password
        });

    } catch (err) {
        console.error('LOGIN ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};


export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        // Validation is now handled by middleware
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found.'
        });

        const valid = await User.verifyOTP(user.user_id, otp);
        if (!valid) return res.status(401).json({
            status: false,
            message: 'Invalid or expired OTP.'
        });

        await User.clearOTP(user.user_id);

        const payload = { userId: user.user_id, email: user.email, role_id: user.role_id };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        // Calculate access token expiry
        const accessTokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

        // Save tokens to database
        await User.saveTokens(user.user_id, accessToken, refreshToken, accessTokenExpiry);

        // Set tokens in cookies
        res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 }); // 8 hours
        res.cookie('refreshToken', refreshToken, cookieOptions); // 7 days

        res.json({
            status: true,
            accessToken,
            refreshToken,
            user
        });

    } catch (err) {
        console.error('VERIFY OTP ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validation is now handled by middleware      
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found.'
        });

        // Check if user is already logged in (check cookies)
        const accessToken = req.cookies.accessToken;
        if (accessToken) {
            try {
                jwt.verify(accessToken, process.env.JWT_SECRET);
                return res.status(400).json({
                    status: false,
                    message: 'User is already logged in.'
                });
            } catch (err) {
                // Token is invalid/expired, proceed with resend
            }
        }

        const otp = generateOTP();
        await User.saveOTP(user.user_id, otp);

        await transporter.sendMail({
            from: `"Insurance System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Resent OTP',
            html: otpTemplate(user.lastname, otp)
        });

        res.json({
            status: true,
            message: 'OTP resent successfully.'
        });
    } catch (err) {
        console.error('RESEND OTP ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        // Validation is now handled by middleware
        await User.updatePassword(email, newPassword);
        res.json({
            status: true,
            message: 'Password updated successfully.'
        });
    } catch (err) {
        console.error('RESET PASSWORD ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const logout = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Validation is now handled by middleware
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found.'
        });
        
        // Clear tokens from database
        await User.clearTokens(user.user_id);
        
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        res.json({
            status: true,
            message: 'Logged out successfully.'
        })
    } catch (err) {
        console.error('LOGOUT ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        // Get refresh token from cookie or body
        const refreshTokenFromCookie = req.cookies.refreshToken;
        const refreshTokenFromBody = req.body.refreshToken;
        const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

        if (!refreshToken) {
            return res.status(401).json({
                status: false,
                message: 'Refresh token required'
            });
        }

        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.getUserByEmail(payload.email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found'
        });

        const newAccessToken = jwt.sign({
            userId: user.user_id,
            email: user.email
        }, 
            process.env.JWT_SECRET, {
            expiresIn: '8h'
        });

        // Calculate access token expiry
        const accessTokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

        // Update tokens in database
        await User.saveTokens(user.user_id, newAccessToken, refreshToken, accessTokenExpiry);

        // Set new access token in cookie
        res.cookie('accessToken', newAccessToken, { 
            ...cookieOptions, 
            maxAge: 8 * 60 * 60 * 1000 
        });

        res.json({
            status: true,
            accessToken: newAccessToken,
            user
        });
    } catch (err) {
        console.error('REFRESH TOKEN ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

// Update profile with temporary password
export const updateProfile = async (req, res) => {
    try {
        const { password, newPassword, firstname, middlename, lastname, suffix, phoneNumber } = req.body;

        // Get userId from accessToken (set by authenticate middleware)
        const userId = req.user.user_id;

        // Fetch user from DB
        const user = await User.getUserById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        // If newPassword is provided, require old password
        if (newPassword) {
            if (!password) {
                return res.status(400).json({ status: false, message: "Current password is required to change password" });
            }

            const valid = await bcrypt.compare(password, user.password_hash);
            if (!valid) {
                return res.status(401).json({ status: false, message: "Invalid current password" });
            }
        }

        // Update profile
        const updatedUser = await User.updateProfile(userId, {
            firstname,
            middlename,
            lastname,
            suffix,
            phoneNumber,
            newPassword
        });

        res.json({
            status: true,
            message: "Profile updated successfully",
            user: updatedUser
        });

    } catch (err) {
        console.error('UPDATE PROFILE ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};

export const adminUpdateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role_id, department_id, location_id } = req.body;

        // Prevent a super admin from modifying their own role/department/location via this route
        if (Number(req.user.user_id) === Number(userId)) {
            return res.status(403).json({ status: false, message: "Super admins cannot modify their own role, department, or location via this endpoint. Please use the standard profile update." });
        }

        // Check if user to be updated exists
        const userToUpdate = await User.getUserById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // The validation middleware has already checked if the IDs are valid.
        // Now, call a new model function to perform the update.
        const updatedUser = await User.adminUpdateUser(userId, {
            role_id,
            department_id,
            location_id
        });

        res.json({
            status: true,
            message: "User profile updated successfully by admin.",
            user: updatedUser
        });
    } catch (err) {
        console.error('ADMIN UPDATE USER ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};

export const deactivateAccount = async (req, res) => {
    try {
        // This should be an admin-only route.
        // The user ID to deactivate comes from the URL parameter.
        const { userId } = req.params;

        const userToDeactivate = await User.getUserById(userId);
        if (!userToDeactivate) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Deactivate the user by setting is_active to 0
        // This will also clear their tokens to force logout.
        await User.setUserStatus(userId, 0);

        res.status(200).json({ 
            status: true, 
            message: 'User account has been successfully deactivated.' 
        });

    } catch (err) {
        console.error('DEACTIVATE ACCOUNT ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};

export const activateAccount = async (req, res) => {
    try {
        // This should be an admin-only route.
        // The user ID to activate comes from the URL parameter.
        const { userId } = req.params;

        const userToActivate = await User.getUserById(userId);
        if (!userToActivate) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Activate the user by setting is_active to 1
        await User.setUserStatus(userId, 1);

        res.status(200).json({ 
            status: true, 
            message: 'User account has been successfully activated.' 
        });

    } catch (err) {
        console.error('ACTIVATE ACCOUNT ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};