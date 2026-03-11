import * as Model from '../models/financial_Insurance_form.model.js';
import * as User from '../models/user/user_model.js';
import { success, error } from '../utils/response.js';

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
            dataToSave.payment_term_id = null;
            dataToSave.sub_payment_term_id = null;
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

// Get All Applications
export const getAllApplications = async (req, res) => {
    try {
        const rawApplications = await Model.getAllApplications();
        if (rawApplications.length === 0) {
            return success(res, [], 'Applications fetched successfully.');
        }

        // --- Bulk fetch related data ---
        const appIds = rawApplications.map(app => app.application_id);
        const allSubGroupTypeIds = new Set();

        rawApplications.forEach(app => {
            if (app.sub_group_type_id) {
                try {
                    const subGroupIds = JSON.parse(app.sub_group_type_id);
                    const ids = Array.isArray(subGroupIds) ? subGroupIds : [subGroupIds];
                    ids.forEach(id => allSubGroupTypeIds.add(parseInt(id, 10)));
                } catch {
                    allSubGroupTypeIds.add(parseInt(app.sub_group_type_id, 10));
                }
            }
        });

        const subGroupTypeIdsArray = [...allSubGroupTypeIds].filter(id => !isNaN(id));

        const allRiders = await Model.getBulkApplicationRiders(appIds);
        const ridersByAppId = allRiders.reduce((acc, rider) => {
            (acc[rider.application_id] = acc[rider.application_id] || []).push(rider);
            return acc;
        }, {});

        const subGroupTypesMap = await Model.getLookupsByIds(subGroupTypeIdsArray);

        // --- Map the bulk-fetched data back to each application ---
        const formattedApplications = rawApplications.map(app => {
            let currentSubGroupTypeIds = [];
            if (app.sub_group_type_id) {
                try {
                    const parsed = JSON.parse(app.sub_group_type_id);
                    currentSubGroupTypeIds = Array.isArray(parsed) ? parsed : [parsed];
                } catch {
                    currentSubGroupTypeIds = [app.sub_group_type_id];
                }
            }
            currentSubGroupTypeIds = currentSubGroupTypeIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

            return {
                application_id: app.application_id,
                user_id: app.user_id,
                group_name: app.group_name,
                number_of_lives: app.number_of_lives,
                contact_person: app.contact_person,
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
                sub_group_types: currentSubGroupTypeIds.map(id => ({ id, name: subGroupTypesMap.get(id) })).filter(sg => sg.name),
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
        let subGroupTypeIds = [];
        if (app.sub_group_type_id) {
            try {
                const parsed = JSON.parse(app.sub_group_type_id);
                subGroupTypeIds = (Array.isArray(parsed) ? parsed : [parsed]).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            } catch {
                const numId = parseInt(app.sub_group_type_id, 10);
                if (!isNaN(numId)) subGroupTypeIds = [numId];
            }
        }

        const subGroupTypesMap = await Model.getLookupsByIds(subGroupTypeIds);
        const subGroupTypes = subGroupTypeIds.map(id => ({ id, name: subGroupTypesMap.get(id) })).filter(sg => sg.name);

        // Fetch riders from the new table
        const riders = await Model.getApplicationRiders(req.params.id);

        const response = {
            application_id: app.application_id, user_id: app.user_id, group_name: app.group_name,
            business_nature: app.business_nature, number_of_lives: app.number_of_lives, business_address: app.business_address,
            contact_number: app.contact_number, fax_number: app.fax_number, email: app.email,
            contact_person: app.contact_person, designation: app.designation, proposal_addressee: app.proposal_addressee,
            addressee_designation: app.addressee_designation, minimum_age: app.minimum_age, maximum_age: app.maximum_age,
            status: { id: app.status_id, name: app.status_name },
            group_classification: { id: app.group_classification_id, name: app.group_classification_name, other_value: app.other_group_classification || null },
            business_type: { id: app.business_type_id, name: app.business_type_name, other_value: app.other_business_type || null },
            group_type: { id: app.group_type_id, name: app.group_type_name, other_value: app.other_group_type || null },
            sub_group_types: subGroupTypes,
            payment_mode: { id: app.payment_mode_id, name: app.payment_mode_name },
            type_of_proposal: { id: app.type_of_proposal_id, name: app.type_of_proposal_name },
            plan: { id: app.plan_id, name: app.plan_name },
            basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
            riders: riders,
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
