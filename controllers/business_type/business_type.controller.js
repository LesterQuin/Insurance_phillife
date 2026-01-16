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

// UPDATE
export const updateBusinessType = async (req, res) => {
    try {
        const { name } =req.body;
        const id = req.params.id;

        if (!name || name.trim() === "") return res.status(400).json({
            message: "name was required."
        });

        const duplicate = await Model.getByName(name.trim());
        if (duplicate && duplicate.business_type_id != id) {
            return res.status(400).json({
                message: "This name already exists."
            });
        }

        const updated = await Model.update(id, name.trim());
        if (!updated) return res.status(404).json({
            message: "Not found."
        })
        res.json({
            message: "Updated successfully.",
            data: updated
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
};

// DELETE
export const deleteBusinessType = async (req, res) => {
    try {
        const deleted = await Model.remove(req.params.id);
        if (!deleted) return res.status(404).json({
            message: "Not found."
        });
        res.json({
            message: "Deleted successfully.",
            data: deleted
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
}