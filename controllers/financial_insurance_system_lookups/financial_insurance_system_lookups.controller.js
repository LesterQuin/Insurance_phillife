import * as Model from '../../models/financial_insurance_system_lookups/financial_insurance_system_lookups.model.js';
import { success, error } from '../../utils/response.js';

export const getAll = async (req, res) => {
    try {
        const data = await Model.getAll();
        return success(res, data, 'System lookups fetched successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const getById = async (req, res) => {
    try {
        const data = await Model.getById(req.params.id);
        if (!data) return error(res, 'System lookup not found', 404);
        return success(res, data, 'System lookup fetched successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const getByRole = async (req, res) => {
    try {
        const data = await Model.getByCategory('ROLE');
        return success(res, data, 'Roles fetched successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const getByDepartment = async (req, res) => {
    try {
        const data = await Model.getByCategory('DEPARTMENT');
        return success(res, data, 'Departments fetched successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const getByLocation = async (req, res) => {
    try {
        const data = await Model.getByCategory('LOCATION');
        return success(res, data, 'Locations fetched successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const getCategories = async (req, res) => {
    try {
        const data = await Model.getCategories();
        return success(res, data, 'Categories fetched successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const create = async (req, res) => {
    try {
        const { category, name, code } = req.body;

        if (!category || typeof category !== 'string' || !category.trim()) {
            return error(res, 'Category is required and must be a valid string', 400);
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            return error(res, 'Name is required and must be a valid string', 400);
        }
        if (!code || typeof code !== 'string' || !code.trim()) {
            return error(res, 'Code is required and must be a valid string', 400);
        }
        const data = await Model.create(req.body);
        return success(res, data, 'System lookup created successfully', 201);
    } catch (err) {
        return error(res, err.message);
    }
};

export const update = async (req, res) => {
    try {
        const id = req.params.id;
        const { category, name, code } = req.body;

        if (category !== undefined && (category === null || typeof category !== 'string' || !category.trim())) {
            return error(res, 'Category must be a valid non-empty string and not null', 400);
        }
        if (name !== undefined && (name === null || typeof name !== 'string' || !name.trim())) {
            return error(res, 'Name must be a valid non-empty string and not null', 400);
        }
        if (code !== undefined && (code === null || typeof code !== 'string' || !code.trim())) {
            return error(res, 'Code must be a valid non-empty string and not null', 400);
        }

        const existing = await Model.getById(id);
        if (!existing) return error(res, 'System lookup not found', 404);

        const updatedData = { ...existing, ...req.body };
        const result = await Model.update(id, updatedData);
        return success(res, result, 'System lookup updated successfully');
    } catch (err) {
        return error(res, err.message);
    }
};

export const deleteLookup = async (req, res) => {
    try {
        await Model.deleteLookup(req.params.id);
        return success(res, null, 'System lookup deleted successfully');
    } catch (err) {
        return error(res, err.message);
    }
};