import * as Model from "../../models/business_type/business_type.model.js"

// GET ALL
export const getAllBusinessTypes = async (req, res) => {
    try {
        const data = await Model.getAll();
        res.json({
            data
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
}

// GET by ID
export const  getBusinessTypeById = async (req, res) => {
    try {
        const data = await Model.getById(req.params.id);
        if (!data) return res.status(404).json({
            message: "Not found."
        });
        res.json({
            data
        })
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
}