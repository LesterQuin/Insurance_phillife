// validate.js
import validator from 'express-validator';
const { body, param, validationResult } = validator;
import * as User from '../models/user/user_model.js';
import * as Financial from '../models/financial_Insurance_form.model.js'
import * as Dropdown from '../models/insurance_dropdown/insurance_dropdown.model.js';

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

// New middleware for routes that don't have a :userId parameter (like /register)
export const validateIsAdmin = [
    async (req, res, next) => {
        try {
        const requester = req.user;

        const isSuperAdmin =
            requester &&
            (requester.role_id === 15 ||
            requester.roleName === "Super Admin" ||
            requester.roleCode === "ROLE_SA");

        const isITDepartment =
            requester &&
            (requester.department_id === 16 ||
            requester.departmentName === "Information Technology" ||
            requester.departmentCode === "DEPT_IT");

        if (!isSuperAdmin && !isITDepartment) {
            return res.status(403).json({
            status: false,
            message:
                "Unauthorized. Only Super Admins or IT department personnel can perform this action.",
            });
        }

        next();
        } catch (error) {
        console.error("Permission check error:", error);
        return res.status(500).json({
            status: false,
            message: "Error checking permissions",
        });
        }
    },
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
    body('reporting_to_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Reporting To ID must be a positive integer')
    .custom(async (value) => {
        if (value == null) return true;
        const superiors = await User.getPotentialSuperiors();
        const validIds = superiors.map(s => s.user_id);
        if (!validIds.includes(Number(value))) {
            const superiorList = superiors.map(s => `${s.user_id} - ${s.firstname} ${s.lastname} (${s.roleName})`).join(', ');
            throw new Error(
                `Invalid reporting_to_id (${value}). Please select one of the following: ${superiorList}`
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
        .isLength({ max: 255 }).withMessage('Group Name must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const proposalStatusId = Number(req.body.proposal_status_id);
            const RENEW_STATUS_ID = 61;
            const NEW_STATUS_ID = 60;

            const existingGroup = await Financial.getApplicationByGroupName(value);

            if (proposalStatusId === RENEW_STATUS_ID) {
                if (!existingGroup) {
                    throw new Error(`The group "${value}" does not exist in our records. Renewal is only possible for existing groups.`);
                }
                
                // Authorization Check: Creator OR (Team Leader/Super Admin)
                const currentUser = req.user;
                const owner = await User.getUserById(existingGroup.user_id);
                const isOwnerActive = owner && owner.is_active;
                const isCreator = Number(currentUser.user_id) === Number(existingGroup.user_id);

                if (!isCreator) {
                    if (isOwnerActive) {
                        throw new Error(`Renewal failed. The original creator ("${owner.firstname} ${owner.lastname}") is still an active user. Only the original creator can renew this application.`);
                    }

                    const isAuthorizedRole = currentUser && (
                        [1, 2, 3, 15, 19].includes(Number(currentUser.role_id)) || 
                        ['Super Admin', 'Team Leader', 'Group Sales & Marketing Head', 'Assistant Vice President', 'Corporate Financial Executive'].includes(currentUser.roleName)
                    );

                    if (!isAuthorizedRole) {
                        throw new Error(`Renewal failed. The original creator is inactive, but you do not have the required leadership permissions to process this renewal.`);
                    }
                }

                // Check if created_at is at least 1 year old
                const createdAt = new Date(existingGroup.created_at);
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                if (createdAt > oneYearAgo) {
                    const formattedDate = createdAt.toLocaleDateString();
                    throw new Error(`Renewal failed. The application for "${value}" was created on ${formattedDate}. You can only renew applications that are at least 1 year old.`);
                }
            } else if (proposalStatusId === NEW_STATUS_ID) {
                if (existingGroup && Number(existingGroup.status_id) !== 6) {
                    throw new Error(`An active application for "${value}" already exists in the system. Please select "Renew" if you wish to process a renewal.`);
                }
            }
            return true;
        }),
    body('business_nature_id')
        .notEmpty().withMessage('Business Nature is required')
        .isInt({ min: 1 }).withMessage('Business Nature ID must be a positive integer (no letters or special characters allowed)')
        .custom(async (value, { req }) => {
            if (!req.industryCache) req.industryCache = await Dropdown.getIndustries();
            const topLevelIndustries = req.industryCache.filter(i => i.parent_id === null);
            const item = topLevelIndustries.find(i => i.id === Number(value));
            if (!item) {
                const validOptions = topLevelIndustries.map(i => `${i.id} - ${i.name}`).join(', ');
                throw new Error(`Invalid business_nature_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('sub_business_nature_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Sub-Business Nature ID must be a positive integer (no letters or special characters allowed)')
        .custom(async (value, { req }) => {
            if (value == null) return true;
            
            const parentId = Number(req.body.business_nature_id);
            if (!parentId) throw new Error('business_nature_id is required to validate sub_business_nature_id');

            const childId = Number(value);
            if (!req.industryCache) req.industryCache = await Dropdown.getIndustries();
            
            const validChildren = req.industryCache.filter(i => i.parent_id === parentId);
            const item = validChildren.find(i => i.id === childId);

            if (!item) {
                const validOptions = validChildren.length > 0 
                    ? validChildren.map(i => `${i.id} - ${i.name}`).join(', ')
                    : 'none available';
                throw new Error(`Invalid sub_business_nature_id (${childId}). Valid options for parent ID ${parentId}: ${validOptions}`);
            }
            return true;
        }),
    body('business_nature')
        .optional()
        .isLength({ max: 255 }).withMessage('Business Nature must not exceed 255 characters'),
    body('number_of_lives')
        .notEmpty().withMessage('Number of lives is required')
        .isInt({ min: 1 }).withMessage('Number of lives must be at least 1'),
    body('business_address')
        .notEmpty().withMessage('Business Address is required')
        .isLength({ max: 500 }).withMessage('Business Address must not exceed 500 characters'),
    body('contact_number')
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 20 }).withMessage('Contact Number must not exceed 20 characters'),
    body('fax_number')
        .optional({ nullable: true, checkFalsy: true })
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
    /*
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
        */
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
        .isInt({ min: 18, max: 65 }).withMessage('Minimum Age must be between 18 and 65'),
    body('maximum_age')
        .notEmpty().withMessage('Maximum Age is required')
        .isInt({ min: 18, max: 65 }).withMessage('Maximum Age must be between 18 and 65')
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
    body('proposal_status_id')
        .notEmpty().withMessage('Proposal type (New/Renew) is required')
        .isInt({ min: 60, max: 61 }).withMessage('proposal_status_id must be 60 (New) or 61 (Renew)')
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.STATUS_PROPOSAL) {
                req.lookupCache.STATUS_PROPOSAL = await Financial.getLookupListByCategory('STATUS_PROPOSAL');
            }
            const lookups = req.lookupCache.STATUS_PROPOSAL;
            const item = lookups.find(l => l.id === Number(value));
            if (!item) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid proposal_status_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('channel_name')
        .if(body('channel_type_id').custom(val => [56, 57, 58].includes(Number(val))))
        .notEmpty().withMessage('Channel name is required for Agent, Broker and General Agency.')
        .isLength({ max: 255 }).withMessage('Channel name must not exceed 255 characters'),
    body('channel_number')
        .if(body('channel_type_id').custom(val => [56, 57, 58].includes(Number(val))))
        .notEmpty().withMessage('Channel contact number is required for Agent, Broker and General Agency.')
        .isLength({ max: 50 }).withMessage('Channel contact number must not exceed 50 characters'),
    body('channel_email')
        .if(body('channel_type_id').custom(val => [56, 57, 58].includes(Number(val))))
        .notEmpty().withMessage('Channel email is required for Agent, Broker and General Agency.')
        .isEmail().withMessage('Channel email must be a valid email address')
        .isLength({ max: 255 }).withMessage('Channel email must not exceed 255 characters'),

    body('commission_rate')
        .if(body('type_of_proposal_id').equals('31'))
        .notEmpty().withMessage('Commission Rate is required')
        .isFloat({ min: 0 }).withMessage('Commission Rate must be 0 or a positive number'),
    body('service_fee')
        .if(body('type_of_proposal_id').equals('31'))
        .notEmpty().withMessage('Service Fee is required')
        .isFloat({ min: 0 }).withMessage('Service Fee must be 0 or a positive number'),

    body('total_annual_premium').optional().isFloat({ min: 0 }).withMessage('Total Annual Premium must be 0 or a positive number'),

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
                    const riderIdDisplay = rider.rider_id || 'unknown';
                    if (!rider.values || !Array.isArray(rider.values)) {
                        throw new Error(`Rider ${riderIdDisplay} must have a 'values' array for ranking-based coverage.`);
                    }
                    
                    // If exactly one value is provided, we assume it applies to all designations (broadcast).
                    // Only check for missing designations if multiple values are provided.
                    if (rider.values.length !== 1) {
                        const riderDesignations = rider.values.map(v => v.designation);
                        const missingDesignations = designations.filter(d => !riderDesignations.includes(d));
                        if (missingDesignations.length > 0) {
                            throw new Error(`Rider ${riderIdDisplay} is missing values for designations: ${missingDesignations.join(', ')}`);
                        }
                    }

                    // Validate amounts inside the mapped values
                    for (const val of rider.values) {
                        if (planId === 2) { // GYRT specific checks
                            const rId = rider.rider_id ? rider.rider_id.toString() : '';
                            const amount = val.amount != null ? Number(val.amount) : 0;
                            const unit = val.unit != null ? Number(val.unit) : 0;

                            if (rId === 8 && amount !== 0 && (amount < 100 || amount > 300)) throw new Error('Group Hospital Income Rider amount must be between 100 and 300 for all ranks.');
                            if (rId === 9 && amount !== 0 && amount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500 for all ranks.');
                            if (rId === 11 && amount !== 0 && amount !== 50000) throw new Error('Burial (Memorial/Service) amount must be fixed at 50,000 for all ranks.');
                            if (rId === 13 && unit !== 0 && ![1, 2].includes(unit)) throw new Error('Group Dengue Rider must be 1 or 2 Units for all ranks.');
                            if (['6', '7', '10', '12'].includes(rId) && amount < 0) throw new Error(`Rider ${rId} requires a valid positive amount for all ranks.`);
                        }
                    }
                }
                return true;
            }

            // --- General Validation for Non-Ranking Riders ---
            const validRiders = await Financial.getRidersByProductId(planId);
            
            for (const rider of riders) {
                const riderId = rider.rider_id ? rider.rider_id.toString() : '';
                const amount = rider.amount !== undefined && rider.amount !== null ? Number(rider.amount) : 0;
                const unit = rider.unit !== undefined && rider.unit !== null ? Number(rider.unit) : 0;
                const riderDef = validRiders.find(r => r.rider_id.toString() === riderId);
                
                if (riderDef) {
                    // GYRT (Plan 2) Specific Validations based on IDs
                    if (planId === 2) {
                        if (riderId === 8) { // Group Hospital Income Rider
                            if (amount !== 0 && (amount < 100 || amount > 300)) throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
                        } else if (riderId === 9) { // Group Accidental Medical Expense Reimbursement Rider
                            if (amount !== 0 && amount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
                        } else if (riderId === 11) { // Burial (Memorial/Service)
                            if (amount !== 0 && amount !== 50000) throw new Error('Burial (Memorial/Service) amount must be fixed at 50,000.');
                        } else if (riderId === 13) { // Group Dengue Rider
                            if (unit !== 0 && ![1, 2].includes(unit)) throw new Error('Group Dengue Rider must be 1 Unit (30,000) or 2 Units (60,000).');
                        } else if (['6', '7', '10', '12'].includes(riderId)) { // Valid Amount Required for these riders
                            if (amount < 0) throw new Error(`${riderDef.rider_name} requires a valid amount.`);
                        }
                    } else {
                        // General Validation for other plans (fallback to name checks if ID not specific)
                        const name = riderDef.rider_name.trim();
                        if (name === 'Group Accidental Medical Expense Reimbursement Rider' && amount !== 0 && amount < 500) {
                            throw new Error(`${name} amount must be least 500 minimum.`);
                        } else if (name === 'Group Hospital Income Rider' && amount !== 0 && (amount < 100 || amount > 300)) {
                            throw new Error(`${name} amount must be between 100 and 300.`);
                        } else if (name === 'Burial (Memorial/Service)' && amount !== 0 && amount !== 50000) {
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
        .notEmpty().withMessage('rider_id is required and can be alphanumeric')
        .custom(async (value, { req }) => {
            const planId = Number(req.body.plan_id);
            if (!planId) return true; 

            const validRiders = await Financial.getRidersByProductId(planId);
            if (!validRiders.some(v => v.rider_id.toString() === value.toString())) {
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
        .if(body('plan_id').equals('1'))
        .notEmpty().withMessage('Loan Amount Type is required for GCLI products'),
    body('amount_loans_id')
        .if(body('type_of_proposal_id').equals('31'))
        .optional({ nullable: true, checkFalsy: true })
        .isInt({ min: 0 }).withMessage('Amount Loans ID must be a non-negative integer')
        .custom(async (value) => {
            if (value === null || value === undefined || value === '') return true;
            const lookups = await Financial.getLookupListByCategory('LOAN_AMOUNT_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid amount_loans_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('loans_amount')
        .if(body('type_of_proposal_id').equals('31'))
        .if(body('plan_id').equals('1'))
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 }).withMessage('Loans Amount must be a non-negative number'),
    body('max_loan_amount')
        .if(body('plan_id').equals('1'))
        .notEmpty().withMessage('Maximum Loan Amount is required for GCLI products')
        .isFloat({ min: 0 }).withMessage('Maximum Loan Amount must be a non-negative number'),
    body('min_loan_amount')
        .if(body('plan_id').equals('1'))
        .notEmpty().withMessage('Minimum Loan Amount is required for GCLI products')
        .isFloat({ min: 0 }).withMessage('Minimum Loan Amount must be a non-negative number')
        .custom((value, { req }) => {
            const max = req.body.max_loan_amount;
            if (max != null && value != null && Number(value) > Number(max)) {
                throw new Error('Minimum Loan Amount cannot be greater than Maximum Loan Amount');
            }
            return true;
        }),
    body('loan_portfolio_amount')
        .if(body('plan_id').equals('1'))
        .notEmpty().withMessage('Loan Portfolio Amount is required for GCLI products')
        .isFloat({ min: 0 }).withMessage('Loan Portfolio Amount must be a non-negative number'),

    // GCLI Age Bracket Amount Validations
    body('borrower_amount_18_65') // Base age range amount (e.g., 18-65)
        .if(body('plan_id').isIn(['1', '2', '3'])) // Apply for GCLI, GPA, GYRT
        .notEmpty().withMessage((value, { req }) => {
            const min = req.body.minimum_age || 18;
            const max = req.body.maximum_age || 65;
            return `Borrower Amount for age ${min}-${max} is required for this product type`;
        })
        .isFloat({ min: 0 }).withMessage((value, { req }) => {
            const min = req.body.minimum_age || 18;
            const max = req.body.maximum_age || 65;
            return `Borrower Amount for age ${min}-${max} must be a non-negative number`; // Message is fine
        }),
    body('borrower_amount_66_70') // Conditional age bracket amount
        .if(body('plan_id').isIn(['1', '2', '3'])) // Apply for GCLI, GPA, GYRT
        .custom((value, { req }) => {
            const isEnabled = String(req.body.borrower_age_66_70) === 'true';
            if (isEnabled) {
                if (value === null || value === undefined || value === '') {
                    throw new Error('Borrower Amount for 66-70 is required when this age bracket is selected');
                }
                if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                    throw new Error('Borrower Amount 66-70 must be a non-negative number');
                }
            } else if (value !== undefined && value !== null && value !== '') {
                throw new Error('Borrower Amount for 66-70 should not be provided when this age bracket is not selected');
            }
            return true;
        }),
    body('borrower_amount_71_75') // Conditional age bracket amount
        .if(body('plan_id').isIn(['1', '2', '3'])) // Apply for GCLI, GPA, GYRT
        .custom((value, { req }) => {
            const isEnabled = String(req.body.borrower_age_71_75) === 'true';
            if (isEnabled) {
                if (value === null || value === undefined || value === '') {
                    throw new Error('Borrower Amount for 71-75 is required when this age bracket is selected');
                }
                if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                    throw new Error('Borrower Amount 71-75 must be a non-negative number');
                }
            } else if (value !== undefined && value !== null && value !== '') {
                throw new Error('Borrower Amount for 71-75 should not be provided when this age bracket is not selected');
            }
            return true;
        }),
    body('borrower_amount_76_80') // Conditional age bracket amount
        .if(body('plan_id').isIn(['1', '2', '3'])) // Apply for GCLI, GPA, GYRT
        .custom((value, { req }) => {
            const isEnabled = String(req.body.borrower_age_76_80) === 'true';
            if (isEnabled) {
                if (value === null || value === undefined || value === '') {
                    throw new Error('Borrower Amount for 76-80 is required when this age bracket is selected');
                }
                if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                    throw new Error('Borrower Amount 76-80 must be a non-negative number');
                }
            } else if (value !== undefined && value !== null && value !== '') {
                throw new Error('Borrower Amount for 76-80 should not be provided when this age bracket is not selected');
            }
            return true;
        }),

    // Reject these fields for non-GCLI plans
    body(['max_loan_amount', 'min_loan_amount', 'loan_portfolio_amount', 'loans_amount'])
        .if(body('plan_id').not().equals('1'))
        .custom(val => {
            if (val != null && val !== '') throw new Error('Loan-specific amounts are only applicable for GCLI products.');
            return true;
        }),
    // Reject age bracket amounts for plans other than GCLI, GPA, GYRT
    body(['borrower_amount_18_65', 'borrower_amount_66_70', 'borrower_amount_71_75', 'borrower_amount_76_80'])
        .if(body('plan_id').not().isIn(['1', '2', '3']))
        .custom(val => {
            if (val != null && val !== '') throw new Error('Age bracket amounts are only applicable for selected product types (GCLI, GPA, GYRT).');
            return true;
        }),

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
                const numValue = Number(value);
                if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 1 || numValue > 60) {
                    throw new Error('sub_payment_term_id must be an integer between 1 and 60 only.');
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
        .custom(async (value, { req }) => {
            if (value === null || value === undefined) return true;
            const lookups = await Financial.getLookupListByCategory('COVERAGE_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid coverage_type_id (${value}). Valid options: ${validOptions}`);
            }

            const excelFile = req.files?.excel_file;

            // 1. Mandatory check removed here to allow separate upload via the /:id/upload-excel API.
            // The file is now optional during the initial 'create' or 'draft' phase.

            // 2. Validate file type if any file is uploaded
            if (excelFile) {
                const fileName = excelFile.originalFilename?.toLowerCase() || '';
                const mimeType = excelFile.mimetype || '';
                const isExcel = fileName.endsWith('.xlsx') || 
                                fileName.endsWith('.xls') || 
                                fileName.endsWith('.csv') || 
                                mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                                mimeType === 'application/vnd.ms-excel' ||
                                mimeType === 'text/csv';

                if (!isExcel) {
                    throw new Error('Invalid file type. Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed.');
                }
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

    body('affiliates')
        .optional({ nullable: true })
        .isArray().withMessage('affiliates must be an array of objects')
        .custom((affiliates) => {
            if (!affiliates) return true;
            for (const affiliate of affiliates) {
                if (typeof affiliate !== 'object' || affiliate === null) {
                    throw new Error('Each affiliate item must be an object');
                }
                if (!affiliate.company_name || typeof affiliate.company_name !== 'string' || affiliate.company_name.trim() === '') {
                    throw new Error('company_name is required for each affiliate and must be a non-empty string');
                }
                if (affiliate.company_name.length > 255) {
                    throw new Error('company_name must not exceed 255 characters');
                }
                if (affiliate.tin_number !== undefined && affiliate.tin_number !== null) {
                    if (typeof affiliate.tin_number !== 'string' && typeof affiliate.tin_number !== 'number') {
                        throw new Error('tin_number must be a string or number');
                    }
                    if (affiliate.tin_number.toString().length > 50) {
                        throw new Error('tin_number must not exceed 50 characters');
                    }
                }
                if (affiliate.address !== undefined && affiliate.address !== null) {
                    if (typeof affiliate.address !== 'string') {
                        throw new Error('address must be a string');
                    }
                    if (affiliate.address.length > 500) {
                        throw new Error('address must not exceed 500 characters');
                    }
                }
            }
            return true;
        }),

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
    body('business_nature_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Business Nature ID must be a positive integer (no letters or special characters allowed)'),
    body('sub_business_nature_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Sub-Business Nature ID must be a positive integer (no letters or special characters allowed)'),
    body('business_nature').optional().isLength({ max: 255 }).withMessage('Business Nature must not exceed 255 characters'),
    body('number_of_lives').optional().isInt({ min: 1 }).withMessage('Number of lives must be at least 1'),
    body('business_address').optional().isLength({ max: 500 }).withMessage('Business Address must not exceed 500 characters'),
    body('contact_number').optional({ nullable: true, checkFalsy: true }).isLength({ max: 20 }).withMessage('Contact Number must not exceed 20 characters'),
    body('fax_number').optional({ nullable: true, checkFalsy: true }).isLength({ max: 20 }).withMessage('Fax Number must not exceed 20 characters'),
    body('email').optional().isEmail().withMessage('Valid Email is required'),
    body('contact_person_salutation').optional().isLength({ max: 20 }).withMessage('Salutation must not exceed 20 characters'),
    body('contact_person_firstname').optional().isLength({ max: 100 }).withMessage('First Name must not exceed 100 characters'),
    body('contact_person_mi').optional({ nullable: true, checkFalsy: true }).isLength({ max: 5 }).withMessage('Middle Initial must not exceed 5 characters'),
    body('contact_person_lastname').optional().isLength({ max: 100 }).withMessage('Last Name must not exceed 100 characters'),
    body('designation').optional().isLength({ max: 255 }).withMessage('Designation must not exceed 255 characters'),
    body('proposal_addressee').optional().isLength({ max: 255 }).withMessage('Proposal Addressee must not exceed 255 characters'),
    body('addressee_designation').optional().isLength({ max: 255 }).withMessage('Addressee Designation must not exceed 255 characters'),

    // Age Profile
    body('minimum_age').optional().isInt({ min: 18, max: 65 }).withMessage('Minimum Age must be between 18 and 65'),
    body('maximum_age').optional().isInt({ min: 18, max: 65 }).withMessage('Maximum Age must be between 18 and 65')
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
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid group_classification_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('business_nature_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Business Nature ID must be a positive integer')
        .custom(async (value, { req }) => {
        if (!req.industryCache) req.industryCache = await Dropdown.getIndustries();
        const topLevel = req.industryCache.filter(i => i.parent_id === null);
        if (!topLevel.some(i => i.id === Number(value))) {
            const validOptions = topLevel.map(i => `${i.id} - ${i.name}`).join(', ');
            throw new Error(`Invalid business_nature_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('sub_business_nature_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Sub-Business Nature ID must be a positive integer')
        .custom(async (value, { req }) => {
        if (!req.industryCache) req.industryCache = await Dropdown.getIndustries();
        if (!req.industryCache.some(i => i.id === Number(value) && i.parent_id !== null)) {
            throw new Error(`Invalid sub_business_nature_id (${value}).`);
        }
        return true;
    }),
    /*
    body('business_type_id').optional().isInt({ min: 0 }).custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('BUSINESS_TYPE');
        if (!lookups.some(l => l.id === Number(value))) throw new Error(`Invalid business_type_id`);
        return true;
    }),
    */
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
    body('proposal_status_id').optional().isInt().custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('STATUS_PROPOSAL');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid proposal_status_id (${value}). Valid options: ${validOptions}`);
        }
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
// Evidence Notes validation
// -----------------------------
export const validateEvidenceNotes = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    body('evidence_notes')
        .notEmpty().withMessage('Evidence of Insurability notes are required')
        .isString().withMessage('Evidence of Insurability notes must be a string'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Total Premium validation
// -----------------------------
export const validateTotalPremium = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    body('total_annual_premium')
        .exists().withMessage('Total Annual Premium is required')
        .isFloat({ min: 0 }).withMessage('Total Annual Premium must be 0 or a positive number'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Max Amounts validation
// -----------------------------
export const validateMaxAmounts = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    body().custom(async (value, { req }) => {
        const applicationId = req.params.id;
        const app = await Financial.getApplicationById(applicationId);
        
        if (!app) {
            throw new Error(`Application with ID ${applicationId} not found.`);
        }

        if (req.body.max_amount_66_70 && !app.borrower_age_66_70) {
            throw new Error("Max Amount for 66-70 cannot be provided because this age bracket was not selected for this application.");
        }
        if (req.body.max_amount_71_75 && !app.borrower_age_71_75) {
            throw new Error("Max Amount for 71-75 cannot be provided because this age bracket was not selected for this application.");
        }
        if (req.body.max_amount_76_80 && !app.borrower_age_76_80) {
            throw new Error("Max Amount for 76-80 cannot be provided because this age bracket was not selected for this application.");
        }
        return true;
    }),
    body('max_amount_18_65').optional().isFloat({ min: 0 }).withMessage('Max Amount 18-65 must be 0 or positive'),
    body('max_amount_66_70').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Max Amount 66-70 must be 0 or positive'),
    body('max_amount_71_75').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Max Amount 71-75 must be 0 or positive'),
    body('max_amount_76_80').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Max Amount 76-80 must be 0 or positive'),
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

            // Allow rate input for Checking (5), Pending (8), Rating (13), and Approved (14)
            if (![5, 8, 13, 14].includes(Number(app.status_id))) {
                throw new Error('Only proposals with a status of Pending or Rating can be computed.');
            }

            const planId = Number(app.plan_id);
            const numLives = Number(app.number_of_lives);
            const keys = ['18-65', '66-70', '71-75', '76-80'];
            let hasData = false;
            const ADDITIONAL_LIFE_RIDER_ID = '10'; 
            
            // Fetch selected riders for GPA/GYRT validation
            const selectedAppRiders = await Financial.getApplicationRiders(applicationId);
            
            // Create a lookup map for descriptive error messages
            const riderNameMap = new Map(selectedAppRiders.map(r => [r.rider_id.toString(), r.acronym || r.rider_name]));

            const selectedRiderIds = new Set(riderNameMap.keys());
            const selectedRiderLabels = Array.from(riderNameMap.entries()).map(([id, name]) => `${id} (${name})`).join(', ');
            const scaleLabel = numLives <= 30 ? "Scale 1 (<= 30 lives)" : "Scale 2 (>= 31 lives)";
            const errorSuffix = `[Process: ${app.plan_name || 'Product'} ${scaleLabel} (Actual lives: ${numLives}), Required Plan: ${app.basic_plan_id} (${app.basic_plan_name}), Required Riders: ${selectedRiderLabels}]`;

            // For GCLI (Plan 1), retrieve the loan maturity (months) to validate array lengths and sequences
            const maturity = planId === 1 ? Number(app.sub_payment_term_id) : 0;
            if (planId === 1 && !maturity) {
                throw new Error('Loan maturity is missing for this GCLI application. Please ensure payment terms are defined in the application.');
            }

            for (const key of keys) {
                const isSeniorBracket = key !== '18-65';
                const bracketFlag = isSeniorBracket ? `borrower_age_${key.replace('-', '_')}` : null;
                const isEnabledInApp = isSeniorBracket ? !!app[bracketFlag] : true;

                const data = req.body[key] || (key === '18-65' ? req.body['18-64'] : null);

                // Check Requirement: If enabled in application, must be present in request body
                if (isEnabledInApp && !data) {
                    throw new Error(`Rates for age bracket '${key}' are required because it is active for this application.`);
                }

                // Check Restriction: If NOT enabled in application, must NOT be in request body
                if (isSeniorBracket && !isEnabledInApp && data) {
                    throw new Error(`Rates for '${key}' cannot be added because the age bracket was not selected in the application.`);
                }

                if (data) {
                    hasData = true;

                    // Branch A: Handle Nested Age Objects (Senior specific pricing)
                    const isNestedObject = !Array.isArray(data) && typeof data === 'object' && data !== null;
                    // GYRT and GPA require nested objects (Scale 1/2 logic or Seniors)
                    const shouldBeNested = isSeniorBracket || [1, 2, 3].includes(planId);

                    if (shouldBeNested && isNestedObject) {
                        // Enforce that all specific ages within the bracket range are provided
                        const [startAge, endAge] = key.split('-').map(Number);
                        const missingAges = []; // This check is for the keys in the object, not the items within each age array.

                        if ([1, 2, 3].includes(planId)) {
                            const hasAgeKeys = Object.keys(data).some(k => k.startsWith('age_'));
                            // For GCLI (Plan 1), basic_plan is mandatory for the main bracket if not using detailed ages.
                            if (planId === 1 && key === '18-65' && !hasAgeKeys) {
                                if (!data['basic_plan']) missingAges.push('basic_plan');
                            }

                            // For GCLI, riders can be in a separate 'rates' key OR nested inside 'basic_plan' items.
                            if (planId === 1 && key === '18-65' && selectedRiderIds.size > 0) {
                                const hasNestedRiders = data['basic_plan']?.some(item => item.riders && item.riders.length > 0);
                                if (!data['rates'] && !hasNestedRiders) missingAges.push('rates');
                            }

                            if (key === '18-65') {
                                if (planId === 2 || planId === 3) {
                                    const hasDetailedAges = Object.keys(data).some(k => k.startsWith('age_'));
                                    if (numLives <= 30 || hasDetailedAges) {
                                        const expectedBands = ['age_18_24', 'age_25_29', 'age_30_34'];
                                        expectedBands.forEach(band => { if (!data[band]) missingAges.push(band); });
                                        for (let age = 35; age <= 65; age++) { if (!data[`age_${age}`]) missingAges.push(`age_${age}`); }
                                    } else if (numLives > 30 && !data['rates']) {
                                        missingAges.push('rates');
                                    }
                                }
                            }
                        }

                        if (isSeniorBracket || (planId === 1 && key !== '18-65')) {
                            for (let age = startAge; age <= endAge; age++) {
                                if (!data[`age_${age}`]) missingAges.push(`age_${age}`);
                            }
                        }

                        if (missingAges.length > 0) {
                            throw new Error(`Data for bracket '${key}' is incomplete. Missing entries: ${missingAges.join(', ')}. ${errorSuffix}`);
                        }

                        for (const ageKey in data) {
                            if (ageKey === 'basic_plan_id') continue; 

                            // Validate the basic plan ID at the root of the bracket object for all products
                            const bId = data.basic_plan_id;
                            if (bId !== undefined) {
                                if (!/^\d+$/.test(String(bId))) throw new Error(`basic_plan_id in ${key} must be strictly numeric. ${errorSuffix}`);
                                if (app.basic_plan_id && Number(bId) !== Number(app.basic_plan_id)) {
                                    throw new Error(`Invalid basic_plan_id (${bId}) in ${key}. Expected ID: ${app.basic_plan_id}. ${errorSuffix}`);
                                }
                            }

                            const ageItems = data[ageKey];
                            if (ageKey.startsWith('age_') || ageKey === 'rates' || ageKey === 'basic_plan') {
                                if (!Array.isArray(ageItems)) {
                                    throw new Error(`Data for '${ageKey}' in bracket '${key}' must be an array of objects [ { ... } ]. ${errorSuffix}`);
                                }
                            } else {
                                continue;
                            }

                            // GCLI specific validation for term items (basic_plan, rates for riders, or age_XX keys)
                            const isGcliBaseArray = planId === 1 && key === '18-65' && (ageKey === 'basic_plan' || ageKey === 'rates');
                            const isGcliSeniorAgeArray = planId === 1 && isSeniorBracket && ageKey.startsWith('age_');

                            if (isGcliBaseArray || isGcliSeniorAgeArray) {
                                if (ageItems.length === 0) throw new Error(`'${ageKey}' in ${key} cannot be empty.`);
                                
                                // Validate the basic plan ID at the root of the bracket object
                                const bId = data.basic_plan_id;
                                if (bId !== undefined) {
                                    if (!/^\d+$/.test(String(bId))) throw new Error(`basic_plan_id in ${key} must be strictly numeric. ${errorSuffix}`);
                                    if (app.basic_plan_id && Number(bId) !== Number(app.basic_plan_id)) {
                                        throw new Error(`Invalid basic_plan_id (${bId}) in ${key}. Expected ID: ${app.basic_plan_id}. ${errorSuffix}`);
                                    }
                                }

                                const expectedLength = isSeniorBracket ? Math.min(maturity, 12) : maturity;
                                if (ageItems.length !== expectedLength) {
                                    throw new Error(`GCLI '${ageKey}' for ${key} requires exactly ${expectedLength} items. (Input: ${ageItems.length}, Expected: ${expectedLength} based on loan maturity ${maturity}${isSeniorBracket && maturity > 12 ? ' capped at 12 for senior brackets' : ''}). ${errorSuffix}`);
                                }

                                const allRiderIdsInBracket = new Set();
                                ageItems.forEach((item, idx) => {
                                    const rate = [item.basic_rate, item.rate, item.rider_rate].find(r => r !== undefined && r !== null);
                                    
                                    if (item.term_of_months === undefined || rate === undefined) {
                                        throw new Error(`Invalid format in ${ageKey} for ${key}. Each item must contain 'term_of_months' and a valid rate value.`);
                                    }
                                    if (Number(item.term_of_months) !== (idx + 1)) {
                                        throw new Error(`${ageKey} months in ${key} must be sequential. Expected ${idx + 1} at position ${idx + 1}.`);
                                    }
                                    
                                    if (item.riders && Array.isArray(item.riders)) {
                                        if (isSeniorBracket) {
                                            throw new Error(`GCLI senior age entries (${ageKey}) cannot contain riders. ${errorSuffix}`);
                                        }
                                        item.riders.forEach(rider => {
                                            const rId = rider.rider_id?.toString();
                                            if (rId) allRiderIdsInBracket.add(rId);
                                            if (!selectedRiderIds.has(rId)) {
                                                throw new Error(`GCLI ${key} month ${item.term_of_months} contains rider ID ${rId}, which was not selected during application creation. ${errorSuffix}`);
                                            }
                                            if (!/^[a-zA-Z0-9_-]+$/.test(rId)) {
                                                throw new Error(`Rider ID ${rId} in ${key} contains invalid characters. Only alphanumeric, underscores, and hyphens are allowed.`);
                                            }
                                            if (rider.rider_rate === undefined || rider.rider_rate === null || rider.rider_rate === '') {
                                                throw new Error(`Rider rate is missing for rider ID ${rId} in ${key} month ${item.term_of_months}.`);
                                            }
                                        });
                                    }
                                });

                                // After iterating all monthly items, ensure all selected riders are present in the 18-65 bracket
                                if (planId === 1 && key === '18-65' && selectedRiderIds.size > 0) {
                                    for (const rid of selectedRiderIds) {
                                        if (!allRiderIdsInBracket.has(rid)) {
                                            const label = riderNameMap.get(rid.toString()) || `Rider ID ${rid}`;
                                            throw new Error(`GCLI ${key} is missing a rate for rider ${label}. ${errorSuffix}`);
                                        }
                                    }
                                }
                                continue;
                            }

                            // GYRT/GPA specific validation (for basic_plan, rates, age_XX keys)
                            if ([2, 3].includes(planId)) {
                                if (planId === 3 && isSeniorBracket) {
                                    throw new Error(`Rates for age bracket ${key} are disabled for GPA products.`);
                                }

                                if (ageItems.length === 0) throw new Error(`'${ageKey}' in ${key} cannot be empty. ${errorSuffix}`);

                                // Determine required riders for this bracket/age
                                let requiredRiderIds = new Set(selectedRiderIds);
                                if (planId === 2 && isSeniorBracket) {
                                    requiredRiderIds = new Set();
                                    if (selectedRiderIds.has(ADDITIONAL_LIFE_RIDER_ID)) requiredRiderIds.add(ADDITIONAL_LIFE_RIDER_ID);
                                }

                                // Support nested structure: [{ basic_rate, riders: [...] }]
                                const isNewStructure = ageItems[0] && (ageItems[0].basic_rate !== undefined || Array.isArray(ageItems[0].riders));

                                if (isNewStructure) {
                                    ageItems.forEach(item => {
                                        const basicRate = item.basic_rate !== undefined ? item.basic_rate : (item.rider_id ? null : item.rate);
                                        if (basicRate === undefined || basicRate === null || basicRate === '') {
                                            throw new Error(`The basic_rate is missing in ${ageKey} for bracket ${key}. ${errorSuffix}`);
                                        }
                                        
                                        const inputRiderIds = new Set();
                                        if (Array.isArray(item.riders)) {
                                            item.riders.forEach(rider => {
                                                const rId = rider.rider_id?.toString();
                                                if (rId) {
                                                    inputRiderIds.add(rId);
                                                    const rRate = [rider.rider_rate, rider.rate].find(r => r !== undefined && r !== null);
                                                    if (rRate === undefined || rRate === null || rRate === '') {
                                                        throw new Error(`Rider rate is missing for rider ID ${rId} in ${ageKey}. ${errorSuffix}`);
                                                    }
                                                }
                                            });
                                        }

                                        for (const rid of requiredRiderIds) {
                                            if (!inputRiderIds.has(rid)) {
                                                const label = riderNameMap.get(rid.toString()) || `Rider ID ${rid}`;
                                                throw new Error(`${planId === 2 ? 'GYRT' : 'GPA'} ${ageKey} is missing a rate for ${label}. ${errorSuffix}`);
                                            }
                                        }
                                        for (const rid of inputRiderIds) {
                                            if (!requiredRiderIds.has(rid)) {
                                                const label = riderNameMap.get(rid.toString()) || `Rider ID ${rid}`;
                                                if (planId === 2 && isSeniorBracket) {
                                                    throw new Error(`GYRT senior age bracket ${key} (${ageKey}) contains ${label}, which is not allowed for seniors (only ALCR ID 10 is accepted). ${errorSuffix}`);
                                                }
                                                throw new Error(`${planId === 2 ? 'GYRT' : 'GPA'} ${ageKey} contains unselected or invalid rider ID ${rid}. ${errorSuffix}`);
                                            }
                                        }
                                    });
                                } else {
                                    if (ageKey === 'basic_plan') {
                                        ageItems.forEach(item => {
                                            const rate = [item.basic_rate, item.rate].find(r => r !== undefined && r !== null);
                                            if (item.basic_plan_id && Number(item.basic_plan_id) !== Number(app.basic_plan_id)) {
                                                throw new Error(`Invalid basic_plan_id (${item.basic_plan_id}) in basic_plan for ${key}. Expected: ${app.basic_plan_id}. ${errorSuffix}`);
                                            }
                                            if (rate === undefined || rate === null || rate === '') throw new Error(`Rate missing in basic_plan for ${key}.`);
                                        });
                                    } else {
                                        const inputRiderIds = new Set(ageItems.map(item => (item.rider_id !== undefined && item.rider_id !== null) ? item.rider_id.toString() : '0'));
                                        for (const rid of requiredRiderIds) {
                                            if (!inputRiderIds.has(rid)) throw new Error(`${planId === 2 ? 'GYRT' : 'GPA'} ${ageKey} is missing a rate for ${riderNameMap.get(rid) || rid}. ${errorSuffix}`);
                                        }
                                        ageItems.forEach(item => {
                                            if (item.rate === undefined || item.rate === null || item.rate === '') throw new Error(`Rate missing in ${ageKey}.`);
                                        });
                                    }
                                }
                            }
                        }
                    } else { // Branch B: Standard Flat Array Logic (18-64 or legacy senior input)
                        if (shouldBeNested) {
                            throw new Error(`Data for '${key}' must be a nested age/band object for this product configuration (GCLI/GYRT/GPA). ${errorSuffix}`);
                        }

                        if (!Array.isArray(data)) throw new Error(`Data for ${key} must be an array.`);

                        if (planId === 3) { // GPA
                            if (isSeniorBracket) throw new Error(`Rates for ${key} are disabled for GPA products.`);
                            data.forEach((item, index) => {
                                if (!selectedRiderIds.has(item.rider_id ? item.rider_id.toString() : '')) {
                                    throw new Error(`GPA rates for ${key}, item ${index + 1}: Invalid or unselected rider_id (${item.rider_id || 'missing'}).`);
                                }
                            });
                        }
                    }
                }
            }
            if (!hasData) {
                throw new Error('At least one rate group (18-65, 66-70, 71-75, 76-80) is required.');
            }
            return true;
        }),
    body('reporting_to_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Reporting To ID must be a positive integer')
        .custom(async (value, { req }) => {
            if (value == null) return true;
            
            if (Number(value) === Number(req.params.userId)) {
                throw new Error('A user cannot report to themselves.');
            }

            const superiors = await User.getPotentialSuperiors();
            const validIds = superiors.map(s => s.user_id);
            if (!validIds.includes(Number(value))) {
                const superiorList = superiors.map(s => `${s.user_id} - ${s.firstname} ${s.lastname} (${s.roleName})`).join(', ');
                throw new Error(
                    `Invalid reporting_to_id (${value}). Please select one of the following: ${superiorList}`
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
    body('group_name')
        .optional()
        .isLength({ max: 255 }).withMessage('Group Name must not exceed 255 characters')
        .custom(async (value, { req }) => {
            const appId = req.params.id;
            const proposalStatusId = req.body.proposal_status_id !== undefined 
                ? Number(req.body.proposal_status_id) 
                : Number(req.existingApplication?.proposal_status_id);
            
            const RENEW_STATUS_ID = 61;
            const NEW_STATUS_ID = 60;

            const existingGroup = await Financial.getApplicationByGroupName(value);

            // If another record exists with this name (ignoring the current one we are updating)
            if (existingGroup && Number(existingGroup.application_id) !== Number(appId)) {
                if (proposalStatusId === NEW_STATUS_ID && Number(existingGroup.status_id) !== 6) {
                    throw new Error(`An active application for "${value}" already exists. Please select "Renew" if you wish to process a renewal.`);
                }

                if (proposalStatusId === RENEW_STATUS_ID) {
                    // Authorization Check for Renewal Target
                    const currentUser = req.user;
                    const owner = await User.getUserById(existingGroup.user_id);
                    const isOwnerActive = owner && owner.is_active;
                    const isCreator = Number(currentUser.user_id) === Number(existingGroup.user_id);

                    if (!isCreator) {
                        if (isOwnerActive) {
                            throw new Error(`Renewal failed. The original creator ("${owner.firstname} ${owner.lastname}") is still an active user. Only they can process this renewal.`);
                        }

                        const isAuthorizedRole = currentUser && (
                            [1, 2, 3, 15, 19].includes(Number(currentUser.role_id)) || 
                            ['Super Admin', 'Team Leader', 'Group Sales & Marketing Head', 'Assistant Vice President', 'Corporate Financial Executive'].includes(currentUser.roleName)
                        );

                        if (!isAuthorizedRole) {
                            throw new Error(`Renewal failed. You do not have permission to renew this application for the inactive original agent.`);
                        }
                    }

                    // If they are trying to "Renew" but pointing to another group name, 
                    // check if THAT target group is at least 1 year old.
                    const createdAt = new Date(existingGroup.created_at);
                    const oneYearAgo = new Date();
                    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

                    if (createdAt > oneYearAgo) {
                        const formattedDate = createdAt.toLocaleDateString();
                        throw new Error(`Renewal failed. The target group "${value}" was created on ${formattedDate}. You can only renew applications that are at least 1 year old.`);
                    }
                }
            }
            return true;
        }),
    body('business_nature_id')
        .optional()
        .isInt({ min: 1 }).withMessage('Business Nature ID must be a positive integer (no letters or special characters allowed)')
        .custom(async (value, { req }) => {
        if (!req.industryCache) req.industryCache = await Dropdown.getIndustries();
        const topLevelIndustries = req.industryCache.filter(i => i.parent_id === null);
        const item = topLevelIndustries.find(i => i.id === Number(value));
        if (!item) {
            const validOptions = topLevelIndustries.map(i => `${i.id} - ${i.name}`).join(', ');
            throw new Error(`Invalid business_nature_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    body('sub_business_nature_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('Sub-Business Nature ID must be a positive integer (no letters or special characters allowed)')
        .custom(async (value, { req }) => {
        if (value == null) return true;
        
        const parentId = req.body.business_nature_id !== undefined 
            ? Number(req.body.business_nature_id) 
            : req.existingApplication?.business_nature_id;
        
        if (!parentId) throw new Error('business_nature_id is required');

        const childId = Number(value);
        if (!req.industryCache) req.industryCache = await Dropdown.getIndustries();

        const validChildren = req.industryCache.filter(i => i.parent_id === parentId);
        const item = validChildren.find(i => i.id === childId);
        if (!item) {
            const validOptions = validChildren.length > 0 ? validChildren.map(i => `${i.id} - ${i.name}`).join(', ') : 'none available';
            throw new Error(`Invalid sub_business_nature_id (${childId}). Valid options for parent ID ${parentId}: ${validOptions}`);
        }
        return true;
    }),
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
    body('minimum_age').optional().isInt({ min: 18, max: 65 }).withMessage('Minimum Age must be between 18 and 65'),
    body('maximum_age').optional().isInt({ min: 18, max: 65 }).withMessage('Maximum Age must be between 18 and 65')
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
    /*
    body('business_type_id').optional().isInt({ min: 0 }).withMessage('business_type_id must be a non-negative integer').custom(async (value) => {
        const lookups = await Financial.getLookupListByCategory('BUSINESS_TYPE');
        if (!lookups.some(l => l.id === Number(value))) {
            const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
            throw new Error(`Invalid business_type_id (${value}). Valid options: ${validOptions}`);
        }
        return true;
    }),
    */
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
    body('proposal_status_id')
        .optional()
        .isInt()
        .custom(async (value, { req }) => {
            if (!req.lookupCache) req.lookupCache = {};
            if (!req.lookupCache.STATUS_PROPOSAL) {
                req.lookupCache.STATUS_PROPOSAL = await Financial.getLookupListByCategory('STATUS_PROPOSAL');
            }
            const lookups = req.lookupCache.STATUS_PROPOSAL;
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid proposal_status_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('channel_name')
        .if(body('channel_type_id').exists())
        .custom((value, { req }) => {
            const channelId = Number(req.body.channel_type_id);
            if ([56, 57, 58].includes(channelId) && (!value || value.trim() === '')) {
                throw new Error('Channel name is required for Agent, Broker and General Agency.');
            }
            return true;
        }),
    body('channel_number')
        .if(body('channel_type_id').exists())
        .custom((value, { req }) => {
            const channelId = Number(req.body.channel_type_id);
            if ([56, 57, 58].includes(channelId) && (!value || value.trim() === '')) {
                throw new Error('Channel contact number is required for Agent, Broker and General Agency.');
            }
            return true;
        })
        .optional({ nullable: true, checkFalsy: true })
        .isLength({ max: 50 }).withMessage('Channel contact number must not exceed 50 characters'),
    body('channel_email')
        .if(body('channel_type_id').exists())
        .custom((value, { req }) => {
            const channelId = Number(req.body.channel_type_id);
            if ([56, 57, 58].includes(channelId) && (!value || value.trim() === '')) {
                throw new Error('Channel email is required for Agent, Broker and General Agency.');
            }
            return true;
        })
        .optional({ nullable: true, checkFalsy: true })
        .isEmail().withMessage('Channel email must be a valid email address')
        .isLength({ max: 255 }).withMessage('Channel email must not exceed 255 characters'),

    body('commission_rate').optional().isFloat({ min: 0 }).withMessage('Commission Rate must be 0 or a positive number'),
    body('service_fee').optional().isFloat({ min: 0 }).withMessage('Service Fee must be 0 or a positive number'),
    body('total_annual_premium').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Total Annual Premium must be 0 or a positive number'),

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
                        if (riderId === 8 && amount !== 0 && (amount < 100 || amount > 300)) throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
                        if (riderId === 9 && amount !== 0 && amount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
                        if (riderId === 11 && amount !== 0 && amount !== 50000) throw new Error('Burial (Memorial/Service) amount must be fixed at 50,000.');
                        if (riderId === 13 && unit !== 0 && ![1, 2].includes(unit)) throw new Error('Group Dengue Rider must be 1 Unit (30,000) or 2 Units (60,000).');
                        if ([6, 7, 10, 12].includes(riderId) && amount < 0) throw new Error(`${riderDef.rider_name} requires a valid amount.`);
                    } else {
                        const name = riderDef.rider_name.trim();
                        if (name === 'Group Accidental Medical Expense Reimbursement Rider' && amount !== 0 && amount < 500) {
                            throw new Error(`${name} amount must be least 500 minimum.`);
                        } else if (name === 'Group Hospital Income Rider' && amount !== 0 && (amount < 100 || amount > 300)) {
                            throw new Error(`${name} amount must be between 100 and 300.`);
                        } else if (name === 'Burial (Memorial/Service)' && amount !== 0 && amount !== 50000) {
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
        .custom(async (value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            if (planId === 1 && (value === null || value === '')) {
                throw new Error('Loan Amount Type is required for GCLI products and cannot be empty.');
            }
            if (value === null || value === undefined || value === '') return true;
            const lookups = await Financial.getLookupListByCategory('LOAN_AMOUNT_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid amount_loans_id (${value}). Valid options: ${validOptions}`);
            }
            return true;
        }),
    body('loans_amount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Loans Amount must be a non-negative number')
        .custom((value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            const proposalId = req.body.type_of_proposal_id !== undefined ? Number(req.body.type_of_proposal_id) : req.existingApplication?.type_of_proposal_id;

            if (planId !== 1 && value != null) {
                throw new Error('Loans Amount is only applicable for GCLI products.');
            }
            return true;
        }),

    // GCLI Age Bracket Amount Validations (Update)
    body('borrower_amount_18_65').optional({ nullable: true }).isFloat({ min: 0 })
        .custom((value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            if (planId === 1 && (value === null || value === '')) throw new Error('Borrower Amount for base age range is required for GCLI.');
            return true;
        }),
    
    // Ensure amounts are provided if the bracket is enabled (either in body or existing record)
    ...['66_70', '71_75', '76_80'].map(suffix => 
        body(`borrower_amount_${suffix}`).optional({ nullable: true }).isFloat({ min: 0 })
            .custom((value, { req }) => {
                const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
                const isEnabled = req.body[`borrower_age_${suffix}`] !== undefined 
                    ? String(req.body[`borrower_age_${suffix}`]) === 'true'
                    : !!req.existingApplication?.[`borrower_age_${suffix}`];

                if ([1, 2, 3].includes(planId)) {
                    if (isEnabled && (value === null || value === '')) {
                        throw new Error(`Borrower Amount for ${suffix.replace('_', '-')} is required when this bracket is active.`);
                    }
                    if (!isEnabled && value != null && value !== '') {
                        throw new Error(`Borrower Amount for ${suffix.replace('_', '-')} should not be provided when this age bracket is not selected.`);
                    }
                }
                return true;
            })
    ),
    // Reject age bracket amounts for plans other than GCLI, GPA, GYRT
    body(['borrower_amount_18_65', 'borrower_amount_66_70', 'borrower_amount_71_75', 'borrower_amount_76_80']).optional({ nullable: true })
        .custom((value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            if (value != null && ![1, 2, 3].includes(planId)) {
                throw new Error('Age bracket amounts are only applicable for selected product types (GCLI, GPA, GYRT).');
            }
            return true;
        }),

    // GCLI Specific Loan Amount Validations (Update)
    body('max_loan_amount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Maximum Loan Amount must be a non-negative number')
        .custom((value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            if (planId !== 1 && value != null) {
                throw new Error('Maximum Loan Amount is only applicable for GCLI products.');
            }
            return true;
        }),
    body('min_loan_amount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Minimum Loan Amount must be a non-negative number')
        .custom((value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            if (planId !== 1 && value != null) {
                throw new Error('Minimum Loan Amount is only applicable for GCLI products.');
            }
            
            const currentMax = req.body.max_loan_amount !== undefined 
                ? req.body.max_loan_amount 
                : req.existingApplication?.max_loan_amount;

            if (currentMax != null && value != null && Number(value) > Number(currentMax)) {
                throw new Error('Minimum Loan Amount cannot be greater than Maximum Loan Amount');
            }
            return true;
        }),
    body('loan_portfolio_amount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Loan Portfolio Amount must be a non-negative number')
        .custom((value, { req }) => {
            const planId = req.body.plan_id !== undefined ? Number(req.body.plan_id) : req.existingApplication?.plan_id;
            if (planId !== 1 && value != null) {
                throw new Error('Loan Portfolio Amount is only applicable for GCLI products.');
            }
            return true;
        }),

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
                const numValue = Number(value);
                if (isNaN(numValue) || !Number.isInteger(numValue) || numValue < 1 || numValue > 60) {
                    throw new Error('sub_payment_term_id must be an integer between 1 and 60 only.');
                }
            } else if (value != null) {
                throw new Error('sub_payment_term_id must be null for this payment term.');
            }
            return true;
        }),
    body('coverage_type_id').optional({ nullable: true }).isInt({ min: 0 }).withMessage('Coverage Type ID must be a non-negative integer')
        .custom(async (value, { req }) => {
            if (value === null || value === undefined) return true;
            const lookups = await Financial.getLookupListByCategory('COVERAGE_TYPE');
            if (!lookups.some(l => l.id === Number(value))) {
                const validOptions = lookups.map(l => `${l.id} - ${l.name}`).join(', ');
                throw new Error(`Invalid coverage_type_id (${value}). Valid options: ${validOptions}`);
            }

        const excelFile = req.files?.excel_file;
        const hasExistingFile = req.existingApplication?.excel_file_path;

        // 1. Mandatory check removed here to allow separate upload via the /:id/upload-excel API.
        /*
        if (Number(value) === 34 && !excelFile && !hasExistingFile) {
            throw new Error('An Excel file upload is required when selecting "By Salary Rank".');
        }
        */

        // 2. Validate file type if any file is uploaded
        if (excelFile) {
            const fileName = excelFile.originalFilename?.toLowerCase() || '';
            const mimeType = excelFile.mimetype || '';
            const isExcel = fileName.endsWith('.xlsx') || 
                            fileName.endsWith('.xls') || 
                            fileName.endsWith('.csv') || 
                            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                            mimeType === 'application/vnd.ms-excel' ||
                            mimeType === 'text/csv';

            if (!isExcel) {
                throw new Error('Invalid file type. Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed.');
            }
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
    /*
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
    */

    // Optional status
    body('status_id').optional().isInt({ min: 0 }),

    body('notes')
        .optional({ nullable: true })
        .isString().withMessage('Notes must be a string'),

    body('affiliates')
        .optional({ nullable: true })
        .isArray().withMessage('affiliates must be an array of objects')
        .custom((affiliates) => {
            if (!affiliates) return true;
            for (const affiliate of affiliates) {
                if (typeof affiliate !== 'object' || affiliate === null) {
                    throw new Error('Each affiliate item must be an object');
                }
                if (!affiliate.company_name || typeof affiliate.company_name !== 'string' || affiliate.company_name.trim() === '') {
                    throw new Error('company_name is required for each affiliate and must be a non-empty string');
                }
                if (affiliate.company_name.length > 255) {
                    throw new Error('company_name must not exceed 255 characters');
                }
                if (affiliate.tin_number !== undefined && affiliate.tin_number !== null) {
                    if (typeof affiliate.tin_number !== 'string' && typeof affiliate.tin_number !== 'number') {
                        throw new Error('tin_number must be a string or number');
                    }
                    if (affiliate.tin_number.toString().length > 50) {
                        throw new Error('tin_number must not exceed 50 characters');
                    }
                }
                if (affiliate.address !== undefined && affiliate.address !== null) {
                    if (typeof affiliate.address !== 'string') {
                        throw new Error('address must be a string');
                    }
                    if (affiliate.address.length > 500) {
                        throw new Error('address must not exceed 500 characters');
                    }
                }
            }
            return true;
        }),

    // Validation result
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });
        next();
    }
];

// -----------------------------
// Excel Upload validation
// -----------------------------
export const validateExcelUpload = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    (req, res, next) => {
        const excelFile = req.files?.excel_file;
        if (!excelFile) {
            return res.status(400).json({ status: false, errors: [{ msg: 'excel_file is required.' }] });
        }

        const fileName = excelFile.originalFilename?.toLowerCase() || '';
        const mimeType = excelFile.mimetype || '';
        const isExcel = fileName.endsWith('.xlsx') || 
                        fileName.endsWith('.xls') || 
                        fileName.endsWith('.csv') || 
                        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        mimeType === 'application/vnd.ms-excel' ||
                        mimeType === 'text/csv';

        if (!isExcel) {
            return res.status(400).json({ status: false, errors: [{ msg: 'Invalid file type. Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed.' }] });
        }
        next();
    }
];

// -----------------------------
// Installation Requirements Validation
// -----------------------------
export const validateInstallationRequirements = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    (req, res, next) => {
        const validMetadata = [
            { id: 1, key: 'signed_proposal', label: 'SIGNED PROPOSAL/CONFORME' },
            { id: 2, key: 'group_app', label: 'APPLICATION FOR GROUP INSURANCE' },
            { id: 3, key: 'dti', label: 'DTI (FOR SOLE PROPRIETORSHIP)' },
            { id: 4, key: 'sec_reg', label: 'SEC CERTIFICATE OF REGISTRATION' },
            { id: 5, key: 'articles_of_inc', label: 'ARTICLES OF INCORPORATION' },
            { id: 6, key: 'by_laws', label: 'BY-LAWS' },
            { id: 7, key: 'business_permit', label: 'BUSINESS PERMIT' },
            { id: 8, key: 'masterlist', label: 'MASTERLIST (PDF & Excel Copy)' },
            { id: 9, key: 'auth_id', label: 'Copy of ID of the Authorized Signatory' }
        ];
        
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ status: false, message: 'No files provided for upload.' });
        }

        const validIds = validMetadata.map(m => m.id.toString());
        const validKeys = validMetadata.map(m => m.key);
        const validOptions = validMetadata.map(m => `${m.id} (${m.label})`).join(', ');

        const uploadedKeys = Object.keys(req.files);
        for (const key of uploadedKeys) {
            if (!validIds.includes(key) && !validKeys.includes(key)) {
                return res.status(400).json({
                    status: false,
                    message: `Invalid requirement ID or Key (${key}). Valid options: ${validOptions}`
                });
            }
        }
        next();
    }
];

// -----------------------------
// Extension Request Validations
// -----------------------------

// Validation for viewing extension requests (Leadership roles only)
export const validateGetExtensionRequests = [
    (req, res, next) => {
        const loggedInUser = req.user;
        const isAuthorized = [1, 2, 15, 19].includes(Number(loggedInUser.role_id)) || 
            ['Super Admin', 'Team Leader', 'Assistant Vice President', 'Group Sales & Marketing Head'].includes(loggedInUser.roleName);

        if (!isAuthorized) {
            return res.status(403).json({
                status: false,
                message: 'Access Denied: You do not have the capacity to view extension requests. This feature is restricted to Team Leaders and Super Admins.'
            });
        }
        next();
    }
];

// Validation for requesting an extension
export const validateRequestExtension = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });

        try {
            const userId = req.user.user_id;
            const appId = req.params.id;

            const app = await Financial.getApplicationById(appId);
            if (!app) {
                return res.status(404).json({ status: false, message: 'Application not found' });
            }

            // Authorization Logic: Creator must have a valid role or administrative privileges
            const userRoleName = req.user.roleName?.trim();
            const userRoleId = Number(req.user.role_id);

            const isSuperAdmin = userRoleName === 'Super Admin' || userRoleId === 15;
            const isTeamLeader = userRoleName === 'Team Leader' || userRoleId === 2;
            const isCFE = userRoleName === 'Corporate Financial Executive' || userRoleId === 3;
            const isOwner = Number(app.user_id) === Number(userId);

            if (!isOwner || (!isCFE && !isSuperAdmin && !isTeamLeader)) {
                return res.status(403).json({
                    status: false,
                    message: 'Access Denied: Only the original creator with a valid role (CFE, Team Leader, or Super Admin) can request an extension.'
                });
            }

            if (app.extension_requested) {
                return res.status(400).json({
                    status: false,
                    message: 'An extension request is already pending for this application.'
                });
            }

            // Business Rule: Only allow extension requests when 1-5 days are remaining
            const now = new Date();
            const currentStatus = Number(app.status_id);
            if (currentStatus === 7 || currentStatus === 6) {
                return res.status(400).json({
                    status: false,
                    message: 'Extension requests are not available for Booked or Closed proposals.'
                });
            }

            // can request for extension if 5 days or less before expiry date. 
            /*
            const expiryDate = app.expiry_date ? new Date(app.expiry_date) : new Date(new Date(app.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
            const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

            if (diffDays > 5 || diffDays < 1) {
                const daysMsg = diffDays < 1 ? 'The proposal has already expired or is expiring today.' : `It still has ${diffDays} days left.`;
                return res.status(400).json({
                    status: false,
                    message: `Extension request denied. You can only request an extension when there are 5 days or fewer remaining. ${daysMsg}`
                });
            }
            */

            next();
        } catch (error) {
            console.error('validateRequestExtension error:', error);
            return res.status(500).json({ status: false, message: 'Error checking extension request validity' });
        }
    }
];

