import * as Model from "../../models/type_of_group/type_of_group.model.js"

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
};