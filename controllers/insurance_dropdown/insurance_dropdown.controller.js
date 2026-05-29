import * as Model from '../../models/insurance_dropdown/insurance_dropdown.model.js';
import { success, error } from '../../utils/response.js';

// Get List of Industries (Business Nature)
// export const getIndustries = async (req, res) => {
//     try {
//         const list = await Model.getIndustries();
//         const groupedIndustries = list.reduce((acc, item) => {

//             if (!acc[item.category]) {
//                 acc[item.category] = [];
//             }
//             acc[item.category].push(item);
//             return acc;

//         }, {});
//         return success(res, groupedIndustries, 'Industries fetched successfully.');
//     } catch (err) {
//         console.error('Get Industries Error:', err);
//         return error(res, err.message);
//     }
// };

export const getIndustries = async (req, res) => {
    try {
        const list = await Model.getIndustries();
        const groupedIndustries = list.reduce((acc, item) => {
            if (item.parent_id === null) return acc;
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {});
        return success(res, groupedIndustries, 'Industries fetched successfully.');
    } catch (err) {
        console.error('Get Industries Error:', err);
        return error(res, err.message);
    }
};