import * as Model from '../models/financial_Insurance_form.model.js';

export const checkTemplateType = (expectedType) => {
    return async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid application ID format."
                });
            }

            const appData = await Model.getApplicationById(id);
            if (!appData) {
                return res.status(404).json({
                    success: false,
                    message: "Application not found."
                });
            }

            const nameUpper = (appData.basic_plan_name || appData.plan_name || '').toUpperCase();
            const amountLoansName = (appData.amount_loans_name || '').toUpperCase();

            let actualType = 'OUTSTANDING';
            if (nameUpper.includes('CREDIT LIFE') || nameUpper.includes('GCLI') || nameUpper.includes('G-CLI')) {
                if (amountLoansName.includes('INITIAL') || amountLoansName.includes('ANNUAL') || amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || nameUpper.includes('PRINCIPAL')) {
                    actualType = 'PRINCIPAL';
                }
            } else if (nameUpper.includes('ACCIDENTAL DEATH') || nameUpper.includes('GPA') || nameUpper.includes('G-ADD') || nameUpper.includes('GADDP') || nameUpper.includes('DISABILITY')) {
                actualType = 'GPA';
            }

            if (actualType !== expectedType) {
                let msg = '';
                if (actualType === 'PRINCIPAL') {
                    msg = `This application (${id}) uses the GCLI Principal (Initial Loan Amount) template. Please use GCLI Principal API endpoints instead (with /principal/ in path).`;
                } else if (actualType === 'OUTSTANDING') {
                    msg = `This application (${id}) uses the GCLI Outstanding template. Please use GCLI Outstanding API endpoints instead (with /outstanding/ in path).`;
                } else if (actualType === 'GPA') {
                    msg = `This application (${id}) uses the GPA / GADDP template. Please use GPA API endpoints instead (with /gpa/ in path).`;
                }
                
                return res.status(400).json({
                    success: false,
                    message: msg
                });
            }

            next();
        } catch (err) {
            console.error("Template Validation Error:", err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }
    };
};
