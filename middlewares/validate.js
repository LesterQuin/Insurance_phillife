// validate.js
import validator from 'express-validator';
const { body, param, validationResult } = validator;
import * as User from '../models/user/user_model.js';
import * as Financial from '../models/financial_Insurance_form.model.js'

// -----------------------------
// User validation
// -----------------------------
export const validateApplication = [
    body('group_name').notEmpty().withMessage('Group Name is required'),
    body('business_nature').notEmpty().withMessage('Business Nature is required'),
    body('number_of_lives').isInt({ min: 1 }).withMessage('Number of lives must be at least 1'),
    body('business_address').notEmpty().withMessage('Business Address is required'),
    body('contact_number').notEmpty().withMessage('Contact Number is required'),
    body('email').isEmail().withMessage('Valid Email is required'),
    body('contact_person').notEmpty().withMessage('Contact Person is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        next();
    }
];

// Validation for fetching application history (Restricted to Super Admin or IT)
export const validateGetHistory = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });

        const requester = req.user;
        const isSuperAdmin = requester && (requester.role_id === 1 || requester.roleName === 'Super Admin');
        const isITDepartment = requester && (requester.departmentName === 'IT' || requester.departmentCode === 'IT');

        if (!isSuperAdmin && !isITDepartment) {
            return res.status(403).json({
                status: false,
                message: "Unauthorized. Only SuperAdmins or IT department personnel can view application history logs."
            });
        }
        next();
    }
];

