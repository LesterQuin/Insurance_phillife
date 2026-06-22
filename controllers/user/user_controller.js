// user_controller.js
import * as User from '../../models/user/user_model.js';
import { tempPasswordTemplate } from '../../templates/tempPasswordTemplate.js';
import { otpTemplate } from '../../templates/otpTemplate.js';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { auditLog, AuditStatus, AuditActions } from '../../utils/logger.js';
import dns from 'node:dns';

// Fix for Node.js 18+ where IPv6 is prioritized over IPv4.
// This often causes "network_error" on servers that have IPv6 enabled but unconfigured.
dns.setDefaultResultOrder('ipv4first');

// Role Constants for Business Logic
const ROLE_CFE = 3;
const ROLE_SUPER_ADMIN = 15;

// If you do not have SSL configured yet or are behind an SSL-inspecting firewall, 
// this line allows Node.js to connect to Azure despite certificate validation issues.
// WARNING: Use this for testing only. Enable SSL for production.
// Remove this line and ensure your server can validate Azure's SSL certificate before going live.
if (process.env.NODE_ENV !== 'production') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded from an absolute path relative to the root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// More aggressive trimming to remove hidden characters/quotes from .env
const tenantId = process.env.AZURE_TENANT_ID?.replace(/['"]+/g, '').trim();
const clientId = process.env.AZURE_CLIENT_ID?.replace(/['"]+/g, '').trim();
const clientSecret = process.env.AZURE_CLIENT_SECRET?.replace(/['"]+/g, '').trim();

const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
);

const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ["https://graph.microsoft.com/.default"],
});

const graphClient = Client.initWithMiddleware({
    debugLogging: true,
    authProvider,
});

export const transporter = {
    sendMail: async (mailOptions) => {
        const message = {
            subject: mailOptions.subject,
            body: {
                contentType: "HTML",
                content: mailOptions.html,
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: mailOptions.to,
                    },
                },
            ],
        };

        if (mailOptions.from) {
            const fromMatch = mailOptions.from.match(/(.*)<(.*)>/);
            if (fromMatch && fromMatch[2]) {
                const name = fromMatch[1] ? fromMatch[1].replace(/"/g, '').trim() : undefined;
                const address = fromMatch[2].trim();

                message.from = {
                    emailAddress: {
                        name: name,
                        address: address
                    }
                };
            }
        }

        const sendMail = {
            message: message,
            saveToSentItems: "false",
        };

        // If on RDS/IIS, check if variables are actually present
        if (!tenantId || !clientId || !clientSecret) {
            throw new Error("Azure Configuration missing. Check .env variables.");
        }

        await graphClient.api(`/users/${process.env.SMTP_USER}/sendMail`)
            .post(sendMail);
    }
};

// Cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Helper: generate random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const getHierarchies = async (req, res) => {
    try {
        const [roles, departments, locations, superiors] = await Promise.all([
            User.getLookupListByCategory('ROLE'),
            User.getLookupListByCategory('DEPARTMENT'),
            User.getLookupListByCategory('LOCATION'),
            User.getPotentialSuperiors() // This should return users with roles like 'Team Leader'
        ]);

        return res.status(200).json({
            status: true,
            message: 'Registration hierarchies fetched successfully',
            data: {
                roles,
                departments,
                locations,
                superiors: superiors.map(s => ({
                    user_id: s.user_id,
                    full_name: `${s.firstname} ${s.lastname}`,
                    role: s.roleName
                }))
            }
        });
    } catch (err) {
        console.error('FETCH HIERARCHIES ERROR:', err);
        return res.status(500).json({
            status: false,
            message: 'Error fetching hierarchy data',
            error: err.message
        });
    }
};

export const getPotentialSuperiors = async (req, res) => {
    try {
        const superiors = await User.getPotentialSuperiors();

        return res.status(200).json({
            status: true,
            message: 'Potential superiors fetched successfully',
            data: superiors.map(s => ({
                user_id: s.user_id,
                full_name: `${s.firstname} ${s.lastname}`,
                role: s.roleName,
                department: s.departmentName
            }))
        });
    } catch (err) {
        console.error('FETCH POTENTIAL SUPERIORS ERROR:', err);
        return res.status(500).json({
            status: false,
            message: 'Error fetching potential superiors',
            error: err.message
        });
    }
};

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
            phoneNumber,
            reporting_to_id
        } = req.body;

        // Validation is now handled by middleware
        agent_code = agent_code?.trim() || null;
        phoneNumber = phoneNumber?.trim() || null;
        role_id = role_id ? Number(role_id) : 1;
        department_id = department_id ? Number(department_id) : null;
        location_id = location_id ? Number(location_id) : null;
        reporting_to_id = reporting_to_id ? Number(reporting_to_id) : null;

        if (role_id === ROLE_CFE && !reporting_to_id) {
            return res.status(400).json({
                status: false,
                message: "Corporate Financial Executives (CFE) must report to a designated head."
            });
        }

        if (role_id === ROLE_SUPER_ADMIN && reporting_to_id) {
            return res.status(400).json({
                status: false,
                message: "Super Admin accounts are top-level and cannot report to a designated head."
            });
        }

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
            phoneNumber,
            reporting_to_id
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

        await auditLog(req, {
            userId: newAgent.userId,
            entityId: newAgent.userId,
            action: AuditActions.USER_REGISTERED,
            entity: 'UserMgmt',
            metadata: { email, role_id, agent_code },
            status: AuditStatus.INFO
        });

        res.status(201).json({
            status: true,
            message: "User registered, temporary password sent via email"
        });

    } catch (err) {
        console.error('REGISTRATION ERROR:', err);
        // Deep extract the real error. MSAL Node often puts the actual socket error in 'errors[0]'
        const underlyingError = err.innerError || err.cause || (err.errors && err.errors[0]) || err;

        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message,
            details: err.code || 'Check outbound connectivity',
            innerError: underlyingError ? { message: underlyingError.message, code: underlyingError.code, name: underlyingError.name } : null,
            debug: !tenantId ? "Tenant ID is empty" : "Credentials present"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        await auditLog(req, {
            action: AuditActions.LOGIN_ATTEMPT,
            entity: 'Auth',
            metadata: { email },
            status: AuditStatus.INFO
        });

        // Validation is now handled by middleware
        // Fetch user from DB
        const user = await User.getUserByEmail(email);
        if (!user || !user.is_active) { // Check if user exists AND is active
            await auditLog(req, {
                userId: user?.user_id,
                entityId: user?.user_id,
                action: AuditActions.LOGIN_FAILED,
                entity: 'Auth',
                status: AuditStatus.WARNING,
                metadata: { email, reason: !user ? 'User not found' : 'Inactive account' }
            });
            return res.status(401).json({
                status: false,
                message: "Invalid credentials or account is inactive."
            });
        }

        // Compare password
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            await auditLog(req, {
                userId: user.user_id,
                entityId: user.user_id,
                action: AuditActions.LOGIN_FAILED,
                entity: 'Auth',
                status: AuditStatus.WARNING,
                metadata: { email, reason: 'Invalid password' }
            });
            return res.status(401).json({
                status: false,
                message: "Invalid credentials"
            });
        }

        // Check if an OTP was recently sent and is still valid (5-minute cooldown)
        if (user.mustVerifyOtp && user.otpExpiresAt && new Date() < new Date(user.otpExpiresAt)) {
            const remainingMs = new Date(user.otpExpiresAt) - new Date();
            const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

            await auditLog(req, {
                userId: user.user_id,
                entityId: user.user_id,
                action: AuditActions.LOGIN_FAILED,
                entity: 'Auth',
                metadata: { reason: 'Login OTP throttled (cooldown)', remainingMinutes },
                status: AuditStatus.CRITICAL
            });

            return res.status(429).json({
                status: false,
                message: `An OTP was recently sent. Please check your email or wait ${remainingMinutes} minute(s) before requesting a new one.`,
                mustChangePassword: user.mustChangePassword,
                otpCooldown: true
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

        await auditLog(req, {
            userId: user.user_id,
            entityId: user.user_id,
            action: AuditActions.OTP_SENT,
            entity: 'Auth'
        });

        res.json({
            status: true,
            message: 'OTP sent to your email.',
            mustChangePassword: user.mustChangePassword // Indicates if user needs to change password
        });

    } catch (err) {
        console.error('LOGIN ERROR:', err);
        const underlyingError = err.innerError || err.cause || (err.errors && err.errors[0]) || err;

        const user = await User.getUserByEmail(req.body.email);
        await auditLog(req, {
            userId: user?.user_id,
            entityId: user?.user_id,
            action: AuditActions.LOGIN_FAILED,
            entity: 'Auth',
            status: AuditStatus.ERROR,
            metadata: { error: err.message, email: req.body.email }
        });

        res.status(500).json({
            status: false,
            message: 'Server error',
            error: err.message,
            innerError: underlyingError ? { message: underlyingError.message, code: underlyingError.code, name: underlyingError.name } : null,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
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
        if (!valid) {
            await auditLog(req, {
                userId: user.user_id,
                entityId: user.user_id,
                action: AuditActions.LOGIN_FAILED,
                entity: 'Auth',
                status: AuditStatus.WARNING,
                metadata: { email, reason: 'Invalid OTP' }
            });
            return res.status(401).json({
                status: false,
                message: 'Invalid or expired OTP.'
            });
        }

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

        await auditLog(req, {
            userId: user.user_id,
            entityId: user.user_id,
            action: AuditActions.LOGIN_SUCCESS,
            entity: 'Auth'
        });

        res.json({
            status: true,
            accessToken,
            refreshToken,
            user
        });

    } catch (err) {
        console.error('VERIFY OTP ERROR:', err);
        const user = await User.getUserByEmail(req.body.email);
        await auditLog(req, {
            userId: user?.user_id,
            entityId: user?.user_id,
            action: AuditActions.LOGIN_FAILED,
            entity: 'Auth',
            status: AuditStatus.ERROR,
            metadata: { error: err.message, email: req.body.email }
        });

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

        // Check if the existing OTP is still valid
        if (user.mustVerifyOtp && user.otpExpiresAt && new Date() < new Date(user.otpExpiresAt)) {
            const remainingMs = new Date(user.otpExpiresAt) - new Date();
            const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

            await auditLog(req, {
                userId: user.user_id,
                entityId: user.user_id,
                action: AuditActions.LOGIN_FAILED,
                entity: 'Auth',
                metadata: { type: 'resend_throttled', remainingMinutes },
                status: AuditStatus.CRITICAL
            });

            return res.status(429).json({
                status: false,
                message: `Please wait ${remainingMinutes} minute(s) before requesting another OTP.`
            });
        }

        const otp = generateOTP();
        await User.saveOTP(user.user_id, otp);

        await transporter.sendMail({
            from: `"Insurance System" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Resent OTP',
            html: otpTemplate(user.lastname, otp)
        });

        await auditLog(req, {
            userId: user.user_id,
            entityId: user.user_id,
            action: AuditActions.OTP_SENT,
            entity: 'Auth',
            metadata: { type: 'resend' }
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

        const user = await User.getUserByEmail(email);
        await auditLog(req, {
            userId: user?.user_id,
            entityId: user?.user_id,
            action: AuditActions.PASSWORD_RESET,
            entity: 'Auth',
            metadata: { email }
        });

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
        
        await auditLog(req, {
            userId: user.user_id,
            entityId: user.user_id,
            action: AuditActions.LOGOUT,
            entity: 'Auth'
        });

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
            error: err.message,
            innerError: err.innerError || null
        });
    }
};

export const refreshToken = async (req, res) => {
    try {
        // Get refresh token from cookie or body
        const refreshTokenFromCookie = req.cookies.refreshToken;
        // const refreshTokenFromBody = req.body.refreshToken;
        const refreshToken = refreshTokenFromCookie;

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

        await auditLog(req, {
            userId: user.user_id,
            entityId: user.user_id,
            action: AuditActions.TOKEN_REFRESHED,
            entity: 'Auth'
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

        await auditLog(req, {
            userId: userId,
            entityId: userId,
            action: AuditActions.USER_UPDATED,
            entity: 'UserMgmt',
            metadata: { fields: Object.keys(req.body).filter(key => key  !== 'password' && key !== 'newPassword') }
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
        const { role_id, department_id, location_id, reporting_to_id } = req.body;

        // Prevent a super admin from modifying their own role/department/location via this route
        if (Number(req.user.user_id) === Number(userId)) {
            return res.status(403).json({ status: false, message: "Super admins cannot modify their own role, department, or location via this endpoint. Please use the standard profile update." });
        }

        // Check if user to be updated exists
        const userToUpdate = await User.getUserById(userId);
        if (!userToUpdate) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Apply hierarchy business logic
        if (role_id === ROLE_CFE && !reporting_to_id) {
            return res.status(400).json({
                status: false,
                message: "Corporate Financial Executives (CFE) must report to a designated head."
            });
        }

        if (role_id === ROLE_SUPER_ADMIN && reporting_to_id) {
            return res.status(400).json({
                status: false,
                message: "Super Admin accounts cannot report to a designated head."
            });
        }

        // The validation middleware has already checked if the IDs are valid.
        // Now, call a new model function to perform the update.
        const updatedUser = await User.adminUpdateUser(userId, {
            role_id,
            department_id,
            location_id,
            reporting_to_id
        });

        await auditLog(req, {
            userId: req.user.user_id,
            action: AuditActions.USER_UPDATED,
            entity: 'UserMgmt',
            entityId: userId,
            metadata: { role_id, department_id, location_id, reporting_to_id }
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

        await auditLog(req, {
            userId: req.user.user_id,
            action: AuditActions.USER_DEACTIVATED,
            entity: 'UserMgmt',
            entityId: userId,
            status: AuditStatus.WARNING
        });

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

        await auditLog(req, {
            userId: req.user.user_id,
            action: AuditActions.USER_UPDATED,
            entity: 'UserMgmt',
            entityId: userId,
            metadata: { status: 'activated' }
        });

        res.status(200).json({ 
            status: true, 
            message: 'User account has been successfully activated.' 
        });

    } catch (err) {
        console.error('ACTIVATE ACCOUNT ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.getAllUsers();

        // Exclude sensitive information from the response for all users
        const safeUsers = users.map(user => {
            const { 
                password_hash, otp, otp_expires_at, temp_password, otpCode, otpExpiresAt,
                role_id, role_name, 
                department_id, department_name, 
                location_id, location_name,
                reporting_to_id, reporting_to_name,
                ...rest 
            } = user;
            return {
                ...rest,
                role: { id: role_id, name: role_name },
                department: { id: department_id, name: department_name },
                location: { id: location_id, name: location_name },
                reporting_to: reporting_to_id ? { id: reporting_to_id, name: reporting_to_name } : null
            };
        });

        res.status(200).json({
            status: true,
            message: 'Users fetched successfully.',
            data: safeUsers
        });
    } catch (err) {
        console.error('GET ALL USERS ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.getUserById(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: 'User not found.' });
        }

        // Exclude sensitive information from the response
        const { 
            password_hash, otp, otp_expires_at, temp_password, otpCode, otpExpiresAt,
            role_id, roleName,
            department_id, departmentName, departmentCode,
            location_id, locationName,
            reporting_to_id, reportingToName,
            ...rest 
        } = user;

        res.status(200).json({
            status: true,
            user: {
                ...rest,
                role: { id: role_id, name: roleName },
                department: { id: department_id, name: departmentName, code: departmentCode },
                location: { id: location_id, name: locationName },
                reporting_to: reporting_to_id ? { id: reporting_to_id, name: reportingToName } : null
            }
        });

    } catch (err) {
        console.error('GET USER BY ID ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};

export const adminResetPassword = async (req, res) => {
    try {
        const { userId } = req.params;

        const targetUser = await User.getUserById(userId);
        if (!targetUser) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        // Generate a random 8-character temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Update the user's password using the admin reset method
        await User.adminResetPassword(targetUser.email, hashedPassword);

        // Send the plain-text temporary password via email
        await transporter.sendMail({
            from: `"Insurance System" <${process.env.SMTP_USER}>`,
            to: targetUser.email,
            subject: 'Administrative Password Reset',
            html: tempPasswordTemplate(targetUser.lastname, tempPassword, process.env.APP_BASE_URL)
        });

        await auditLog(req, {
            userId: req.user.user_id,
            action: AuditActions.PASSWORD_RESET,
            entity: 'UserMgmt',
            entityId: userId,
            status: AuditStatus.WARNING
        });

        res.json({
            status: true,
            message: `Password reset successful. A temporary password has been sent to ${targetUser.email}.`
        });
    } catch (err) {
        console.error('ADMIN RESET PASSWORD ERROR:', err);
        res.status(500).json({ status: false, message: 'Server error', error: err.message });
    }
};
