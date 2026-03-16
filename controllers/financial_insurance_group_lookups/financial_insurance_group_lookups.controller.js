import * as Model from "../../models/financial_insurance_group_lookups/financial_insurance_group_lookups.model.js";

// Helper to fetch by category
const fetchByCategory = async (res, category) => {
    try {
        const results = await Model.getByCategory(category);

        // Build Tree Structure (Parent -> Children) consistent with getAll
        const itemMap = {};
        // Initialize children and map
        const items = results.map(item => {
            const newItem = { ...item, children: [] };
            itemMap[newItem.id] = newItem;
            return newItem;
        });

        const groupedData = items.filter(item => {
            if (item.parent_id && itemMap[item.parent_id]) {
                itemMap[item.parent_id].children.push(item);
                return false;
            }
            return true;
        });

        res.json({
            data: groupedData
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({
            error: err.message
        });
    }
};

// Specific Category Controllers
export const getByGroupClassification = (req, res) => fetchByCategory(res, 'GROUP_CLASSIFICATION');
export const getByBusinessType = (req, res) => fetchByCategory(res, 'BUSINESS_TYPE');
export const getByTypeOfGroup = (req, res) => fetchByCategory(res, 'TYPE_OF_GROUP');
export const getByModeOfPayment = (req, res) => fetchByCategory(res, 'MODE_OF_PAYMENT');
export const getByAgeProfile = (req, res) => fetchByCategory(res, 'AGE_PROFILE');
export const getByTypeOfProposal = (req, res) => fetchByCategory(res, 'TYPE_OF_PROPOSAL');
export const getByCoverageType = (req, res) => fetchByCategory(res, 'COVERAGE_TYPE');
export const getByCoverageMultiplier = (req, res) => fetchByCategory(res, 'COVERAGE_MULTIPLIER');
export const getByLoanAmountType = (req, res) => fetchByCategory(res, 'LOAN_AMOUNT_TYPE');
export const getByPaymentTerm = (req, res) => fetchByCategory(res, 'PAYMENT_TERM');
export const getByPaymentYear = (req, res) => fetchByCategory(res, 'PAYMENT_YEAR');

// Generic Get by Category (Optional usage via params)
export const getByCategory = async (req, res) => {
    const { category } = req.params;
    if (!category || category.trim() === "") {
        return res.status(400).json({ message: "Category is required." });
    }
    fetchByCategory(res, category);
};

// Get by ID
export const getById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const data = await Model.getById(id);
        if (!data) return res.status(404).json({ message: "Not found." });
        res.json({ data });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({
            error: err.message
        });
    }
};

// Get All
export const getAll = async (req, res) => {
    try {
        const results = await Model.getAll();

        // 1. Group by category and initialize children array
        const categories = {};
        results.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push({ ...item, children: [] });
        });

        // 2. Build Tree Structure (Parent -> Children)
        const groupedData = {};
        Object.keys(categories).forEach(category => {
            const items = categories[category];
            const itemMap = {};
            
            // Create lookup map
            items.forEach(item => itemMap[item.id] = item);

            // Link children to parents and filter roots
            groupedData[category] = items.filter(item => {
                if (item.parent_id && itemMap[item.parent_id]) {
                    itemMap[item.parent_id].children.push(item);
                    return false;
                }
                return true; 
            });
        });

        res.json({
            data: groupedData
        });
    } catch (err) {
        console.error("Service Error:", err);
        res.status(500).json({
            error: err.message
        });
    }
};