// Validation for user registration
export const validateRegister = [
    body('firstname')
        .notEmpty().withMessage('First name is required')
        .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters')
        .trim().escape(),
    body('middlename')
        .optional()
        .isLength({ max: 100 }).withMessage('Middle name must not exceed 100 characters')
        .trim().escape(),
    body('lastname')
        .notEmpty().withMessage('Last name is required')
        .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters')
        .trim().escape(),
    body('suffix')
        .optional()
        .isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters')
        .trim().escape(),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .matches(/^[\w.-]+@(gmail\.com|yahoo\.com|phillifeassurance\.onmicrosoft\.com|phillife\.com\.ph)$/i)
        .withMessage('Email must be from allowed domain (gmail.com, yahoo.com, phillifeassurance.onmicrosoft.com, phillife.com.ph)'),
    body('phoneNumber')
        .optional()
        .matches(/^(\+63|0)[0-9]{10}$/).withMessage('Phone number must be 10-15 digits'),
    body('agent_code')
        .optional()
        .isLength({ max: 50 }).withMessage('Agent code must not exceed 50 characters'),
    body('role_id')
    .notEmpty().withMessage('Role ID is required')
    .isInt({ min: 0 }).withMessage('Role ID must be a non-negative integer')
    .custom(async (value) => {
        const roles = await User.getLookupListByCategory('ROLE');
        const validIds = roles.map(r => r.id);
        if (!validIds.includes(Number(value))) {
            const roleList = roles.map(r => `${r.id} - ${r.name}`).join(', ');
            throw new Error(
                `Invalid role_id (${value}). Please select one of the following: ${roleList}`
            );
        }
        return true;
    }),
    body('department_id')
    .optional()
    .isInt({ min: 0 }).withMessage('Department ID must be a non-negative integer')
    .custom(async (value) => {
        const departments = await User.getLookupListByCategory('DEPARTMENT');
        const validIds = departments.map(d => d.id);
        if (!validIds.includes(Number(value))) {
            const deptList = departments.map(d => `${d.id} - ${d.name}`).join(', ');
            throw new Error(
                `Invalid department_id (${value}). Please select one of the following: ${deptList}`
            );
        }
        return true;
    }),
    body('location_id')
    .optional()
    .isInt({ min: 0 }).withMessage('Location ID must be a non-negative integer')
    .custom(async (value) => {
        const locations = await User.getLookupListByCategory('LOCATION');
        const validIds = locations.map(l => l.id);
        if (!validIds.includes(Number(value))) {
            const locationList = locations.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(
                `Invalid location_id (${value}). Please select one of the following: ${locationList}`
            );
        }
        return true;
    }),
    async (req, res, next) => {
        try {
            const { agent_code } = req.body;
            
            if (agent_code && agent_code.trim()) {
                const existingUser = await User.getUserByAgentCode(agent_code.trim());
                
                if (existingUser) {
                    return res.status(400).json({
                        status: false,
                        message: "Agent code already exists. Please use a different agent code."
                    });
                }
                
                req.body.agent_code = agent_code.trim();
            }
            
            next();
        } catch (error) {
            console.error('Agent code validation error:', error);
            res.status(500).json({ 
                status: false, 
                message: 'Error validating agent code',
                error: error.message 
            });
        }
    },
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for user login
export const validateLogin = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('password')
        .notEmpty().withMessage('Password is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for OTP verification
export const validateVerifyOTP = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('otp')
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 characters')
        .isNumeric().withMessage('OTP must be numeric'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for resend OTP
export const validateResendOTP = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for password reset
export const validateResetPassword = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for logout
export const validateLogout = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for token refresh
export const validateRefreshToken = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for update profile
export const validateUpdateProfile = [
    body('firstname')
        .optional()
        .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters')
        .trim().escape(),
    body('middlename')
        .optional()
        .isLength({ max: 100 }).withMessage('Middle name must not exceed 100 characters')
        .trim().escape(),
    body('lastname')
        .optional()
        .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters')
        .trim().escape(),
    body('suffix')
        .optional()
        .isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters')
        .trim().escape(),
    body('phoneNumber')
        .optional()
        .matches(/^(\+63|0)[0-9]{10}$/).withMessage('Phone number must be 10-15 digits'),
    body('newPassword')
        .optional()
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for administrative actions (Super Admin or IT)
export const validateAdminIT = [
    param('userId').isInt({ min: 1 }).withMessage('Valid User ID is required'),
    async (req, res, next) => {
        try {
            const requester = req.user;
            
            // Check if user is Super Admin (Role ID 1) or in the IT Department
            const isSuperAdmin = requester && (requester.role_id === 1 || requester.roleName === 'Super Admin');
            const isITDepartment = requester && (requester.departmentName === 'IT' || requester.departmentCode === 'IT');

            if (!isSuperAdmin && !isITDepartment) {
                return res.status(403).json({
                    status: false,
                    message: "Unauthorized. Only SuperAdmins or IT department personnel can perform this action."
                });
            }
            next();
        } catch (error) {
            console.error('Admin reset validation error:', error);
            res.status(500).json({ status: false, message: 'Error checking permissions' });
        }
    },
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// Validation for admin updating user credentials
export const validateAdminUpdateUser = [
    body('role_id')
        .optional()
        .isInt({ min: 0 }).withMessage('Role ID must be a non-negative integer')
        .custom(async (value) => {
            const roles = await User.getLookupListByCategory('ROLE');
            const validIds = roles.map(r => r.id);
            if (!validIds.includes(Number(value))) {
                const roleList = roles.map(r => `${r.id} - ${r.name}`).join(', ');
                throw new Error(
                    `Invalid role_id (${value}). Please select one of the following: ${roleList}`
                );
            }
            return true;
        }),
    body('department_id')
        .optional()
        .isInt({ min: 0 }).withMessage('Department ID must be a non-negative integer')
        .custom(async (value) => {
            const departments = await User.getLookupListByCategory('DEPARTMENT');
            const validIds = departments.map(d => d.id);
            if (!validIds.includes(Number(value))) {
                const deptList = departments.map(d => `${d.id} - ${d.name}`).join(', ');
                throw new Error(
                    `Invalid department_id (${value}). Please select one of the following: ${deptList}`
                );
            }
            return true;
        }),
    body('location_id')
        .optional()
        .isInt({ min: 0 }).withMessage('Location ID must be a non-negative integer')
        .custom(async (value) => {
            const locations = await User.getLookupListByCategory('LOCATION');
            const validIds = locations.map(l => l.id);
            if (!validIds.includes(Number(value))) {
                const locationList = locations.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(
                    `Invalid location_id (${value}). Please select one of the following: ${locationList}`
                );
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Form validation
// -----------------------------
export const validateFinancialApplication = [
    body('group_name')
        .notEmpty().withMessage('Group Name is required')
        .isLength({ max: 255 }).withMessage('Group Name must not exceed 255 characters'),
    body('business_nature')
        .notEmpty().withMessage('Business Nature is required')
        .isLength({ max: 255 }).withMessage('Business Nature must not exceed 255 characters'),
    body('number_of_lives')
        .notEmpty().withMessage('Number of lives is required')
        .isInt({ min: 1 }).withMessage('Number of lives must be at least 1'),
    body('business_address')
        .notEmpty().withMessage('Business Address is required')
        .isLength({ max: 500 }).withMessage('Business Address must not exceed 500 characters'),
    body('contact_number')
        .notEmpty().withMessage('Contact Number is required')
        .isLength({ max: 20 }).withMessage('Contact Number must not exceed 20 characters'),
    body('fax_number')
        .notEmpty().withMessage('Fax Number is required')
        .isLength({ max: 20 }).withMessage('Fax Number must not exceed 20 characters'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Valid Email is required'),
    body('contact_person_salutation')
        .notEmpty().withMessage('Contact Person Salutation is required')
        .isLength({ max: 20 }).withMessage('Salutation must not exceed 20 characters'),
    body('contact_person_firstname')
        .notEmpty().withMessage('Contact Person First Name is required')
        .isLength({ max: 100 }).withMessage('First Name must not exceed 100 characters'),
    body('contact_person_mi')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 5 }).withMessage('Middle Initial must not exceed 5 characters'),
    body('contact_person_lastname')
        .notEmpty().withMessage('Contact Person Last Name is required')
        .isLength({ max: 100 }).withMessage('Last Name must not exceed 100 characters'),
    body('designation')
        .notEmpty().withMessage('Designation is required')
        .isLength({ max: 255 }).withMessage('Designation must not exceed 255 characters'),
    body('proposal_addressee')
        .notEmpty().withMessage('Proposal Addressee is required')
        .isLength({ max: 255 }).withMessage('Proposal Addressee must not exceed 255 characters'),
    body('addressee_designation')
        .notEmpty().withMessage('Addressee Designation is required')
        .isLength({ max: 255 }).withMessage('Addressee Designation must not exceed 255 characters'),
    
    // -----------------------------
    // Group Classification
    // -----------------------------
    body('group_classification_id')
        .notEmpty().withMessage('Group Classification is required')
        .isInt({ min: 0 }).withMessage('group_classification_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.GROUP_CLASSIFICATION) {
                req.lookupCache.GROUP_CLASSIFICATION = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
            }
            const lookups = req.lookupCache.GROUP_CLASSIFICATION;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid group_classification_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('other_group_classification')
        .optional().isLength({ max: 255 }).withMessage('other_group_classification must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const id = req.body.group_classification_id;
            if (!id) return true; 

            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.GROUP_CLASSIFICATION) {
                req.lookupCache.GROUP_CLASSIFICATION = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
            }
            const lookups = req.lookupCache.GROUP_CLASSIFICATION;
            const selected = lookups.find(l => l.id === Number(id));

            if (!selected) return true;

            const isOther = selected.name === 'Others' || selected.name === 'Other';

            if (isOther && (!value || value.trim() === '')) {
                throw new Error('other_group_classification is required when "Others" is selected.');
            }

            if (!isOther && value) {
                throw new Error(`other_group_classification must be empty when Group Classification is not "Others".`);
            }
            return true;
        }),

    // -----------------------------
    // Business Type
    // -----------------------------
    body('business_type_id')
        .notEmpty().withMessage('Business Type is required')
        .isInt({ min: 0 }).withMessage('business_type_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.BUSINESS_TYPE) {
                req.lookupCache.BUSINESS_TYPE = await Financial.getLookupListByCategory('BUSINESS_TYPE');
            }
            const lookups = req.lookupCache.BUSINESS_TYPE;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid business_type_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('other_business_type')
        .optional().isLength({ max: 255 }).withMessage('other_business_type must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const id = req.body.business_type_id;
            if (!id) return true;

            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.BUSINESS_TYPE) {
                req.lookupCache.BUSINESS_TYPE = await Financial.getLookupListByCategory('BUSINESS_TYPE');
            }
            const lookups = req.lookupCache.BUSINESS_TYPE;
            const selected = lookups.find(l => l.id === Number(id));

            if (!selected) return true;

            const isOther = selected.name === 'Others' || selected.name === 'Other';

            if (isOther && (!value || value.trim() === '')) {
                throw new Error('other_business_type is required when "Other" is selected.');
            }

            if (!isOther && value) {
                throw new Error(`other_business_type must be empty when Business Type is not "Other".`);
            }
            return true;
        }),
    // -----------------------------
    // Type of Group
    // -----------------------------
    body('group_type_id')
        .notEmpty().withMessage('Group Type is required')
        .isInt({ min: 0 }).withMessage('group_type_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.TYPE_OF_GROUP) {
                req.lookupCache.TYPE_OF_GROUP = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
            }
            const lookups = req.lookupCache.TYPE_OF_GROUP;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid group_type_id (${value}). Valid options: ${validOptions}`);
            }
            
            req.body.group_type_name = item.name;
            return true;
        }),
    body('sub_group_type_id')
        .custom(async (value, { req }) => {
            const groupTypeId = Number(req.body.group_type_id);
            const subGroupTypeId = value;
    
            if (!groupTypeId) {
                return true; 
            }
    
            // Fetch lookups if not already cached on the request
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.TYPE_OF_GROUP) {
                req.lookupCache.TYPE_OF_GROUP = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
            }
            const lookups = req.lookupCache.TYPE_OF_GROUP;
            const groupTypeItem = lookups.find(l => l.id === groupTypeId);
    
            // Handle 'Other' Group Type
            if (groupTypeItem && (groupTypeItem.name === 'Other' || groupTypeItem.name === 'Others')) {
                if (subGroupTypeId != null) {
                    throw new Error('sub_group_type_id must be null when Group Type is "Other". Use other_group_type instead.');
                }
                return true;
            }
    
            // Find valid subgroups for the selected Group Type
            const validSubgroups = lookups.filter(l => Number(l.parent_id) === groupTypeId);
    
            // If subgroups exist, sub_group_type_id is required and must be valid
            if (validSubgroups.length > 0) {
                if (subGroupTypeId == null) {
                    const validOptions = validSubgroups.map(sg => `${sg.id} (${sg.name})`).join(', ');
                    throw new Error(`sub_group_type_id is required for Group Type '${groupTypeItem.name}'. Valid options: ${validOptions}`);
                }

                if (Array.isArray(subGroupTypeId)) {
                    if (groupTypeId !== 11) { 
                        throw new Error(`Group Type '${groupTypeItem.name}' only allows a single sub-group selection.`);
                    }
                }
    
                // Validate the provided ID(s)
                const idsToCheck = Array.isArray(subGroupTypeId) ? subGroupTypeId : [subGroupTypeId];
                const invalidIds = idsToCheck.filter(id => !validSubgroups.some(sg => sg.id === Number(id)));
    
                if (invalidIds.length > 0) {
                    const validOptions = validSubgroups.map(sg => `${sg.id} (${sg.name})`).join(', ');
                    throw new Error(`Invalid sub_group_type_id(s): ${invalidIds.join(', ')}. Valid options for '${groupTypeItem.name}': ${validOptions}`);
                }
            } else if (subGroupTypeId != null) {
                throw new Error(`sub_group_type_id must be null as Group Type '${groupTypeItem.name}' has no sub-groups.`);
            }
    
            return true;
        }),
    body('other_group_type')
        .optional().isLength({ max: 255 }).withMessage('other_group_type must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const id = req.body.group_type_id;
            if (!id) return true;

            const lookups = req.lookupCache.TYPE_OF_GROUP || await Financial.getLookupListByCategory('TYPE_OF_GROUP');
            const selected = lookups.find(l => l.id === Number(id));

            if (!selected) return true;

            const isOther = selected.name === 'Others' || selected.name === 'Other';

            if (isOther && (!value || value.trim() === '')) {
                throw new Error('other_group_type is required when "Other" is selected.');
            }

            if (!isOther && value) {
                throw new Error(`other_group_type must be empty when Group Type is not "Other".`);
            }
            return true;
        }),

    // -----------------------------
    // Age Profile (Employee Census)
    // -----------------------------
    body('minimum_age')
        .notEmpty().withMessage('Minimum Age is required')
        .isInt({ min: 18, max: 64 }).withMessage('Minimum Age must be 18 '),
    body('maximum_age')
        .notEmpty().withMessage('Maximum Age is required')
        .isInt({ min: 18, max: 64 }).withMessage('Maximum Age must be 64 ')
        .custom(async (value, { req }) => {
            const minAge = Number(req.body.minimum_age);
            const maxAge = Number(value);
            if (minAge && maxAge && maxAge < minAge) {
                throw new Error('Maximum Age must be greater than or equal to Minimum Age');
            }
            return true;
        }),

    // -----------------------------
    // Mode of Payment
    // -----------------------------
    body('payment_mode_id')
        .notEmpty().withMessage('Payment Mode is required')
        .isInt({ min: 0 }).withMessage('payment_mode_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.MODE_OF_PAYMENT) {
                req.lookupCache.MODE_OF_PAYMENT = await Financial.getLookupListByCategory('MODE_OF_PAYMENT');
            }
            const lookups = req.lookupCache.MODE_OF_PAYMENT;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid payment_mode_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),

    // -----------------------------
    // Type of Proposal
    // -----------------------------
    body('type_of_proposal_id')
        .notEmpty().withMessage('Type of Proposal is required')
        .isInt({ min: 0 }).withMessage('type_of_proposal_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.TYPE_OF_PROPOSAL) {
                req.lookupCache.TYPE_OF_PROPOSAL = await Financial.getLookupListByCategory('TYPE_OF_PROPOSAL');
            }
            const lookups = req.lookupCache.TYPE_OF_PROPOSAL;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid type_of_proposal_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),

    // -----------------------------
    // Channel Type
    // -----------------------------
    body('channel_type_id')
        .notEmpty().withMessage('Channel Type is required')
        .isInt({ min: 1 }).withMessage('channel_type_id must be a valid integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.CHANNEL_TYPE) {
                req.lookupCache.CHANNEL_TYPE = await Financial.getLookupListByCategory('CHANNEL_TYPE');
            }
            const lookups = req.lookupCache.CHANNEL_TYPE;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} (${l.name})`).join(', ');
                throw new Error(`Invalid channel_type_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('channel_name')
        .if(body('channel_type_id').custom(val => [56, 57].includes(Number(val))))
        .notEmpty().withMessage('Channel name is required for Booker and General Agency.')
        .isLength({ max: 255 }).withMessage('Channel name must not exceed 255 characters'),

    // body('commission_rate')
    //     .notEmpty().withMessage('Commission Rate is required')
    //     .isLength({ max: 255 }).withMessage('Commission Rate must not exceed 255 characters'),
    // body('service_fee')
    //     .notEmpty().withMessage('Service Fee is required')
    //     .isLength({ max: 255 }).withMessage('Service Fee must not exceed 255 characters'),

    // ------------------------------------------
    // Prototype / Product Plan (Conditional)
    // ------------------------------------------
    body('prototype_id')
        .if(body('type_of_proposal_id').equals('30')) // If it's a Prototype
        .notEmpty().withMessage('Prototype Plan selection is required for a Prototype proposal.')
        .isInt({ min: 1 }).withMessage('prototype_id must be a valid ID.')
        .custom(async (value) => {
            const prototypes = await Financial.getPrototypePlans();
            if (!prototypes.some(p => p.id === Number(value))) {
                const validOptions = prototypes.map(p => `${p.id} - ${p.name}`).join(', ');
                throw new Error(`Invalid prototype_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),

    body('plan_id')
        .if(body('type_of_proposal_id').equals('30')) // If it's a Prototype
        .custom((value) => {
            if (value != null) {
                throw new Error('plan_id must not be provided for Prototype proposals.');
            }
            return true;
        }),

    body('prototype_id')
        .if(body('type_of_proposal_id').equals('31')) // If it's Customize
        .custom((value) => {
            if (value != null) {
                throw new Error('prototype_id must not be provided for Customize proposals.');
            }
            return true;
        }),

    body('plan_id')
        .if(body('type_of_proposal_id').equals('31'))
        .notEmpty().withMessage('Plan is required for a Customize proposal.')
        .isInt({ min: 0 }).withMessage('plan_id must be a non-negative integer')
        .custom(async (value) => {
            const plans = await Financial.getAllPlans();
            if (!plans.some(p => p.plan_id === Number(value))) {
                const validOptions = plans.map(p => `${p.plan_id} - ${p.plan_name}`).join(', ');
                throw new Error(`Invalid plan_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
body('basic_plan_id')
        .if(body('type_of_proposal_id').equals('31'))
        .notEmpty().withMessage('Basic Plan is required for a Customize proposal.')
        .isInt({ min: 0 }).withMessage('basic_plan_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (Array.isArray(value)) {
                throw new Error('Only select one');
            }
            
            const planId = Number(req.body.plan_id);
            if (!planId) throw new Error('plan_id is required to validate basic_plan_id');

            const basics = await Financial.getBasicPlansByPlanId(planId);
            if (!basics.some(b => b.basic_plan_id === Number(value))) {
                const validOptions = basics.map(b => `${b.basic_plan_id} - ${b.basic_plan_name}`).join(', ');
                throw new Error(`Invalid basic_plan_id (${value}) for plan_id (${planId}). Valid options: ${validOptions || 'none available'}`);
            }
            return true;
        }),
    body('riders')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isArray().withMessage('riders must be an array of objects')
        .custom(async (riders, { req }) => {
            if (!riders || riders.length === 0) return true;
            
            const planId = Number(req.body.plan_id);
            if (!planId) return true; // Let other validators handle missing plan_id

            const coverageTypeId = Number(req.body.coverage_type_id);

            // GYRT (Plan ID 2) Specific Validations
            if (planId === 2) {
                // Mutual Exclusivity for Accidental Death/Disability Riders (Select 1 out of 4)
                const accidentRiderIds = [2, 3, 4, 5];
                const selectedAccidentRiders = riders.filter(r => accidentRiderIds.includes(Number(r.rider_id)));
                if (selectedAccidentRiders.length > 1) {
                    throw new Error('Select only 1 out of the 4 Group Accidental Death Benefit/Disability Riders.');
                }
            }

            // --- Validation for Level/Salary Ranking Riders (Mapped by Designation) ---
            if ((planId === 2 || planId === 3) && (coverageTypeId === 32 || coverageTypeId === 34)) {
                let designations = [];
                if (coverageTypeId === 32 && req.body.level_ranking) {
                    designations = req.body.level_ranking.map(r => r.designation);
                } else if (coverageTypeId === 34 && req.body.salary_ranking) {
                    designations = req.body.salary_ranking.map(r => r.designation);
                }

                for (const rider of riders) {
                    if (!rider.values || !Array.isArray(rider.values)) {
                        throw new Error(`Rider ${rider.rider_id} must have a 'values' array for ranking-based coverage.`);
                    }
                    
                    // If exactly one value is provided, we assume it applies to all designations (broadcast).
                    // Only check for missing designations if multiple values are provided.
                    if (rider.values.length !== 1) {
                        const riderDesignations = rider.values.map(v => v.designation);
                        const missingDesignations = designations.filter(d => !riderDesignations.includes(d));
                        if (missingDesignations.length > 0) {
                            throw new Error(`Rider ${rider.rider_id} is missing values for designations: ${missingDesignations.join(', ')}`);
                        }
                    }

                    // Validate amounts inside the mapped values
                    for (const val of rider.values) {
                        if (planId === 2) { // GYRT specific checks
                            const rId = Number(rider.rider_id);
                            const amount = val.amount != null ? Number(val.amount) : 0;
                            const unit = val.unit != null ? Number(val.unit) : 0;

                            if (rId === 8 && (amount < 100 || amount > 300)) throw new Error('Group Hospital Income Rider amount must be between 100 and 300 for all ranks.');
                            if (rId === 9 && amount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500 for all ranks.');
                            if (rId === 11 && amount !== 50000) throw new Error('Burial (Memorial/Service) amount must be fixed at 50,000 for all ranks.');
                            if (rId === 13 && ![1, 2].includes(unit)) throw new Error('Group Dengue Rider must be 1 or 2 Units for all ranks.');
                            if ([6, 7, 10, 12].includes(rId) && amount <= 0) throw new Error(`Rider ${rId} requires a valid positive amount for all ranks.`);
                        }
                    }
                }
                return true;
            }

            // --- General Validation for Non-Ranking Riders ---
            const validRiders = await Financial.getRidersByProductId(planId);
            
            for (const rider of riders) {
                const riderId = Number(rider.rider_id);
                const amount = rider.amount !== undefined && rider.amount !== null ? Number(rider.amount) : 0;
                const unit = rider.unit !== undefined && rider.unit !== null ? Number(rider.unit) : 0;
                const riderDef = validRiders.find(r => r.rider_id === riderId);
                
                if (riderDef) {
                    // GYRT (Plan 2) Specific Validations based on IDs
                    if (planId === 2) {
                        if (riderId === 8) { // Group Hospital Income Rider
                            if (amount < 100 || amount > 300) throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
                        } else if (riderId === 9) { // Group Accidental Medical Expense Reimbursement Rider
                            if (amount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
                        } else if (riderId === 11) { // Burial (Memorial/Service)
                            if (amount !== 50000) throw new Error('Burial (Memorial/Service) amount must be fixed at 50,000.');
                        } else if (riderId === 13) { // Group Dengue Rider
                            if (![1, 2].includes(unit)) throw new Error('Group Dengue Rider must be 1 Unit (30,000) or 2 Units (60,000).');
                        } else if ([6, 7, 10, 12].includes(riderId)) { // Valid Amount Required for these riders
                            if (amount <= 0) throw new Error(`${riderDef.rider_name} requires a valid amount.`);
                        }
                    } else {
                        // General Validation for other plans (fallback to name checks if ID not specific)
                        const name = riderDef.rider_name.trim();
                        if (name === 'Group Accidental Medical Expense Reimbursement Rider' && amount < 500) {
                            throw new Error(`${name} amount must be least 500 minimum.`);
                        } else if (name === 'Group Hospital Income Rider' && (amount < 100 || amount > 300)) {
                            throw new Error(`${name} amount must be between 100 and 300.`);
                        } else if (name === 'Burial (Memorial/Service)' && amount !== 50000) {
                            throw new Error(`${name} amount must be fixed at 50,000.`);
                        }
                    }
                }
            }
            return true;
        }),
    body('riders.*.rider_id')
        .exists().withMessage('rider_id is required for each rider')
        .if(body('type_of_proposal_id').equals('31'))
        .isInt({ min: 0 }).withMessage('rider_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            const planId = Number(req.body.plan_id);
            if (!planId) return true; 

            const validRiders = await Financial.getRidersByProductId(planId);
            if (!validRiders.some(v => v.rider_id === Number(value))) {
                const validOptions = validRiders.map(r => `${r.rider_id} - ${r.rider_name}`).join(', ');
                throw new Error(`Invalid rider_id (${value}) for plan_id (${planId}). Valid options: ${validOptions || 'none available'}`);
            }
            return true;
        }),
    body('riders.*.amount').if(body('type_of_proposal_id').equals('31')).optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Rider amount must be a non-negative number'),
    body('riders.*.unit').if(body('type_of_proposal_id').equals('31')).optional({ nullable: true }).isInt({ min: 0 }).withMessage('Rider unit must be a non-negative integer'),

    // Single Rate for Borrowers
    body('borrower_age_66_70')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isBoolean().withMessage('Borrower age 66-70 selection must be a boolean (true/false)'),
    body('borrower_age_71_75')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isBoolean().withMessage('Borrower age 71-75 selection must be a boolean (true/false)'),
    body('borrower_age_76_80')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isBoolean().withMessage('Borrower age 76-80 selection must be a boolean (true/false)'),

    // Optional validation for new product-specific fields
    body('amount_loans_id')
        .if(body('type_of_proposal_id').equals('31'))
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('Amount Loans ID must be a non-negative integer')
        .custom(async (value) => {
            if (value === null || value === undefined) return true;
            const lookups = await Financial.getLookupListByCategory('LOAN_AMOUNT_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid amount_loans_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('loans_amount').if(body('type_of_proposal_id').equals('31')).optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Loans Amount must be a non-negative number'),
    body('payment')
        .if(body('plan_id').equals('1'))
        .notEmpty().withMessage('Payment terms are required for GCLI plan.')
        .isArray({ min: 1, max: 1 }).withMessage('Payment must be an array with exactly one term.'),
    body('payment.*.payment_term_id')
        .if(body('plan_id').equals('1'))
        .notEmpty().withMessage('payment_term_id is required for each payment term.')
        .isInt({ min: 0 }).withMessage('payment_term_id must be a non-negative integer.')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('PAYMENT_TERM');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid payment_term_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('payment.*.sub_payment_term_id')
        .if(body('plan_id').equals('1'))
        .custom(async (value, { req, path }) => {
            // Get the index of the current payment object
            const index = path.match(/\[(\d+)\]/)[1];
            const paymentTermId = Number(req.body.payment[index].payment_term_id);

            if ([41, 42, 43].includes(paymentTermId)) { // Single Pay, Annual, or Monthly
                if (value == null) {
                    throw new Error('sub_payment_term_id is required when Payment Term is Single Pay, Annual, or Monthly.');
                }
                if (isNaN(Number(value)) || Number(value) < 0) {
                    throw new Error('sub_payment_term_id must be a non-negative integer.');
                }
                const lookups = await Financial.getLookupListByCategory('PAYMENT_YEAR');
                const selectableYears = lookups.filter(l => l.parent_id === 44);
                if (!selectableYears.some(l => l.id === Number(value))) {
                    const validOptions = selectableYears.map(l => `${l.id} - ${l.name}`).join(', ');
                    throw new Error(`Invalid sub_payment_term_id (${value}). Valid options: ${validOptions}`);
                }
            } else if (value != null) {
                throw new Error('sub_payment_term_id must be null for this payment term.');
            }
            return true;
        }),
    body('coverage_type_id')
        .if(body('type_of_proposal_id').equals('31'))
        .optional({ nullable: true })
        .isInt({ min: 0 }).withMessage('Coverage Type ID must be a non-negative integer')
        .custom(async (value) => {
            if (value === null || value === undefined) return true;
            const lookups = await Financial.getLookupListByCategory('COVERAGE_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid coverage_type_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('uniform_coverage_amount')
        .if(body('type_of_proposal_id').equals('31'))
        .custom((value, { req }) => {
            const planId = Number(req.body.plan_id);
            const coverageTypeId = Number(req.body.coverage_type_id);

            if (planId === 2 || planId === 3) {
                if (coverageTypeId === 33) { 
                    if (value == null) {
                        throw new Error('Uniform Coverage Amount is required and cannot be null for this coverage type.');
                    }
                    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                        throw new Error('Uniform Coverage Amount must be a non-negative decimal.');
                    }
                } else if (coverageTypeId === 32 && value != null) { 
                    throw new Error('Uniform Coverage Amount must be null when Level Ranking is selected.');
                }
            }
            return true;
        }),
    body('level_ranking')
        .if(body('type_of_proposal_id').equals('31'))
        .custom((value, { req }) => {
            if (value != null && !Array.isArray(value)) {
                throw new Error('Level Ranking must be an array.');
            }
            const planId = Number(req.body.plan_id);
            const coverageTypeId = Number(req.body.coverage_type_id);

            if (planId === 2 || planId === 3) {
                if (coverageTypeId === 32) { 
                    if (value == null || value.length < 2) {
                        throw new Error('Level Ranking is required for this coverage type and must have at least 2 entries.');
                    }
                    if (value.length > 10) {
                        throw new Error('Level Ranking cannot have more than 10 entries.');
                    }
                } else if (value != null && value.length > 0) { 
                    throw new Error('Level Ranking must be null and only be provided for the "Level Ranking" coverage type.');
                }
            }
            return true;
        }),
    body('level_ranking.*.designation').if(body('type_of_proposal_id').equals('31')).if(body('level_ranking').exists()).notEmpty().withMessage('Designation is required in Level Ranking'),
    body('level_ranking.*.amount').if(body('type_of_proposal_id').equals('31')).if(body('level_ranking').exists()).isFloat({ min: 0 }).withMessage('Amount must be a non-negative decimal in Level Ranking'),
    body('salary_ranking')
        .if(body('type_of_proposal_id').equals('31'))
        .custom((value, { req }) => {
            if (value != null && !Array.isArray(value)) {
                throw new Error('Salary Ranking must be an array.');
            }
            const planId = Number(req.body.plan_id);
            const coverageTypeId = Number(req.body.coverage_type_id);

            if (planId === 2 || planId === 3) {
                if (coverageTypeId === 34) { // By Salary Rank
                    if (value == null || value.length < 2) {
                        throw new Error('Salary Ranking is required and must have at least 2 entries.');
                    }
                    // if (value.length > 4) {
                    //     throw new Error('Salary Ranking cannot have more than 4 entries.');
                    // }
                } else if (value != null) { 
                    throw new Error('Salary Ranking should only be provided for By Salary Rank coverage type.');
                }
            }
            return true;
        }),
    body('salary_ranking.*.salary_multiplier')
        .if(body('type_of_proposal_id').equals('31'))
        .if(body('salary_ranking').exists())
        .notEmpty().withMessage('Salary Multiplier is required in Salary Ranking')
        .custom((value) => {
            const numericValue = parseInt(String(value).replace(/x/i, ''), 10);
            if (isNaN(numericValue) || numericValue < 12 || numericValue > 48) {
                throw new Error('Salary Multiplier must be a number between 12 and 48 (e.g., 12, 15, 18, 24).');
            }
            return true;
        }),
    body('salary_ranking.*.designation').if(body('type_of_proposal_id').equals('31')).if(body('salary_ranking').exists()).notEmpty().withMessage('Designation is required in Salary Ranking'),
    body('salary_ranking.*.amount').if(body('type_of_proposal_id').equals('31')).if(body('salary_ranking').exists()).isFloat({ min: 0 }).withMessage('Amount must be a non-negative number in Salary Ranking'),

    // Optional status
    body('status_id').optional().isInt({ min: 0 }),

    body('notes')
        .optional({ nullable: true })
        .isString().withMessage('Notes must be a string'),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Form validation (Draft)
// -----------------------------
export const validateDraftFinancialApplication = [
    body('application_id').optional().isInt({ min: 1 }).withMessage('Valid Application ID is required for updating a draft'),
    body('group_name').optional().isLength({ max: 255 }).withMessage('Group Name must not exceed 255 characters'),
    body('business_nature').optional().isLength({ max: 255 }).withMessage('Business Nature must not exceed 255 characters'),
    body('number_of_lives').optional().isInt({ min: 1 }).withMessage('Number of lives must be at least 1'),
    body('business_address').optional().isLength({ max: 500 }).withMessage('Business Address must not exceed 500 characters'),
    body('contact_number').optional().isLength({ max: 20 }).withMessage('Contact Number must not exceed 20 characters'),
    body('fax_number').optional({ nullable: true }).isLength({ max: 20 }).withMessage('Fax Number must not exceed 20 characters'),
    body('email').optional().isEmail().withMessage('Valid Email is required'),
    body('contact_person_salutation').optional().isLength({ max: 20 }).withMessage('Salutation must not exceed 20 characters'),
    body('contact_person_firstname').optional().isLength({ max: 100 }).withMessage('First Name must not exceed 100 characters'),
    body('contact_person_mi').optional({ nullable: true, checkFalsy: true }).isLength({ max: 5 }).withMessage('Middle Initial must not exceed 5 characters'),
    body('contact_person_lastname').optional().isLength({ max: 100 }).withMessage('Last Name must not exceed 100 characters'),
    body('designation').optional().isLength({ max: 255 }).withMessage('Designation must not exceed 255 characters'),
    body('proposal_addressee').optional().isLength({ max: 255 }).withMessage('Proposal Addressee must not exceed 255 characters'),
    body('addressee_designation').optional().isLength({ max: 255 }).withMessage('Addressee Designation must not exceed 255 characters'),

    // Age Profile
    body('minimum_age').optional().isInt({ min: 18, max: 64 }).withMessage('Minimum Age must be at least 18'),
    body('maximum_age').optional().isInt({ min: 18, max: 64 }).withMessage('Maximum Age must be within range')
        .custom((value, { req }) => {
            const minAge = req.body.minimum_age ? Number(req.body.minimum_age) : null;
            if (minAge && value && Number(value) < minAge) {
                throw new Error('Maximum Age must be greater than or equal to Minimum Age');
            }
            return true;
        }),

    // Lookup ID validations (Optional but must be valid if provided)
    body('group_classification_id').optional().isInt({ min: 0 }).custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid group_classification_id`);
        return true;
    }),
    body('business_type_id').optional().isInt({ min: 0 }).custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('BUSINESS_TYPE');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid business_type_id`);
        return true;
    }),
    body('group_type_id').optional().isInt({ min: 0 }).custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid group_type_id`);
        return true;
    }),
    body('payment_mode_id').optional().isInt({ min: 0 }).custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('MODE_OF_PAYMENT');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid payment_mode_id`);
        return true;
    }),
    body('type_of_proposal_id').optional().isInt({ min: 0 }).custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('TYPE_OF_PROPOSAL');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid type_of_proposal_id`);
        return true;
    }),

    // Nested Data Structures
    body('riders').optional({ nullable: true }).isArray().withMessage('riders must be an array'),
    body('payment').optional({ nullable: true }).isArray().withMessage('payment must be an array'),
    body('level_ranking').optional({ nullable: true }).isArray().withMessage('level_ranking must be an array'),
    body('salary_ranking').optional({ nullable: true }).isArray().withMessage('salary_ranking must be an array'),

    body('notes').optional({ nullable: true }).isString().withMessage('Notes must be a string'),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// System Lookup Validation
