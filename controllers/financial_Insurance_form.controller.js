import * as Model from '../models/financial_Insurance_form.model.js';
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
        const cleanedData = await cleanupOtherFields(req.body);
        const application = await Model.createApplication(cleanedData);
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
        const cleanedData = await cleanupOtherFields(req.body);
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