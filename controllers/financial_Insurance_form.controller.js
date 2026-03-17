import * as Model from '../models/financial_Insurance_form.model.js';
import * as User from '../models/user/user_model.js';
import { success, error } from '../utils/response.js';
import { generateGCLIPDFContent } from '../templates/proposal_generator.js';

// Helper to clean "other" fields based on selected IDs
const cleanupOtherFields = async (data) => {
    const mutableData = { ...data };
    const idsToCheck = [
        mutableData.group_classification_id,
        mutableData.business_type_id,
        mutableData.group_type_id,
    ];

    const namesMap = await Model.getLookupNamesByIds(idsToCheck);
    const isOther = (id) => {
        if (id == null) return false;
        const name = namesMap.get(id);
        return name === 'Other' || name === 'Others';
    };

    if (!isOther(mutableData.group_classification_id)) {
        mutableData.other_group_classification = null;
    }
    if (!isOther(mutableData.business_type_id)) {
        mutableData.other_business_type = null;
    }
    if (!isOther(mutableData.group_type_id)) {
        mutableData.other_group_type = null;
    }

    return mutableData;
};

// Create Application
export const createApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        let dataToSave = { ...req.body };

        // If it's a Prototype, nullify product-specific fields.
        if (Number(dataToSave.type_of_proposal_id) === 30) { // 30 is Prototype
            dataToSave.plan_id = null;
            dataToSave.basic_plan_id = null;
            dataToSave.riders = [];
            dataToSave.amount_loans_id = null;
            dataToSave.loans_amount = null;
            dataToSave.payment = [];
            dataToSave.coverage_type_id = null;
            dataToSave.level_ranking = null;
            dataToSave.uniform_coverage_amount = null;
            dataToSave.salary_ranking = null;
        }
        
        const cleanedData = await cleanupOtherFields(dataToSave);
        const newRecord = await Model.createApplication(cleanedData, userId);

        if (!newRecord || !newRecord.application_id) {
            return error(res, 'Failed to create the application.', 500);
        }

        const fullApplication = await Model.getApplicationById(newRecord.application_id);

        return success(res, fullApplication, 'Application submitted successfully', 201);
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get Template By ID
export const getTemplateById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return error(res, "Invalid ID format.", 400);
        }

        // 1. Fetch Application Data
        const appData = await Model.getApplicationById(id);
        if (!appData) {
            return error(res, "Application not found.", 404);
        }

        // 2. Fetch User Data (CFE / Agent) who created the application
        let user;
        if (appData.user_id) {
            user = await User.getUserById(appData.user_id);
        }

        if (!user) {
            // Fallback if user is missing or ID is null so the template can still generate
            user = { firstname: 'Phillife', lastname: 'Representative', departmentName: 'Head Office', locationName: 'Main Office' };
        }

        // 3. Map flat DB structure to the nested structure required by the template
        const application = {
            ...appData,
            status: { name: appData.status_name || 'Pending' },
            basic_plan: { name: appData.basic_plan_name || 'N/A' },
            payment_mode: { name: appData.payment_mode_name || 'N/A' },
            // Ensure fields used in the template are explicit
            group_name: appData.group_name,
            proposal_addressee: appData.proposal_addressee,
            addressee_designation: appData.addressee_designation,
            business_address: appData.business_address,
            minimum_age: appData.minimum_age,
            maximum_age: appData.maximum_age,
        };

        // 4. Prepare Details (Rates, Limits, etc.)
        // In a real app, these should probably come from a database lookup or calculation service.
        // For now, hardcoding as per previous examples/requests.
        const details = {
            totalAnnualPremium: 0, 
            contactLocal: '123',
            // Default rates can be passed here or handled in template defaults. 
            // Providing some here to ensure they render.
            rates18_64: { 6: '5.00', 12: '6.00', 18: '7.00', 24: '8.00', 30: '9.00', 36: '10.00' },
            rates65_67: { 6: '6.00', 12: '7.00', 18: '8.00', 24: '9.00', 30: '10.00', 36: '11.00' },
            rates68_70: { 6: '7.00', 12: '8.00', 18: '9.00', 24: '10.00', 30: '11.00', 36: '12.00' },
            rates71_74: { 71: '12.00', 72: '13.00', 73: '14.00', 74: '15.00' },
            nelAmount: 500000,
            nelAge: 65,
            nmlAmount: 1000000,
            nmlAge: 60,
            participationPercentage: 100
        };

        // 5. Generate HTML
        const htmlContent = generateGCLIPDFContent(application, user, details);

        // 6. Return HTML response
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);

    } catch (err) {
        console.error("Proposal Generation Error:", err);
        return error(res, err.message, 500);
    }
};