// -----------------------------
export const validateSystemLookup = [
    body('category').notEmpty().withMessage('Category is required').isLength({ max: 50 }).withMessage('Category must not exceed 50 characters'),
    body('name').notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('code').optional().isLength({ max: 50 }).withMessage('Code must not exceed 50 characters'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Rates validation
// -----------------------------
export const validateRates = [
    (req, res, next) => {
        if (req.params.id) req.body.application_id = parseInt(req.params.id, 10);
        next();
    },
    body('application_id')
        .notEmpty().withMessage('Application ID is required')
        .isInt({ min: 1 }).withMessage('Application ID must be a valid integer'),
    body()
        .custom(async (value, { req }) => {
            const applicationId = req.body.application_id;
            if (!applicationId) return true; 

            const app = await Financial.getApplicationById(applicationId);
            if (!app) throw new Error(`Application with ID ${applicationId} not found.`);

            const keys = ['18-64', '66-70', '71-75', '76-80'];
            let hasData = false;
            
            keys.forEach(key => {
                if (req.body[key]) {
                    hasData = true;
                    if (!Array.isArray(req.body[key])) {
                        throw new Error(`Data for ${key} must be an array.`);
                    }
                    
                    // Validate against application boolean flags
                    if (key === '66-70' && !app.borrower_age_66_70) {
                        throw new Error(`Rates for '66-70' cannot be added because the age bracket is not selected for this application.`);
                    }
                    if (key === '71-75' && !app.borrower_age_71_75) {
                        throw new Error(`Rates for '71-75' cannot be added because the age bracket is not selected for this application.`);
                    }
                    if (key === '76-80' && !app.borrower_age_76_80) {
                        throw new Error(`Rates for '76-80' cannot be added because the age bracket is not selected for this application.`);
                    }

                    req.body[key].forEach((item, index) => {
                        const termKey = key === '76-80' ? 'term_or_age' : 'term_or_months';
                        if (!item[termKey]) {
                            throw new Error(`Item ${index + 1} in ${key} is missing '${termKey}'.`);
                        }
                        if (item.rate === undefined || item.rate === null) {
                            throw new Error(`Item ${index + 1} in ${key} is missing 'rate'.`);
                        }
                    });
                }
            });

            if (!hasData) {
                throw new Error('At least one rate group (18-64, 66-70, 71-75, 76-80) is required.');
            }
            return true;
        }),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Form validation (Update)
// -----------------------------
export const validateUpdateFinancialApplication = [
    async (req, res, next) => {
        if (req.params.id) {
            try {
                req.existingApplication = await Financial.getApplicationById(req.params.id);
                if (!req.existingApplication) {
                    return res.status(404).json({ status: false, errors: [{ msg: `Application with ID ${req.params.id} not found.` }] });
                }
            } catch (e) {
                console.error("Validation pre-fetch error:", e);
                return res.status(500).json({ status: false, errors: [{ msg: 'Failed to fetch existing application for validation.' }] });
            }
        }
        next();
    },

    // All fields are optional for an update. If a field is present, its validation rules are applied.
    body('group_name').optional().isLength({ max: 255 }).withMessage('Group Name must not exceed 255 characters'),
    body('business_nature').optional().isLength({ max: 255 }).withMessage('Business Nature must not exceed 255 characters'),
    body('number_of_lives').optional().isInt({ min: 1 }).withMessage('Number of lives must be at least 1'),
    body('business_address').optional().isLength({ max: 500 }).withMessage('Business Address must not exceed 500 characters'),
    body('contact_number').optional().isLength({ max: 20 }).withMessage('Contact Number must not exceed 20 characters'),
    body('fax_number').optional({ nullable: true }).isLength({ max: 20 }).withMessage('Fax Number must not exceed 20 characters'),
    body('email').optional().isEmail().withMessage('Valid Email is required'),
    body('contact_person_salutation').optional().isLength({ max: 20 }).withMessage('Salutation must not exceed 20 characters'),
    body('contact_person_firstname').optional().isLength({ max: 100 }).withMessage('First Name must not exceed 100 characters'),
    body('contact_person_mi').optional({ nullable: true, checkFalsy: true }).isLength({ max: 5 }).withMessage('Middle Initial must not exceed 5 characters'),
    body('contact_person_lastname').optional().isLength({ max: 100 }).withMessage('Last Name must not exceed 100 characters'),
    body('designation').optional().isLength({ max: 255 }).withMessage('Designation must not exceed 255 characters'),
    body('proposal_addressee').optional().isLength({ max: 255 }).withMessage('Proposal Addressee must not exceed 255 characters'),
    body('addressee_designation').optional().isLength({ max: 255 }).withMessage('Addressee Designation must not exceed 255 characters'),

    // Age validation for update - Minimum 18, Maximum 64
    body('minimum_age').optional().isInt({ min: 18, max: 64 }).withMessage('Minimum Age must be 18 '),
    body('maximum_age').optional().isInt({ min: 18, max: 64 }).withMessage('Maximum Age must be 64 ')
        .custom(async (value, { req }) => {
            const minAge = Number(req.body.minimum_age);
            const maxAge = Number(value);
            if (minAge && maxAge && maxAge < minAge) {
                throw new Error('Maximum Age must be greater than or equal to Minimum Age');
            }
            return true;
        }),

    // Lookup ID validations (optional, but validated if present)
    body('group_classification_id').optional().isInt({ min: 0 }).withMessage('group_classification_id must be a non-negative integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid group_classification_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('business_type_id').optional().isInt({ min: 0 }).withMessage('business_type_id must be a non-negative integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('BUSINESS_TYPE');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid business_type_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('group_type_id').optional().isInt({ min: 0 }).withMessage('group_type_id must be a non-negative integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid group_type_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('payment_mode_id').optional().isInt({ min: 0 }).withMessage('payment_mode_id must be a non-negative integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('MODE_OF_PAYMENT');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid payment_mode_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('type_of_proposal_id').optional().isInt({ min: 0 }).withMessage('type_of_proposal_id must be a non-negative integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('TYPE_OF_PROPOSAL');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid type_of_proposal_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),

    // -----------------------------
    // Channel Type (Update)
    // -----------------------------
    body('channel_type_id')
        .optional()
        .isInt({ min: 1 }).withMessage('channel_type_id must be a valid integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.CHANNEL_TYPE) {
                req.lookupCache.CHANNEL_TYPE = await Financial.getLookupListByCategory('CHANNEL_TYPE');
            }
            const lookups = req.lookupCache.CHANNEL_TYPE;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} (${l.name})`).join(', ');
                throw new Error(`Invalid channel_type_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('channel_name')
        .if(body('channel_type_id').exists())
        .custom((value, { req }) => {
            const channelId = Number(req.body.channel_type_id);
            if ([56, 57].includes(channelId) && (!value || value.trim() === '')) {
                throw new Error('Channel name is required for Booker and General Agency.');
            }
            return true;
        }),

    body('commission_rate').optional().isLength({ max: 255 }).withMessage('Commission Rate must not exceed 255 characters'),
    body('service_fee').optional().isLength({ max: 255 }).withMessage('Service Fee must not exceed 255 characters'),

    // Dependent field validations - sub_group_type_id can be array or string
    body('sub_group_type_id').optional().custom(async (value, { req }) => {
        const subGroupTypeId = value;
        const groupTypeId = req.body.group_type_id !== undefined
            ? Number(req.body.group_type_id)
            : req.existingApplication?.group_type_id;

        if (!groupTypeId) {
            if (subGroupTypeId != null) {
                throw new Error('Cannot have sub_group_type_id without a group_type_id.');
            }
            return true;
        }

        // Fetch lookups if not already cached on the request
        if (!req.lookupCache) req.lookupCache = {};
        if (!req.lookupCache.TYPE_OF_GROUP) {
            req.lookupCache.TYPE_OF_GROUP = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        }
        const lookups = req.lookupCache.TYPE_OF_GROUP;
        const groupTypeItem = lookups.find(l => l.id === groupTypeId);

        if (!groupTypeItem) {
            return true;
        }

        // Handle 'Other' Group Type
        if (groupTypeItem.name === 'Other' || groupTypeItem.name === 'Others') {
            if (subGroupTypeId != null) {
                throw new Error('sub_group_type_id must be null when Group Type is "Other". Use other_group_type instead.');
            }
            return true;
        }

        // Find valid subgroups for the selected Group Type
        const validSubgroups = lookups.filter(l => Number(l.parent_id) === groupTypeId);

        if (validSubgroups.length > 0) {
            if (subGroupTypeId == null) {
                const validOptions = validSubgroups.map(sg => `${sg.id} (${sg.name})`).join(', ');
                throw new Error(`sub_group_type_id is required for Group Type '${groupTypeItem.name}'. Valid options: ${validOptions}`);
            }

            if (subGroupTypeId != null) {
                if (Array.isArray(subGroupTypeId)) {
                    if (groupTypeId !== 11) {
                        throw new Error(`Group Type '${groupTypeItem.name}' only allows a single sub-group selection.`);
                    }
                }

                const idsToCheck = Array.isArray(subGroupTypeId) ? subGroupTypeId : [subGroupTypeId];
                const invalidIds = idsToCheck.filter(id => !validSubgroups.some(sg => sg.id === Number(id)));

                if (invalidIds.length > 0) {
                    const validOptions = validSubgroups.map(sg => `${sg.id} (${sg.name})`).join(', ');
                    throw new Error(`Invalid sub_group_type_id(s): ${invalidIds.join(', ')}. Valid options for '${groupTypeItem.name}': ${validOptions}`);
                }
            }
        } else if (subGroupTypeId != null) {
            throw new Error(`sub_group_type_id must be null as Group Type '${groupTypeItem.name}' has no sub-groups.`);
        }
        return true;
    }),
    body('plan_id').optional().isInt({ min: 0 }).withMessage('plan_id must be a non-negative integer').custom(async (value) => {
        const plans = await Financial.getAllPlans();
        if (!plans.some(p => p.plan_id === Number(value))) {
            const validOptions = plans.map(p => `${p.plan_id} - ${p.plan_name}`).join(', ');
            throw new Error(`Invalid plan_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
body('basic_plan_id').optional().isInt({ min: 0 }).withMessage('basic_plan_id must be a non-negative integer').custom(async (value, { req }) => {
        if (Array.isArray(value)) {
            throw new Error('Only select one');
        }
        
        const planId = req.body.plan_id !== undefined
            ? Number(req.body.plan_id)
            : req.existingApplication?.plan_id;

        if (!planId) throw new Error('plan_id is required to validate basic_plan_id');

        const basics = await Financial.getBasicPlansByPlanId(planId);
        if (!basics.some(b => b.basic_plan_id === Number(value))) {
            const validOptions = basics.map(b => `${b.basic_plan_id} - ${b.basic_plan_name}`).join(', ');
            throw new Error(`Invalid basic_plan_id (${value}) for plan_id (${planId}). Valid options: ${validOptions || 'none available'}`);
        }
        return true;
    }),
    body('riders').optional({ nullable: true }).isArray().withMessage('riders must be an array of objects').custom(async (riders, { req }) => {
        if (!Array.isArray(riders)) return true;

        const planId = req.body.plan_id !== undefined
            ? Number(req.body.plan_id)
            : req.existingApplication?.plan_id;

        if (!planId) throw new Error('plan_id is required to validate rider_ids');

        // GYRT (Plan ID 2) Specific Validations
        if (planId === 2) {
            // Mutual Exclusivity for Accidental Death/Disability Riders (Select 1 out of 4)
            const accidentRiderIds = [2, 3, 4, 5];
            const selectedAccidentRiders = riders.filter(r => accidentRiderIds.includes(Number(r.rider_id)));
            if (selectedAccidentRiders.length > 1) {
                throw new Error('Select only 1 out of the 4 Group Accidental Death Benefit/Disability Riders.');
            }
        }

        const validRiders = await Financial.getRidersByProductId(planId);

        // Since this is a custom validator on the array, we check each item.
        for (const rider of riders) {
            const riderId = parseInt(rider.rider_id, 10);
            if (rider.rider_id === undefined || isNaN(riderId) || riderId < 0) {
                throw new Error('Each rider in the array must have a valid non-negative integer rider_id.');
            }

            // Helper to check values if they exist in 'values' array or root
            const valuesToCheck = (rider.values && Array.isArray(rider.values) && rider.values.length > 0)
                ? rider.values
                : [{ amount: rider.amount, unit: rider.unit }];

            for (const val of valuesToCheck) {
                const amount = val.amount !== undefined && val.amount !== null ? parseFloat(val.amount) : 0;
                const unit = val.unit !== undefined && val.unit !== null ? parseInt(val.unit, 10) : 0;

                if (val.amount !== undefined && (isNaN(amount) || amount < 0)) {
                    throw new Error(`Rider amount for rider_id ${riderId} must be a non-negative number.`);
                }
                
                // Re-use logic for specific riders
                const riderDef = validRiders.find(r => r.rider_id === riderId);
                if (riderDef) {
                    if (planId === 2) {
                        if (riderId === 8 && (amount < 100 || amount > 300)) throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
                        if (riderId === 9 && amount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
                        if (riderId === 11 && amount !== 50000) throw new Error('Burial (Memorial/Service) amount must be fixed at 50,000.');
                        if (riderId === 13 && ![1, 2].includes(unit)) throw new Error('Group Dengue Rider must be 1 Unit (30,000) or 2 Units (60,000).');
                        if ([6, 7, 10, 12].includes(riderId) && amount <= 0) throw new Error(`${riderDef.rider_name} requires a valid amount.`);
                    } else {
                        const name = riderDef.rider_name.trim();
                        if (name === 'Group Accidental Medical Expense Reimbursement Rider' && amount < 500) {
                            throw new Error(`${name} amount must be least 500 minimum.`);
                        } else if (name === 'Group Hospital Income Rider' && (amount < 100 || amount > 300)) {
                            throw new Error(`${name} amount must be between 100 and 300.`);
                        } else if (name === 'Burial (Memorial/Service)' && amount !== 50000) {
                            throw new Error(`${name} amount must be fixed at 50,000.`);
                        }
                    }
                }
                if (val.unit !== undefined && (isNaN(parseInt(val.unit, 10)) || parseInt(val.unit, 10) < 0)) {
                    throw new Error(`Rider unit for rider_id ${rider.rider_id} must be a non-negative integer.`);
                }
            }
        }
        return true;
    }),

    // Single Rate for Borrowers (Update)
    body('borrower_age_66_70').optional({ nullable: true }).isBoolean().withMessage('Borrower age 66-70 selection must be a boolean'),
    body('borrower_age_71_75').optional({ nullable: true }).isBoolean().withMessage('Borrower age 71-75 selection must be a boolean'),
    body('borrower_age_76_80').optional({ nullable: true }).isBoolean().withMessage('Borrower age 76-80 selection must be a boolean'),

    // Optional validation for new product-specific fields on update
    body('amount_loans_id').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Amount Loans ID must be a non-negative integer')
        .custom(async (value) => {
            if (value === null || value === undefined) return true;
            const lookups = await Financial.getLookupListByCategory('LOAN_AMOUNT_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid amount_loans_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('loans_amount').optional({ nullable: true }).isFloat({ min: 0 }),
    body('payment')
        .optional({ nullable: true })
        .isArray({ max: 1 }).withMessage('Payment must be an array with at most one term.'),
    body('payment.*.payment_term_id')
        .if(body('payment').exists())
        .notEmpty().withMessage('payment_term_id is required for each payment term.')
        .isInt({ min: 0 }).withMessage('payment_term_id must be a non-negative integer.')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('PAYMENT_TERM');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid payment_term_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('payment.*.sub_payment_term_id')
        .if(body('payment').exists())
        .custom(async (value, { req, path }) => {
            const index = path.match(/\[(\d+)\]/)[1];
            const paymentTermId = Number(req.body.payment[index].payment_term_id);

            if ([41, 42, 43].includes(paymentTermId)) { // Single Pay, Annual, or Monthly
                if (value == null) {
                    throw new Error('sub_payment_term_id is required when Payment Term is Single Pay, Annual, or Monthly.');
                }
                if (isNaN(Number(value)) || Number(value) < 0) {
                    throw new Error('sub_payment_term_id must be a non-negative integer.');
                }
                const lookups = await Financial.getLookupListByCategory('PAYMENT_YEAR');
                const selectableYears = lookups.filter(l => l.parent_id === 44);
                if (!selectableYears.some(l => l.id === Number(value))) {
                    const validOptions = selectableYears.map(l => `${l.id} - ${l.name}`).join(', ');
                    throw new Error(`Invalid sub_payment_term_id (${value}). Valid options: ${validOptions}`);
                }
            } else if (value != null) {
                throw new Error('sub_payment_term_id must be null for this payment term.');
            }
            return true;
        }),
    body('coverage_type_id').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Coverage Type ID must be a non-negative integer')
        .custom(async (value) => {
            if (value === null || value === undefined) return true;
            const lookups = await Financial.getLookupListByCategory('COVERAGE_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid coverage_type_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),

    // "Other" fields validation for updates
    body('other_group_classification').optional({ nullable: true }).isLength({ max: 255 }).withMessage('other_group_classification must not exceed 255 characters').custom(async (value, { req }) => {
        const id = req.body.group_classification_id !== undefined
            ? req.body.group_classification_id
            : req.existingApplication?.group_classification_id;

        if (!id) return true;

        if (!req.lookupCache) req.lookupCache = {};
        if (!req.lookupCache.GROUP_CLASSIFICATION) {
            req.lookupCache.GROUP_CLASSIFICATION = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
        }
        const selected = req.lookupCache.GROUP_CLASSIFICATION.find(l => l.id === Number(id));

        if (!selected) return true;

        const isOther = selected.name === 'Others';
        if (isOther && (!value || value.trim() === '')) {
            throw new Error('other_group_classification is required when "Others" is selected.');
        }
        if (!isOther && value) {
            throw new Error(`other_group_classification must be empty when Group Classification is not "Others".`);
        }
        return true;
    }),
    body('other_business_type').optional({ nullable: true }).isLength({ max: 255 }).withMessage('other_business_type must not exceed 255 characters').custom(async (value, { req }) => {
        const id = req.body.business_type_id !== undefined
            ? req.body.business_type_id
            : req.existingApplication?.business_type_id;

        if (!id) return true;

        if (!req.lookupCache) req.lookupCache = {};
        if (!req.lookupCache.BUSINESS_TYPE) {
            req.lookupCache.BUSINESS_TYPE = await Financial.getLookupListByCategory('BUSINESS_TYPE');
        }
        const selected = req.lookupCache.BUSINESS_TYPE.find(l => l.id === Number(id));

        if (!selected) return true;

        const isOther = selected.name === 'Other';
        if (isOther && (!value || value.trim() === '')) {
            throw new Error('other_business_type is required when "Other" is selected.');
        }
        if (!isOther && value) {
            throw new Error(`other_business_type must be empty when Business Type is not "Other".`);
        }
        return true;
    }),
    body('other_group_type').optional({ nullable: true }).isLength({ max: 255 }).withMessage('other_group_type must not exceed 255 characters').custom(async (value, { req }) => {
        const id = req.body.group_type_id !== undefined
            ? req.body.group_type_id
            : req.existingApplication?.group_type_id;

        if (!id) return true;

        if (!req.lookupCache) req.lookupCache = {};
        if (!req.lookupCache.TYPE_OF_GROUP) {
            req.lookupCache.TYPE_OF_GROUP = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        }
        const selected = req.lookupCache.TYPE_OF_GROUP.find(l => l.id === Number(id));

        if (!selected) return true;

        const isOther = selected.name === 'Other';
        if (isOther && (!value || value.trim() === '')) {
            throw new Error('other_group_type is required when "Other" is selected.');
        }
        if (!isOther && value) {
            throw new Error(`other_group_type must be empty when Group Type is not "Other".`);
        }
        return true;
    }),

    // Optional status
    body('status_id').optional().isInt({ min: 0 }),

    body('notes')
        .optional({ nullable: true })
        .isString().withMessage('Notes must be a string'),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];