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
    // Custom middleware to check for duplicate agent_code
    async (req, res, next) => {
        try {
            const { agent_code } = req.body;
            
            // If agent_code is provided and not empty, check if it already exists
            if (agent_code && agent_code.trim()) {
                const existingUser = await User.getUserByAgentCode(agent_code.trim());
                
                if (existingUser) {
                    // Return error instead of auto-generating a new code
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
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.GROUP_CLASSIFICATION) {
                req.lookupCache.GROUP_CLASSIFICATION = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
            }
            const lookups = req.lookupCache.GROUP_CLASSIFICATION;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) throw new Error(`Invalid group_classification_id (${value})`);
            return true;
        }),
    body('business_type_id')
        .notEmpty().withMessage('Business Type is required')
        .isInt().withMessage('business_type_id must be an integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.BUSINESS_TYPE) {
                req.lookupCache.BUSINESS_TYPE = await Financial.getLookupListByCategory('BUSINESS_TYPE');
            }
            const lookups = req.lookupCache.BUSINESS_TYPE;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) throw new Error(`Invalid business_type_id (${value})`);
            return true;
        }),
    body('group_type_id')
        .notEmpty().withMessage('Group Type is required')
        .isInt().withMessage('group_type_id must be an integer')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.TYPE_OF_GROUP) {
                req.lookupCache.TYPE_OF_GROUP = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
            }
            const lookups = req.lookupCache.TYPE_OF_GROUP;
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

        if (!req.lookupCache) req.lookupCache = {};
        if (!req.lookupCache.TYPE_OF_GROUP) {
            req.lookupCache.TYPE_OF_GROUP = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        }
        const lookups = req.lookupCache.TYPE_OF_GROUP;
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
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.MODE_OF_PAYMENT) {
                req.lookupCache.MODE_OF_PAYMENT = await Financial.getLookupListByCategory('MODE_OF_PAYMENT');
            }
            const lookups = req.lookupCache.MODE_OF_PAYMENT;
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
    body('other_group_classification')
        .optional().isLength({ max: 255 }).withMessage('other_group_classification must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const id = req.body.group_classification_id;
            if (!id) return true; // Let other validator handle missing id

            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.GROUP_CLASSIFICATION) {
                req.lookupCache.GROUP_CLASSIFICATION = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
            }
            const lookups = req.lookupCache.GROUP_CLASSIFICATION;
            const selected = lookups.find(l => l.id === Number(id));

            if (!selected) return true; // Let other validator handle invalid id

            const isOther = selected.name === 'Others' || selected.name === 'Other';

            if (isOther && (!value || value.trim() === '')) {
                throw new Error('other_group_classification is required when "Others" is selected.');
            }

            if (!isOther && value) {
                throw new Error(`other_group_classification must be empty when Group Classification is not "Others".`);
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
    body('other_group_type')
        .optional().isLength({ max: 255 }).withMessage('other_group_type must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const id = req.body.group_type_id;
            if (!id) return true;

            // This lookup should already be cached by the group_type_id validator
            const lookups = req.lookupCache.TYPE_OF_GROUP || [];
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

    // Optional status
    body('status_id').optional().isInt(),

    // Validation result
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
    // This helper pre-loads the existing application data if we're in an update context.
    // This allows dependent validations to work correctly on partial updates.
    async (req, res, next) => {
        if (req.params.id) {
            try {
                // Fetch once and cache on the request object
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
    body('contact_person').optional().isLength({ max: 255 }).withMessage('Contact Person must not exceed 255 characters'),
    body('designation').optional().isLength({ max: 255 }).withMessage('Designation must not exceed 255 characters'),
    body('proposal_addressee').optional().isLength({ max: 255 }).withMessage('Proposal Addressee must not exceed 255 characters'),
    body('addressee_designation').optional().isLength({ max: 255 }).withMessage('Addressee Designation must not exceed 255 characters'),

    // Lookup ID validations (optional, but validated if present)
    body('group_classification_id').optional().isInt().withMessage('group_classification_id must be an integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('GROUP_CLASSIFICATION');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid group_classification_id (${value})`);
        return true;
    }),
    body('business_type_id').optional().isInt().withMessage('business_type_id must be an integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('BUSINESS_TYPE');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid business_type_id (${value})`);
        return true;
    }),
    body('group_type_id').optional().isInt().withMessage('group_type_id must be an integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid group_type_id (${value})`);
        return true;
    }),
    body('payment_mode_id').optional().isInt().withMessage('payment_mode_id must be an integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('MODE_OF_PAYMENT');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid payment_mode_id (${value})`);
        return true;
    }),

    // Dependent field validations
    body('sub_group_type_id').optional({ nullable: true }).isInt().withMessage('sub_group_type_id must be an integer').custom(async (value, { req }) => {
        if (value === null) return true; // Allow clearing the value

        const parentId = req.body.group_type_id !== undefined
            ? Number(req.body.group_type_id)
            : req.existingApplication?.group_type?.id;

        if (!parentId) throw new Error('group_type_id is required to validate sub_group_type_id');

        const lookups = await Financial.getLookupListByCategory('TYPE_OF_GROUP');
        const validSubgroups = lookups.filter(l => Number(l.parent_id) === parentId);
        if (!validSubgroups.some(l => l.id === Number(value))) {
            const allowed = validSubgroups.length ? validSubgroups.map(l => `${l.id} (${l.name})`).join(', ') : 'None';
            throw new Error(`Invalid sub_group_type_id (${value}) for group_type_id (${parentId}). Allowed: ${allowed}`);
        }
        return true;
    }),
    body('plan_id').optional().isInt().withMessage('plan_id must be a valid integer').custom(async (value) => {
        const plans = await Financial.getAllPlans();
        if (!plans.some(p => p.plan_id === Number(value))) throw new Error(`Invalid plan_id (${value})`);
        return true;
    }),
    body('basic_plan_id').optional().isInt().withMessage('basic_plan_id must be a valid integer').custom(async (value, { req }) => {
        const planId = req.body.plan_id !== undefined
            ? Number(req.body.plan_id)
            : req.existingApplication?.plan?.id;

        if (!planId) throw new Error('plan_id is required to validate basic_plan_id');

        const basics = await Financial.getBasicPlansByPlanId(planId);
        if (!basics.some(b => b.basic_plan_id === Number(value))) {
            throw new Error(`Invalid basic_plan_id (${value}) for plan_id (${planId})`);
        }
        return true;
    }),
    body('rider_ids').optional({ nullable: true }).isArray().withMessage('rider_ids must be an array of integers').custom(async (riders, { req }) => {
        if (!Array.isArray(riders)) return true;

        const basicPlanId = req.body.basic_plan_id !== undefined
            ? Number(req.body.basic_plan_id)
            : req.existingApplication?.basic_plan?.id;

        if (!basicPlanId) throw new Error('basic_plan_id is required to validate rider_ids');

        const validRiders = await Financial.getRidersByBasicPlanId(basicPlanId);
        const invalidRiders = riders.filter(r => !validRiders.some(v => v.rider_id === Number(r)));
        if (invalidRiders.length) throw new Error(`Invalid rider_ids for basic_plan_id (${basicPlanId}): ${invalidRiders.join(', ')}`);
        return true;
    }),

    // "Other" fields validation for updates
    body('other_group_classification').optional({ nullable: true }).isLength({ max: 255 }).withMessage('other_group_classification must not exceed 255 characters').custom(async (value, { req }) => {
        const id = req.body.group_classification_id !== undefined
            ? req.body.group_classification_id
            : req.existingApplication?.group_classification?.id;

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
            : req.existingApplication?.business_type?.id;

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
            : req.existingApplication?.group_type?.id;

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
    body('status_id').optional().isInt(),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];