// Validation for approving or rejecting an extension
export const validateApproveExtension = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });

        const loggedInUser = req.user;
        const isAuthorized = [1, 2, 15, 19].includes(Number(loggedInUser.role_id)) || 
            ['Super Admin', 'Team Leader', 'Assistant Vice President', 'Group Sales & Marketing Head'].includes(loggedInUser.roleName);

        if (!isAuthorized) {
            return res.status(403).json({ status: false, message: 'Access Denied: You do not have the capacity to approve extension requests. This action is reserved for Team Leaders and Super Admins.' });
        }
        next();
    }
];

// Validation for rejecting an extension request (Leadership roles only)
export const validateRejectExtension = [
    param('id').isInt({ min: 1 }).withMessage('Valid Application ID is required'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ status: false, errors: errors.array() });

        const loggedInUser = req.user;
        const isAuthorized = [1, 2, 15, 19].includes(Number(loggedInUser.role_id)) || 
            ['Super Admin', 'Team Leader', 'Assistant Vice President', 'Group Sales & Marketing Head'].includes(loggedInUser.roleName);

        if (!isAuthorized) {
            return res.status(403).json({ status: false, message: 'Access Denied: You do not have the capacity to decline extension requests. This action is reserved for Team Leaders and Super Admins.' });
        }
        next();
    }
];