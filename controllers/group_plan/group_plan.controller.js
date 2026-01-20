import * as Model from "../../models/group_plan/group_plan.model.js"

export const createPlan = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") return res.status(400).json({
            message: "Name is required."
        });

        const duplicate = await Model.getPlanByName(name.trim());
        if (duplicate) return res.status(400).json({
            message: "This plan in already exists."
        });

        const newPlan = await Model.createPlan(name.trim());
        res.status(201).json({
            message: "Created successfully.",
            data: newPlan
        })
    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};

export const getAllPlans = async (req, res) => {
    try {
        const data = await Model.getAllPlans();
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

export const getPlanById = async (req, res) => {
    try {
        const data = await Model.getPlanById(req.params.id);
        if (!data) return res.status(400).json({
            message: "Not Found"
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

export const updatePlan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        if (!name || name.trim() === "") return res.status(400).json({
            message: "Name is required."
        });

        const duplicate = await Model.getPlanByName(name.trim());
        if (duplicate && duplicate.plan_id != id) return res.status(400).json({
            message: "This plan already exists."
        });

        const updated = await Model.updatePlan(id, name.trim());
        if (!updated) return res.status(404).json({
            message: "Not Found."
        });
        res.json({
            message: "Updated successfully",
            data: updated
        });

    } catch (err) {
        console.error("Service Error:",err);
        res.status(500).json({
            error: err.message
        });
    }
};