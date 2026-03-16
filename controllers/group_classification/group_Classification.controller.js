import * as GroupModel from "../../models/group_classification/group_Classification.model.js";

// READ ALL
export const getAllClassifications = async (req, res) => {
    try {
        const data = await GroupModel.getAll();
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

// READ ONE
export const getClassificationById = async (req, res) => {
    try {
        const data = await GroupModel.getById(req.params.id);
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