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

export const getAllRiders =async (req ,res) => {
    try {
        const data = await Model.getAllRiders();
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

export const getRiderById = async (req, res) => {
    try {
        const data = await Model.getRiderById(parseInt(req.params.id));
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
        const deleted = await Model.deleteRider(parseInt(req.params.id));
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