import { json } from "express";
import * as Model from "../../models/group_rider/group_rider.model.js"
import { error } from "../../utils/response.js";

export const createRider = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") return res.status(400).json ({
            message: "name is required."  
        });
        
        const duplicate = await Model.getRiderByName(name.trim());
        if (duplicate) return res.status(400).json({
            message: 'This rider already exists.'
        });

        const newRider = await Model.createRider(name.trim());
        res.status(201).json({
            message: "Created successfully",
            data: newRider
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
}

// Helper to group riders into a product -> basic_plan -> riders hierarchy
const groupRidersByProduct = (riders) => {
    const productsMap = new Map();

    riders.forEach(rider => {
        const { product_id, product_name, product_acronym, basic_plan_id, basic_plan_name, ...riderInfo } = rider;

        if (!productsMap.has(product_id)) {
            productsMap.set(product_id, {
                product_id,
                product_name: product_acronym ? `${product_name} (${product_acronym})` : product_name,
                basic_plans: new Map()
            });
        }
        const product = productsMap.get(product_id);

        if (!product.basic_plans.has(basic_plan_id)) {
            product.basic_plans.set(basic_plan_id, {
                basic_plan_id,
                basic_plan_name,
                riders: []
            });
        }
        const basicPlan = product.basic_plans.get(basic_plan_id);
        basicPlan.riders.push(riderInfo);
    });

    return Array.from(productsMap.values()).map(product => ({
        ...product,
        basic_plans: Array.from(product.basic_plans.values()).map(plan => {
            plan.riders.sort((a, b) => a.rider_id - b.rider_id);
            return plan;
        })
    }));
};

export const getAllRiders =async (req ,res) => {
    try {
        const results = await Model.getAllRiders();
        const groupedData = groupRidersByProduct(results);

        return res.json({
            data: groupedData
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

export const getRidersByProductName = async (req, res) => {
    try {
        const { productName } = req.params;
        if (!productName || productName.trim() === "") {
            return res.status(400).json({ message: "Product name is required." });
        }

        const results = await Model.getRidersByProductName(productName);
        const groupedData = groupRidersByProduct(results);
        return res.json({
            data: groupedData
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({
            error: err.message
        });
    }
};

// Helper to fetch by product acronym
const fetchRidersByAcronym = async (res, acronym) => {
    try {
        const results = await Model.getRidersByProductAcronym(acronym);
        const basicPlansMap = new Map();

        results.forEach(rider => {
            const {
                basic_plan_id,
                basic_plan_name,
                product_id, // Exclude from riderInfo
                product_name, // Exclude from riderInfo
                product_acronym, // Exclude from riderInfo
                ...riderInfo
            } = rider;

            if (!basicPlansMap.has(basic_plan_id)) {
                basicPlansMap.set(basic_plan_id, {
                    basic_plan_id,
                    basic_plan_name,
                    riders: []
                });
            }
            basicPlansMap.get(basic_plan_id).riders.push(riderInfo);
        });
        
        const sortedData = Array.from(basicPlansMap.values()).map(plan => {
            plan.riders.sort((a, b) => a.rider_id - b.rider_id);
            return plan;
        });

        return res.json({
            data: sortedData
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({
            error: err.message
        });
    }
};

export const getRidersForGCLI = (req, res) => fetchRidersByAcronym(res, 'GCLI');
export const getRidersForGYRT = (req, res) => fetchRidersByAcronym(res, 'GYRT');
export const getRidersForGPA = (req, res) => fetchRidersByAcronym(res, 'GPA');

export const getRiderById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const data = await Model.getRiderById(id);
        if (!data) return res.status(404).json({
            message: "Not found."
        });
        return res.json({
            data
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

export const updateRider = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const { name } = req.body;
        if (!name || name.trim() === "") return res.status(400).json({
            message: "Name is required."
        });

        const trimmedName = name.trim();
        const duplicate = await Model.getRiderByName(trimmedName);
        if (duplicate && duplicate.rider_id !== id) return res.status(400).json({
            message: "This riders is already exists."
        });

        const updated = await Model.updateRider(id, trimmedName);
        if (!updated) return res.status(404).json({
            message: "Not found."
        });

        return res.json({
            message: "Updated successfully.",
            data: updated
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

export const deleteRider = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const deleted = await Model.deleteRider(id);
        if (!deleted) return res.status(404).json({
            message: "Not found."
        });
        
        return res.json({
            message: "Deleted successfully.",
            data: deleted
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
}