// validate.js
import validator from 'express-validator';
const { body, validationResult } = validator;
import * as User from '../models/user/user_model.js';
import * as Financial from '../models/financial_Insurance_form.model.js'

// -----------------------------
// User validation
// -----------------------------
// Validation for financial insurance application
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

// Validation for user registration
export const validateRegister = [
    body('firstname')
        .notEmpty().withMessage('First name is required')
        .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters'),
    body('middlename')
        .optional()
        .isLength({ max: 100 }).withMessage('Middle name must not exceed 100 characters'),
    body('lastname')
        .notEmpty().withMessage('Last name is required')
        .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters'),
    body('suffix')
        .optional()
        .isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .matches(/^[\w.-]+@(gmail\.com|yahoo\.com|phillifeassurance\.onmicrosoft\.com)$/i)
        .withMessage('Email must be from allowed domain (gmail.com, yahoo.com, phillifeassurance.onmicrosoft.com)'),
    body('phoneNumber')
        .optional()
        .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits'),
    body('agent_code')
        .optional()
        .isLength({ max: 50 }).withMessage('Agent code must not exceed 50 characters'),
    body('role_id')
    .notEmpty().withMessage('Role ID is required')
    .isInt().withMessage('Role ID must be a valid integer')
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
    .isInt().withMessage('Department ID must be a valid integer')
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
    .isInt().withMessage('Location ID must be a valid integer')
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
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
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
        .isLength({ max: 100 }).withMessage('First name must not exceed 100 characters'),
    body('middlename')
        .optional()
        .isLength({ max: 100 }).withMessage('Middle name must not exceed 100 characters'),
    body('lastname')
        .optional()
        .isLength({ max: 100 }).withMessage('Last name must not exceed 100 characters'),
    body('suffix')
        .optional()
        .isLength({ max: 20 }).withMessage('Suffix must not exceed 20 characters'),
    body('phoneNumber')
        .optional()
        .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits'),
    body('newPassword')
        .optional()
        .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),

    // Final middleware to check for validation errors
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ status: false, errors: errors.array() });
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
    body('contact_person')
        .notEmpty().withMessage('Contact Person is required')
        .isLength({ max: 255 }).withMessage('Contact Person must not exceed 255 characters'),
    body('designation')
        .notEmpty().withMessage('Designation is required')
        .isLength({ max: 255 }).withMessage('Designation must not exceed 255 characters'),
    body('proposal_addressee')
        .notEmpty().withMessage('Proposal Addressee is required')
        .isLength({ max: 255 }).withMessage('Proposal Addressee must not exceed 255 characters'),
    body('addressee_designation')
        .notEmpty().withMessage('Addressee Designation is required')
        .isLength({ max: 255 }).withMessage('Addressee Designation must not exceed 255 characters'),

    // Lookup ID validations
    body('group_classification_id')
        .notEmpty().withMessage('Group Classification is required')
        .isInt().withMessage('group_classification_id must be an integer')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
            const item = lookups.find(l => l.id === Number(value));
            if (!item) throw new Error(`Invalid group_classification_id (${value})`);
            return true;
        }),
    body('business_type_id')
        .notEmpty().withMessage('Business Type is required')
        .isInt().withMessage('business_type_id must be an integer')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('BUSINESS_TYPE');
            const item = lookups.find(l => l.id === Number(value));
            if (!item) throw new Error(`Invalid business_type_id (${value})`);
            return true;
        }),
    body('group_type_id')
        .notEmpty().withMessage('Group Type is required')
        .isInt().withMessage('group_type_id must be an integer')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
            const item = lookups.find(l => l.id === Number(value));
            if (!item) throw new Error(`Invalid group_type_id (${value})`);
            return true;
        }),
    body('sub_group_type_id')
    .optional()
    .isInt().withMessage('sub_group_type_id must be an integer')
    .custom(async (value, { req }) => {
        const parentId = Number(req.body.group_type_id); // convert to number
        if (!parentId) throw new Error('group_type_id is required to validate sub_group_type_id');

        const lookups = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        const validSubgroups = lookups
            .filter(l => Number(l.parent_id) === parentId) // convert parent_id to number
            .map(l => ({ id: l.id, name: l.name }));

        if (!validSubgroups.some(l => l.id === Number(value))) {
            const allowed = validSubgroups.length
                ? validSubgroups.map(l => `${l.id} (${l.name})`).join(', ')
                : 'None';
            throw new Error(`Invalid sub_group_type_id (${value}) for group_type_id (${parentId}). Allowed: ${allowed}`);
        }
        return true;
    }),
    body('payment_mode_id')
        .notEmpty().withMessage('Payment Mode is required')
        .isInt().withMessage('payment_mode_id must be an integer')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('MODE_OF_PAYMENT');
            const item = lookups.find(l => l.id === Number(value));
            if (!item) throw new Error(`Invalid payment_mode_id (${value})`);
            return true;
        }),
    // Plan + Basic Plan validations
    body('plan_id')
        .notEmpty().withMessage('Plan is required')
        .isInt().withMessage('plan_id must be a valid integer')
        .custom(async (value) => {
            const plans = await Financial.getAllPlans();
            if (!plans.some(p => p.plan_id === Number(value))) throw new Error(`Invalid plan_id (${value})`);
            return true;
        }),
    body('basic_plan_id')
        .notEmpty().withMessage('Basic Plan is required')
        .isInt().withMessage('basic_plan_id must be a valid integer')
        .custom(async (value, { req }) => {
            const planId = Number(req.body.plan_id);
            if (!planId) throw new Error('plan_id is required to validate basic_plan_id');

            const basics = await Financial.getBasicPlansByPlanId(planId);
            if (!basics.some(b => b.basic_plan_id === Number(value))) {
                throw new Error(`Invalid basic_plan_id (${value}) for plan_id (${planId})`);
            }
            return true;
        }),

    // Attachable riders (multiple allowed)
    body('rider_ids')
        .optional()
        .isArray().withMessage('rider_ids must be an array of integers')
        .custom(async (riders, { req }) => {
            if (!Array.isArray(riders)) return true;
            const basicPlanId = Number(req.body.basic_plan_id);
            if (!basicPlanId) throw new Error('basic_plan_id is required to validate rider_ids');

            const validRiders = await Financial.getRidersByBasicPlanId(basicPlanId);
            const invalidRiders = riders.filter(r => !validRiders.some(v => v.rider_id === Number(r)));
            if (invalidRiders.length) throw new Error(`Invalid rider_ids for basic_plan_id (${basicPlanId}): ${invalidRiders.join(', ')}`);
            return true;
        }),

    // Optional "Other" fields
    body('other_group_classification').optional().isLength({ max: 255 }),
    body('other_business_type').optional().isLength({ max: 255 }),
    body('other_group_type').optional().isLength({ max: 255 }),

    // Optional status
    body('status_id').optional().isInt(),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];