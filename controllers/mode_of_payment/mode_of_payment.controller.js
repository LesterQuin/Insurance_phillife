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