import * as Model from '../financial_Insurance_form.model.js';
import * as User from '../user/user_model.js';

export const getCOCPdfData = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) return null;
    
    const riders = await Model.getApplicationRiders(id);
    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);
    const user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    return {
        appData,
        riders,
        rankings,
        rankingRiders,
        user
    };
};
