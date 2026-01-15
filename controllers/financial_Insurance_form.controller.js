import * as Model from '../models/financial_Insurance_form.model.js';
import { success, error } from '../utils/response.js';

// Create
export const createApplication = async (req, res) => {
    try {
        const application = await Model.createApplication(req.body);
        return success(res, application, 'Application submitted successfully', 201);
    } catch (err) {
        console.error(err);
        return error(res, err.message);
    }
};
