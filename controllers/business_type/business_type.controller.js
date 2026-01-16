import * as Model from "../../models/business_type/business_type.model.js"

// CREATE
export const createBusinessType = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Name is required."
            });
        }

        const duplicate = await Model.getByName(name.trim());
        if (duplicate) return res.status(400).json({
            message: "This name already exist."
        });

        const newRecord = await Model.create(name.trim());
        res.status(201).json({
            message: "Created successfully",
            data: newRecord
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
};