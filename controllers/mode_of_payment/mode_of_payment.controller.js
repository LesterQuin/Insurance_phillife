import * as Model from "../../models/mode_of_payment/mode_of_payment.model.js"

// CREATE
export const createPaymentMode = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "" ){
            return res.status(400).json({
                message: "Name is required."
            });
        }

        const duplicate = await Model.getByName(name.trim());
        if (duplicate) {
            return res.status(400).json({
                message: "This payment mode already exist."
            });
        }

        const newRecord = await Model.create(name.trim());
        res.status(201).json({
            message: "Created Successfully.",
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
export const getAllPaymentModes = async (req, res) => {
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

// GET BY ID
export const getPaymentModeById = async (req, res) => {
    try {
        const data = await Model.getById(req.params.id);
        if (!data) return res.status(404).json({
            message: "Not Found."
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

// UPDATE
export const updatePaymentMode = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                message: "Name is required."
            });
        }

        const duplicate = await Model.getByName(name.trim());
        if (duplicate && duplicate.payment_mode_id != id) {
            return res.status(400).json({
                message: " This payment already exists."
            });
        }

        const updated = await Model.update(id, name.trim());
        if (!updated) return res.status(404).json ({
                message:  "Not found."
        });

        res.json({
            message: "Updated successfully.",
            data: updated
        });
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
}