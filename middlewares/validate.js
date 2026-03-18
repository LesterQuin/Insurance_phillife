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
    // Custom middleware to check for duplicate agent_code
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

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ status: false, errors: errors.array() });
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
    // -----------------------------
    // KYC
    // ----------------------------- q
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
                return true; // Let group_type_id validator handle missing group_type_id
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
    
                // --- Handle single vs. multiple selections ---
                // 'Employer-Employee' (ID 11) allows multiple sub-group selections.
                // Other types like 'OFW' (ID 16) allow only one.
                if (Array.isArray(subGroupTypeId)) {
                    if (groupTypeId !== 11) { // ID 11 is 'Employer-Employee'
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
                // If no subgroups exist, sub_group_type_id must be null
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
    // Product/Plan
    // -----------------------------
    body('plan_id')
        .if(body('type_of_proposal_id').equals('31'))
        .notEmpty().withMessage('Plan is required')
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
        .notEmpty().withMessage('Basic Plan is required')
        .isInt({ min: 0 }).withMessage('basic_plan_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            // Check if basic_plan_id is an array - only one allowed
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
            if (!planId) return true; 

            const validRiders = await Financial.getRidersByProductId(planId);
            
            for (const rider of riders) {
                const riderId = Number(rider.rider_id);
                const amount = Number(rider.amount);
                const riderDef = validRiders.find(r => r.rider_id === riderId);
                
                if (riderDef) {
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
            return true;
        }),
    body('riders.*.rider_id')
        .exists().withMessage('rider_id is required for each rider')
        .if(body('type_of_proposal_id').equals('31'))
        .isInt({ min: 0 }).withMessage('rider_id must be a non-negative integer')
        .custom(async (value, { req }) => {
            const planId = Number(req.body.plan_id);
            if (!planId) return true; // Let other validator catch missing plan_id

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
    body('borrower_age_65_67')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isBoolean().withMessage('Borrower age 65-67 selection must be a boolean (true/false)'),
    body('borrower_age_68_70')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isBoolean().withMessage('Borrower age 68-70 selection must be a boolean (true/false)'),
    body('borrower_age_71_74')
        .if(body('type_of_proposal_id').equals('31'))
        .optional()
        .isBoolean().withMessage('Borrower age 71-74 selection must be a boolean (true/false)'),

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
                if (coverageTypeId === 33) { // Uniform Coverage
                    if (value == null) {
                        throw new Error('Uniform Coverage Amount is required and cannot be null for this coverage type.');
                    }
                    if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                        throw new Error('Uniform Coverage Amount must be a non-negative decimal.');
                    }
                } else if (coverageTypeId === 32 && value != null) { // Should be null for Level Ranking
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
                if (coverageTypeId === 32) { // Level Ranking
                    if (value == null || value.length < 2) {
                        throw new Error('Level Ranking is required for this coverage type and must have at least 2 entries.');
                    }
                    if (value.length > 10) {
                        throw new Error('Level Ranking cannot have more than 10 entries.');
                    }
                } else if (value != null && value.length > 0) { // For any other coverage type under plan 2 or 3
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
                    if (value.length > 4) {
                        throw new Error('Salary Ranking cannot have more than 4 entries.');
                    }
                    // Check for uniqueness of salary_multiplier
                    const multipliers = value.map(item => item.salary_multiplier);
                    const uniqueMultipliers = new Set(multipliers);
                    if (uniqueMultipliers.size !== multipliers.length) {
                        throw new Error('Salary multipliers within Salary Ranking must be unique.');
                    }
                } else if (value != null) { // For any other coverage type under plan 2 or 3
                    throw new Error('Salary Ranking should only be provided for By Salary Rank coverage type.');
                }
            }
            return true;
        }),
    body('salary_ranking.*.salary_multiplier')
        .if(body('type_of_proposal_id').equals('31'))
        .if(body('salary_ranking').exists())
        .notEmpty().withMessage('Salary Multiplier is required in Salary Ranking')
        .custom(async (value) => {
            const lookups = await Financial.getLookupListByCategory('COVERAGE_MULTIPLIER');
            const validMultipliers = lookups.map(l => l.name);
            if (!validMultipliers.includes(value)) {
                throw new Error(`Invalid salary_multiplier (${value}). Valid options: ${validMultipliers.join(', ')}`);
            }
            return true;
        }),
    body('salary_ranking.*.designation').if(body('type_of_proposal_id').equals('31')).if(body('salary_ranking').exists()).notEmpty().withMessage('Designation is required in Salary Ranking'),
    body('salary_ranking.*.amount').if(body('type_of_proposal_id').equals('31')).if(body('salary_ranking').exists()).isFloat({ min: 0 }).withMessage('Amount must be a non-negative number in Salary Ranking'),

    // Optional status
    body('status_id').optional().isInt({ min: 0 }),

    // Validation result
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
    body('application_id')
        .notEmpty().withMessage('Application ID is required')
        .isInt({ min: 1 }).withMessage('Application ID must be a valid integer'),
    // Check the root body for the rate keys
    body()
        .custom((value, { req }) => {
            const keys = ['18-64', '65-67', '68-70', '71-74'];
            let hasData = false;
            
            keys.forEach(key => {
                if (req.body[key]) {
                    hasData = true;
                    if (!Array.isArray(req.body[key])) {
                        throw new Error(`Data for ${key} must be an array.`);
                    }
                    
                    req.body[key].forEach((item, index) => {
                        const termKey = key === '71-74' ? 'term_or_age' : 'term_or_months';
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
                throw new Error('At least one rate group (18-64, 65-67, 68-70, 71-74) is required.');
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

    // Dependent field validations - sub_group_type_id can be array or string
    body('sub_group_type_id').optional().custom(async (value, { req }) => {
        const subGroupTypeId = value;
        // Determine the groupTypeId from the request body or the existing application
        const groupTypeId = req.body.group_type_id !== undefined
            ? Number(req.body.group_type_id)
            : req.existingApplication?.group_type_id;

        if (!groupTypeId) {
            if (subGroupTypeId != null) {
                // If group_type_id is being removed, sub_group_type_id should also be removed.
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
            // This should be caught by group_type_id validator, but as a safeguard:
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
                // --- Handle single vs. multiple selections ---
                if (Array.isArray(subGroupTypeId)) {
                    if (groupTypeId !== 11) { // ID 11 is 'Employer-Employee'
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
            }
        } else if (subGroupTypeId != null) {
            // If no subgroups exist, sub_group_type_id must be null
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
        // Check if basic_plan_id is an array - only one allowed
        if (Array.isArray(value)) {
            throw new Error('Only select one');
        }
        
        const planId = req.body.plan_id !== undefined
            ? Number(req.body.plan_id)
            : req.existingApplication?.plan?.id;

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
            : req.existingApplication?.plan?.id;

        if (!planId) throw new Error('plan_id is required to validate rider_ids');

        const validRiders = await Financial.getRidersByProductId(planId);

        // Since this is a custom validator on the array, we check each item.
        for (const rider of riders) {
            if (rider.rider_id === undefined || isNaN(parseInt(rider.rider_id, 10)) || parseInt(rider.rider_id, 10) < 0) {
                throw new Error('Each rider in the array must have a valid non-negative integer rider_id.');
            }

            if (rider.amount !== undefined) {
                if (isNaN(parseFloat(rider.amount)) || parseFloat(rider.amount) < 0) {
                    throw new Error(`Rider amount for rider_id ${rider.rider_id} must be a non-negative number.`);
                }
                const amount = parseFloat(rider.amount);
                const riderDef = validRiders.find(r => r.rider_id === parseInt(rider.rider_id, 10));
                if (riderDef) {
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
            if (rider.unit !== undefined && (isNaN(parseInt(rider.unit, 10)) || parseInt(rider.unit, 10) < 0)) {
                throw new Error(`Rider unit for rider_id ${rider.rider_id} must be a non-negative integer.`);
            }
        }
        return true;
    }),

    // Single Rate for Borrowers (Update)
    body('borrower_age_65_67').optional({ nullable: true }).isBoolean().withMessage('Borrower age 65-67 selection must be a boolean'),
    body('borrower_age_68_70').optional({ nullable: true }).isBoolean().withMessage('Borrower age 68-70 selection must be a boolean'),
    body('borrower_age_71_74').optional({ nullable: true }).isBoolean().withMessage('Borrower age 71-74 selection must be a boolean'),

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
    body('status_id').optional().isInt({ min: 0 }),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];