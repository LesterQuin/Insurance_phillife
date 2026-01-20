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
}