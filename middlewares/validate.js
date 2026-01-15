import { body, validationResult } from 'express-validator';

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