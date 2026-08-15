import { poolPromise, sql } from '../../config/db.js';
import * as Model from '../financial_Insurance_form.model.js';
import * as User from '../user/user_model.js';

import { 
    getUnderwritingProvisions, 
    getUnderwritingLimits 
} from './contract_GCLIP_OUT.model.js';

export const getCOCPdfData = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) return null;
    
    const riders = await Model.getApplicationRiders(id);
    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);
    const provisionsRow = await getUnderwritingProvisions(id);
    const limitsRow = await getUnderwritingLimits(id);
    const user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    return {
        appData,
        riders,
        rankings,
        rankingRiders,
        provisions: provisionsRow ? provisionsRow.provision_text : null,
        contribution_text: provisionsRow ? provisionsRow.contribution_text : null,
        eligible_individuals: provisionsRow ? provisionsRow.eligible_individuals : null,
        participation_requirements: provisionsRow ? provisionsRow.participation_requirements : null,
        termination_age: provisionsRow ? provisionsRow.termination_age : null,
        provision_enrollment: provisionsRow ? provisionsRow.provision_enrollment : null,
        provision_rollover: provisionsRow ? provisionsRow.provision_rollover : null,
        provision_termination: provisionsRow ? provisionsRow.provision_termination : null,
        provision_definitions: provisionsRow ? provisionsRow.provision_definitions : null,
        provision_claims: provisionsRow ? provisionsRow.provision_claims : null,
        refund_of_premiums: provisionsRow ? provisionsRow.refund_of_premiums : null,
        amount_of_insurance: provisionsRow ? provisionsRow.amount_of_insurance : null,
        coverage_period: provisionsRow ? provisionsRow.coverage_period : null,
        due_dates: provisionsRow ? provisionsRow.due_dates : null,
        nel: limitsRow ? limitsRow.nel : [],
        nmed: limitsRow ? limitsRow.nmed : [],
        med: limitsRow ? limitsRow.med : [],
        max_limit: limitsRow ? limitsRow.max_limit : [],
        underwriting_notes: limitsRow ? limitsRow.underwriting_notes : null,
        user
    };
};
