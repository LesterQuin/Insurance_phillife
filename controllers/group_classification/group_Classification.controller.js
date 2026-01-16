import * as GroupModel from "../../models/group_classification/group_Classification.model.js";

// CREATE
export const createClassification = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === ""){
            return res.status(400).json({ 
                message: "Name is required" 
            });
        }
        // Duplicate check
        const duplicate = await GroupModel.geByName(name.trim());
        if (duplicate) return res.status(400).json({
            message: "This name already exist."
        });

        // Create in DB and get the inserted record
        const newRecord = await GroupModel.create(name.trim());
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

// UPDATE
export const updateClassification = async (req, res) => {
    try {
        const { name } = req.body;
        const id = req.params.id;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Name is required."
            })
        }
        
        // Duplicate check in current record
        const duplicate = await GroupModel.getByName(name.trim());
        if (duplicate && duplicate.classification_id != id) {
            return res.status(400).json({
                message: "This name already exist."
            })
        }

        const updatedRecord = await GroupModel.update(id, name.trim());
        if (!updatedRecord) return res.status(404).json({
            message: "Not found."
        });

        res.json({
            message: "Updated successfully.",
            data: updatedRecord
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

// DELETE
export const deleteClassification = async (req, res) => {
    try {
        const deletedRecord = await GroupModel.remove(req.params.id)
        if (!deletedRecord) return res.status(404).json({
            message: "Not Found."
        });

        res.json({
            message: "Deleted successfully.",
            data: deletedRecord
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
}