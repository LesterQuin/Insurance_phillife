import { application } from 'express';
import * as Model from '../models/financial_Insurance_form.model.js';
import { success, error } from '../utils/response.js';

// Create
export const createApplication = async (req, res) => {
    try {
        const application = await Model.createApplication(req.body);
        return success(res, application, 'Application submitted successfully', 201);
    } catch (err) {
        console.error("Service Error:",err);
        return error(res, err.message);
    }
};

// Get all Applications
export const getAllApplications = async (req, res) => {
    try {
        const application = await Model.getAllApplications();
        return success(res, application, 'Application fetched successfully.');
    } catch (err) {
        console.error("Service Error:",err);
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
        console.error("Service Error:",err);
        return error(res, err.message);
    }
};

// Update application
export const updateApplication = async (req, res) => {
    try {
        const updated = await Model.updateApplication(req,params.id, req.body);
        return success(res, updated, 'Application updated successfully.')
    } catch (err) {
        console.error("Service Error:", err);
        return error(res, err.message);
    }
}