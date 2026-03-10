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
        // Get userId from authenticated user
        const userId = req.user.userId;
        
        const cleanedData = await cleanupOtherFields(req.body);
        const application = await Model.createApplication(cleanedData, userId);
        return success(res, application, 'Application submitted successfully', 201);
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get All Applications
export const getAllApplications = async (req, res) => {
    try {
        const applications = await Model.getAllApplications();
        return success(res, applications, 'Applications fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get Application by ID
export const getApplicationById = async (req, res) => {
    try {
        const application = await Model.getApplicationById(req.params.id);
        if (!application) return error(res, 'Application not found', 404);
        return success(res, application);
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Update Application
export const updateApplication = async (req, res) => {
    try {
        // Get userId from authenticated user
        const userId = req.user.userId;
        
        console.log('=== UPDATE DEBUG ===');
        console.log('Logged in userId:', userId, 'Type:', typeof userId);
        
        // Get the agent_code from request body (optional)
        const agentCodeFromBody = req.body.agent_code;
        
        // Get the existing application to check ownership
        const existingApplication = await Model.getApplicationById(req.params.id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }
        
        console.log('Application user_id:', existingApplication.user_id, 'Type:', typeof existingApplication.user_id);
        
        // Check if the logged-in user is the creator (compare user_id directly)
        // Convert both to numbers to ensure proper comparison
        const loggedInId = Number(userId);
        const creatorId = Number(existingApplication.user_id);
        
        console.log('Comparing:', loggedInId, '===', creatorId);
        
        let isAuthorized = false;
        
        if (loggedInId === creatorId) {
            // Logged-in user is the creator
            console.log('User is the creator - authorized');
            isAuthorized = true;
        } else if (agentCodeFromBody) {
            // Check if agent_code from body matches creator's agent_code
            const creatorUser = await User.getUserById(existingApplication.user_id);
            console.log('Creator user agent_code:', creatorUser?.agent_code, 'Provided:', agentCodeFromBody);
            if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                isAuthorized = true;
            }
        }
        
        if (!isAuthorized) {
            return error(res, 'You are not authorized to update this application. Only the original agent can update it.', 403);
        }
        
        // Remove agent_code from data before updating (it's not a table column)
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
