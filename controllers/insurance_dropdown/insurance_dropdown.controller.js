import * as Model from '../../models/insurance_dropdown/insurance_dropdown.model.js';
import { success, error } from '../../utils/response.js';

// Get List of Industries (Business Nature)
export const getIndustries = async (req, res) => {
    try {
        const list = await Model.getIndustries();
        return success(res, list, 'Industries fetched successfully.');
    } catch (err) {
        console.error('Get Industries Error:', err);
        return error(res, err.message);
    }
};