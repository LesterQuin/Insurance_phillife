import { poolPromise } from "../../config/db.js";
import * as Model from "../../models/type_of_group/type_of_group.model.js"

// CREATE
export const createGroupType = async (req, res) => {
    try {
        const { name, parent_id } = req.body;

        if (!name || name.trim() === "") return res.status(400).json({
            message: "Name is required."
        });

        const duplicate = await Model.getByName(name.trim());
        if (duplicate) return res.status(400).json({
            message: "This name already exist."
        });

        const newRecord = await Model.create(name.trim(), parent_id || null);
        res.status(201).json({
            message: "Created successfully",
            data: newRecord
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

// GET ALL
export const getAllGroupTypes = async (req, res) => {
    try {
        const data = await Model.getAll();
        res.json({
            data
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

// GET by ID
export const getGroupTypeById = async (req, res) => {
    try {
        const data = await Model.getById(req.params.id);
        if (!data) return res.status(404).json({
            message: "Not found."
        });
        res.json({
            data
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
}
