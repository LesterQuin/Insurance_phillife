import * as User from '../../models/user/user_model.js';
import { tempPasswordTemplate } from '../../templates/tempPasswordTemplate.js';
import { otpTemplate } from '../../templates/otpTemplate.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
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

// Helper: generate random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req, res) => {
    try {
        let {
            firstname,
            middlename,
            lastname,
            email,
            agent_code,
            role_id,        // ← add this
            department_id,
            location_id,
            phoneNumber
        } = req.body;

        agent_code = agent_code?.trim() || null;
        phoneNumber = phoneNumber?.trim() || null;
        role_id = role_id ? Number(role_id) : 1;       // default role
        department_id = department_id ? Number(department_id) : null;
        location_id = location_id ? Number(location_id) : null;

        if (!firstname || !lastname || !email || !role_id) {
            return res.status(400).json({
                status: false,
                message: "Missing required fields"
            });
        }

        const emailRegex = /^[\w.-]+@(gmail\.com|yahoo\.com|phillifeassurance\.onmicrosoft\.com)$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Invalid domain address"
            });
        }

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
            email,
            agent_code,
            role_id,        // ← now included
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
        console.error('REGISTRATION ERROR:', err);
        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, newPassword } = req.body;

        // 1️⃣ Check required fields
        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: "Email and password required."
            });
        }

        // 2️⃣ Fetch user from DB
        const user = await User.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                status: false,
                message: "Invalid credentials"
            });
        }

        // 3️⃣ Compare password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({
                status: false,
                message: "Invalid credentials"
            });
        }

        // 4️⃣ Handle first-time login / mustChangePassword
        if (user.mustChangePassword) {
            if (!newPassword) {
                return res.status(403).json({
                    status: false,
                    message: "Password change required."
                });
            }
            // Update password
            await User.updatePassword(email, newPassword);
        }

        // 5️⃣ Generate OTP and save to DB
        const otp = generateOTP();
        await User.saveOTP(user.user_id, otp);

        // 6️⃣ Send OTP email
        await transporter.sendMail({
            from: `"Insurance System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Login OTP',
            html: otpTemplate(user.lastname, otp)
        });

        // 7️⃣ Return response
        res.json({
            status: true,
            message: 'OTP sent to your email.'
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
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found.'
        });

        const valid = await User.verifyOTP(user.user_id, otp); // fixed typo here
        if (!valid) return res.status(401).json({
            status: false,
            message: 'Invalid or expired OTP.'
        });

        await User.clearOTP(user.user_id);

        const payload = { userId: user.user_id, email: user.email, role_id: user.role_id };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        const accessTokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000); // fixed DataTransfer → Date

        await User.saveTokens(user.user_id, accessToken, refreshToken, accessTokenExpiry);

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
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found.'
        });

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
        const user = await User.getUserByEmail(email);
        if (!user) return res.status(404).json({
            status: false,
            message: 'User not found.'
        });
        await User.clearTokens(user.user_id);
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
        const { refreshToken } = req.body;
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
            process.env.JWT_SECRET,{
            expiresIn: '8h'
        });
        const accessTokenExpiry = new Date(Date.now() + 8 * 60 * 60 * 1000);

        await User.saveTokens(
            user.user_id,
            newAccessToken,
            refreshToken,
            accessTokenExpiry
        );

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
}