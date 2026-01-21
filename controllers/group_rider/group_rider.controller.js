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
