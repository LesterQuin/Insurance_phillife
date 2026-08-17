import { poolPromise, sql } from '../../config/db.js';
import * as Model from '../financial_Insurance_form.model.js';
import * as User from '../user/user_model.js';

import * as GclipOutModel from './contract_GCLIP_OUT.model.js';
import * as GclipPrinModel from './contract_GCLIP_PRIN.model.js';

export const getCOCPdfData = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) return null;
    
    const riders = await Model.getApplicationRiders(id);
    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);

    const nameUpper = (appData.basic_plan_name || appData.plan_name || '').toUpperCase();
    const amountLoansName = (appData.amount_loans_name || '').toUpperCase();

    let provisionsRow = null;
    let limitsRow = null;

    if (nameUpper.includes('CREDIT LIFE') || nameUpper.includes('GCLI') || nameUpper.includes('G-CLI')) {
        if (amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || nameUpper.includes('PRINCIPAL')) {
            provisionsRow = await GclipPrinModel.getUnderwritingProvisions(id);
            limitsRow = await GclipPrinModel.getUnderwritingLimits(id);
        } else {
            provisionsRow = await GclipOutModel.getUnderwritingProvisions(id);
            limitsRow = await GclipOutModel.getUnderwritingLimits(id);
        }
    } else {
        provisionsRow = await GclipOutModel.getUnderwritingProvisions(id);
        limitsRow = await GclipOutModel.getUnderwritingLimits(id);
    }
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
        provision_face_amount: provisionsRow ? provisionsRow.provision_face_amount : null,
        provision_premium_computation: provisionsRow ? provisionsRow.provision_premium_computation : null,
        provision_non_coverage: provisionsRow ? provisionsRow.provision_non_coverage : null,
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
