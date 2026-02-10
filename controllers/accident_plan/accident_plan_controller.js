import * as Model from "../../models/accident_plan/accident_plan.model.js"

// Create
export const createPlan = async (req, res) => {
    try {
        const { name } = req.body || {};
        if (!name || name.trim() === "") return res.status(400).json({ 
            message: "Name is required" 
        });

        const duplicate = await Model.getPlanByName(name.trim());
        if (duplicate) return res.status(400).json({ 
            message: "Plan already exists" 
        });

        const newPlan = await Model.createPlan(name.trim());
        res.status(201).json({ 
            message: "Plan created", data: newPlan 
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
};

export const getAllPlans = async (req, res) => {
    try {
        const plans = await Model.getAllPlans();
        res.json({
            data: plans
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
};

export const updatePlan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        if (!name || name.trim() === "")
            return res.status(400).json({
                message: "Plan name is required."
            });
        
        const duplicate = await Model.getPlanByName(name.trim());
        if (duplicate && duplicate.personal_plan_id !== id)
            return res.status(400).json({
                message: "Plan already exist."
            });

        const updated = await Model.updatePlan(id, name.trim());
        if (!duplicate) return res.status(400).json({
            message: "Plan not found."
        });

        res.json({ 
            message: "Plan updated."
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
};

export const deletePlan = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const deleted = await Model.deletePlan(id);
        if (!deleted) return res.status(404).json({
            message: "Plan not found"
        });

        res.json({
            message: "Plan deleted",
            data: deleted
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({ 
            error: err.message 
        });
    }
};