// Get All Applications
export const getAllApplications = async (req, res) => {
    try {
        const rawApplications = await Model.getAllApplications();
        if (rawApplications.length === 0) {
            return success(res, [], 'Applications fetched successfully.');
        }

        // --- Bulk fetch related data ---
        const appIds = rawApplications.map(app => app.application_id);

        const allRiders = await Model.getBulkApplicationRiders(appIds);
        const ridersByAppId = allRiders.reduce((acc, rider) => {
            (acc[rider.application_id] = acc[rider.application_id] || []).push(rider);
            return acc;
        }, {});
        
        const allSubGroups = await Model.getBulkApplicationSubGroups(appIds);
        const subGroupsByAppId = allSubGroups.reduce((acc, sg) => {
            (acc[sg.application_id] = acc[sg.application_id] || []).push({ id: sg.id, name: sg.name });
            return acc;
        }, {});

        const allPayments = await Model.getBulkApplicationPaymentTerms(appIds);
        const paymentsByAppId = allPayments.reduce((acc, p) => {
            (acc[p.application_id] = acc[p.application_id] || []).push({
                payment_term: { id: p.payment_term_id, name: p.payment_term_name },
                sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name }
            });
            return acc;
        }, {});

        // --- Map the bulk-fetched data back to each application ---
        const formattedApplications = rawApplications.map(app => {

            return {
                application_id: app.application_id,
                user_id: app.user_id,
                group_name: app.group_name,
                number_of_lives: app.number_of_lives,
                contact_person: [app.contact_person_salutation, app.contact_person_firstname, app.contact_person_mi, app.contact_person_lastname].filter(Boolean).join(' '),
                status: { id: app.status_id, name: app.status_name },
                group_classification: { 
                    id: app.group_classification_id, 
                    name: app.group_classification_name,
                    other_value: app.other_group_classification
                },
                business_type: {
                    id: app.business_type_id,
                    name: app.business_type_name,
                    other_value: app.other_business_type
                },
                group_type: { 
                    id: app.group_type_id, 
                    name: app.group_type_name,
                    other_value: app.other_group_type
                },
                sub_group_types: subGroupsByAppId[app.application_id] || [],
                payment: paymentsByAppId[app.application_id] || [],
                type_of_proposal: {
                    id: app.type_of_proposal_id,
                    name: app.type_of_proposal_name
                },
                plan: { id: app.plan_id, name: app.plan_name },
                basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
                riders: ridersByAppId[app.application_id] || [],
                created_at: app.created_at,
                updated_at: app.updated_at,
            };
        });

        return success(res, formattedApplications, 'Applications fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get Application by ID
export const getApplicationById = async (req, res) => {
    try {
        const app = await Model.getApplicationById(req.params.id);
        if (!app) return error(res, 'Application not found', 404);

        // --- Build structured response ---
        const subGroupTypes = await Model.getApplicationSubGroups(req.params.id);

        const paymentTermsRaw = await Model.getApplicationPaymentTerms(req.params.id);
        const paymentTerms = paymentTermsRaw.map(p => ({
            payment_term: { id: p.payment_term_id, name: p.payment_term_name },
            sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name }
        }));

        // Fetch riders from the new table
        const riders = await Model.getApplicationRiders(req.params.id);

        // Fetch coverage rankings
        const rankings = await Model.getCoverageRankingsByAppId(req.params.id);

        let levelRanking = null;
        let salaryRanking = null;
        if (app.coverage_type_id === 32) { // Level Ranking
            levelRanking = rankings.map(({ salary_multiplier, uniform_coverage_amount, ...rest }) => rest);
        } else if (app.coverage_type_id === 34) { // By Salary Rank
            // Return the raw ranking entries without aggregation
            salaryRanking = rankings.map(({ uniform_coverage_amount, ...rest }) => rest);
        }

        let coverage_totals = [];
        // Only populate coverage_totals if it's not "By Salary Rank" to avoid redundancy
        if (app.coverage_type_id !== 34) {
            coverage_totals = rankings.map(r => ({
                designation: r.designation,
                total_coverage_amount: r.total_coverage_amount
            }));
        }

        const response = {
            application_id: app.application_id, user_id: app.user_id, group_name: app.group_name,
            business_nature: app.business_nature, number_of_lives: app.number_of_lives, business_address: app.business_address,
            contact_number: app.contact_number, fax_number: app.fax_number, email: app.email,
            contact_person_salutation: app.contact_person_salutation,
            contact_person_firstname: app.contact_person_firstname,
            contact_person_mi: app.contact_person_mi,
            contact_person_lastname: app.contact_person_lastname,
            designation: app.designation, proposal_addressee: app.proposal_addressee,
            addressee_designation: app.addressee_designation, minimum_age: app.minimum_age, maximum_age: app.maximum_age,
            status: { id: app.status_id, name: app.status_name },
            group_classification: { id: app.group_classification_id, name: app.group_classification_name, other_value: app.other_group_classification || null },
            business_type: { id: app.business_type_id, name: app.business_type_name, other_value: app.other_business_type || null },
            group_type: { id: app.group_type_id, name: app.group_type_name, other_value: app.other_group_type || null },
            sub_group_types: subGroupTypes,
            payment_mode: { id: app.payment_mode_id, name: app.payment_mode_name },
            payment: paymentTerms,
            type_of_proposal: { id: app.type_of_proposal_id, name: app.type_of_proposal_name },
            plan: { id: app.plan_id, name: app.plan_name },
            basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
            riders: riders,
            level_ranking: levelRanking,
            salary_ranking: salaryRanking,
            uniform_coverage_amount: app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
            coverage_totals: coverage_totals,
            created_at: app.created_at, updated_at: app.updated_at
        };

        return success(res, response);
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Update Application
export const updateApplication = async (req, res) => {
    try {
        const userId = req.user.userId;
        
        console.log('=== UPDATE DEBUG ===');
        console.log('Logged in userId:', userId, 'Type:', typeof userId);
        const agentCodeFromBody = req.body.agent_code;
        
        // Get the existing application to check ownership
        const existingApplication = await Model.getApplicationById(req.params.id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }
        
        console.log('Application user_id:', existingApplication.user_id, 'Type:', typeof existingApplication.user_id);

        const loggedInId = Number(userId);
        const creatorId = Number(existingApplication.user_id);
        
        console.log('Comparing:', loggedInId, '===', creatorId);
        
        let isAuthorized = false;
        
        if (loggedInId === creatorId) {
            console.log('User is the creator - authorized');
            isAuthorized = true;
        } else if (agentCodeFromBody) {
            const creatorUser = await User.getUserById(existingApplication.user_id);
            console.log('Creator user agent_code:', creatorUser?.agent_code, 'Provided:', agentCodeFromBody);
            if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                isAuthorized = true;
            }
        }
        
        if (!isAuthorized) {
            return error(res, 'You are not authorized to update this application. Only the original agent can update it.', 403);
        }
        
        const { agent_code, ...updateData } = req.body;
        
        const cleanedData = await cleanupOtherFields(updateData);
        const updated = await Model.updateApplication(req.params.id, cleanedData);
        return success(res, updated, 'Application updated successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Delete Application
export const deleteApplication = async (req, res) => {
    try {
        await Model.deleteApplication(req.params.id);
        return success(res, null, 'Application deleted successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};
