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
                if (amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || nameUpper.includes('PRINCIPAL')) {
                    actualType = 'PRINCIPAL';
                }
            }

            if (actualType !== expectedType) {
                const msg = expectedType === 'OUTSTANDING'
                    ? `This application (${id}) uses the GCLI Principal (Initial Loan Amount) template. Please use GCLI Principal API endpoints instead (with /principal/ in path).`
                    : `This application (${id}) uses the GCLI Outstanding template. Please use GCLI Outstanding API endpoints instead (with /oustanding/ in path).`;
                
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
