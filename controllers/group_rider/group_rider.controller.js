import * as Model from "../../models/group_rider/group_rider.model.js"
import { error } from "../../utils/response.js";
import { generatePDFBuffer, getImageDataUri } from "../../middlewares/helper.js";

export const createRider = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") return res.status(400).json ({
            message: "name is required."  
        });
        
        const duplicate = await Model.getRiderByName(name.trim());
        if (duplicate) return res.status(400).json({
            message: 'This rider already exists.'
        });

        const newRider = await Model.createRider(name.trim());
        res.status(201).json({
            message: "Created successfully",
            data: newRider
        });
    } catch (err) {
        console.error("Service Error:",err);
        return error(res, err.message);
    }
}

// Helper to group riders into a product -> basic_plan -> riders hierarchy
const groupRidersByProduct = (riders) => {
    const productsMap = new Map();

    riders.forEach(rider => {
        const { product_id, product_name, product_acronym, basic_plan_id, basic_plan_name, ...riderInfo } = rider;

        if (!productsMap.has(product_id)) {
            productsMap.set(product_id, {
                product_id,
                product_name: product_acronym ? `${product_name} (${product_acronym})` : product_name,
                basic_plans: new Map()
            });
        }
        const product = productsMap.get(product_id);

        if (!product.basic_plans.has(basic_plan_id)) {
            product.basic_plans.set(basic_plan_id, {
                basic_plan_id,
                basic_plan_name,
                riders: []
            });
        }
        const basicPlan = product.basic_plans.get(basic_plan_id);
        basicPlan.riders.push(riderInfo);
    });

    return Array.from(productsMap.values()).map(product => ({
        ...product,
        basic_plans: Array.from(product.basic_plans.values()).map(plan => {
            plan.riders.sort((a, b) => a.rider_id - b.rider_id);
            return plan;
        })
    }));
};

export const getAllRiders =async (req ,res) => {
    try {
        const results = await Model.getAllRiders();
        const groupedData = groupRidersByProduct(results);

        return res.json({
            data: groupedData
        });
    } catch (err) {
        console.error("Service Error:",err);
        return error(res, err.message);
    }
};

export const getRidersByProductName = async (req, res) => {
    try {
        const { productName } = req.params;
        if (!productName || productName.trim() === "") {
            return res.status(400).json({ message: "Product name is required." });
        }

        const results = await Model.getRidersByProductName(productName);
        const groupedData = groupRidersByProduct(results);
        return res.json({
            data: groupedData
        });
    } catch (err) {
        console.error("Service Error:", err);
        return error(res, err.message);
    }
};

// Helper to fetch by product acronym
const fetchRidersByAcronym = async (res, acronym) => {
    try {
        const results = await Model.getRidersByProductAcronym(acronym);
        const basicPlansMap = new Map();

        results.forEach(rider => {
            const {
                basic_plan_id,
                basic_plan_name,
                product_id, // Exclude from riderInfo
                product_name, // Exclude from riderInfo
                product_acronym, // Exclude from riderInfo
                ...riderInfo
            } = rider;

            if (!basicPlansMap.has(basic_plan_id)) {
                basicPlansMap.set(basic_plan_id, {
                    basic_plan_id,
                    basic_plan_name,
                    riders: []
                });
            }
            basicPlansMap.get(basic_plan_id).riders.push(riderInfo);
        });
        
        const sortedData = Array.from(basicPlansMap.values()).map(plan => {
            plan.riders.sort((a, b) => a.rider_id - b.rider_id);
            return plan;
        });

        return res.json({
            data: sortedData
        });
    } catch (err) {
        console.error("Service Error:", err);
        return error(res, err.message);
    }
};

export const getRidersForGCLI = (req, res) => fetchRidersByAcronym(res, 'GCLI');
export const getRidersForGYRT = (req, res) => fetchRidersByAcronym(res, 'GYRT');
export const getRidersForGPA = (req, res) => fetchRidersByAcronym(res, 'GPA');

export const getRiderById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const data = await Model.getRiderById(id);
        if (!data) return res.status(404).json({
            message: "Not found."
        });
        return res.json({
            data
        });
    } catch (err) {
        console.error("Service Error:",err);
        return error(res, err.message);
    }
};

export const updateRider = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const { name } = req.body;
        if (!name || name.trim() === "") return res.status(400).json({
            message: "Name is required."
        });

        const trimmedName = name.trim();
        const duplicate = await Model.getRiderByName(trimmedName);
        if (duplicate && duplicate.rider_id !== id) return res.status(400).json({
            message: "This riders is already exists."
        });

        const updated = await Model.updateRider(id, trimmedName);
        if (!updated) return res.status(404).json({
            message: "Not found."
        });

        return res.json({
            message: "Updated successfully.",
            data: updated
        });
    } catch (err) {
        console.error("Service Error:",err);
        return error(res, err.message);
    }
};

export const deleteRider = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ message: "Invalid ID format." });
        }

        const deleted = await Model.deleteRider(id);
        if (!deleted) return res.status(404).json({
            message: "Not found."
        });
        
        return res.json({
            message: "Deleted successfully.",
            data: deleted
        });
    } catch (err) {
        console.error("Service Error:",err);
        return error(res, err.message);
    }
};

export const viewRiderTemplateByAcronym = async (req, res) => {
    try {
        const { acronym } = req.params;
        if (!acronym || acronym.trim() === "") {
            return res.status(400).json({ message: "Rider acronym is required." });
        }

        let acronymUpper = acronym.trim().toUpperCase().replace(/\s+/g, '+');
        if (acronymUpper === 'GADDR+' || acronymUpper === 'GADDRP') {
            acronymUpper = 'GADDRP';
        } else if (acronymUpper === 'GCIR-5' || acronymUpper === 'GCIR_5' || acronymUpper === 'GCIR+5' || acronymUpper === 'GCIR5') {
            acronymUpper = 'GCIR5';
        } else if (acronymUpper === 'GCIR-45' || acronymUpper === 'GCIR_45' || acronymUpper === 'GCIR+45' || acronymUpper === 'GCIR45') {
            acronymUpper = 'GCIR45';
        }
        
        // 1. Fetch rider data from DB (with graceful mock fallback for preview/testing)
        let rider = await Model.getRiderByAcronym(acronymUpper);
        if (!rider && acronymUpper === 'GADDRP') {
            // Try matching with GADDR+ in database as well
            rider = await Model.getRiderByAcronym('GADDR+');
        }

        if (!rider) {
            rider = {
                rider_id: 9999,
                rider_name: acronymUpper === 'GTPDRC' ? 'Group Total and Permanent Disability Rider for Creditors' :
                            acronymUpper === 'GTPDR' ? 'Group Total and Permanent Disability Rider' :
                            acronymUpper === 'GTIR' ? 'Group Terminal Illness Rider' :
                            acronymUpper === 'GMR' ? 'Group Medical Rider' :
                            acronymUpper === 'GMBDR' ? 'Group Mosquito-Borne Disease Rider' :
                            acronymUpper === 'GHIR' ? 'Group Hospital Income Rider' :
                            acronymUpper === 'GDR' ? 'Group Dengue Rider' :
                            acronymUpper === 'GCIR45' ? 'Group Critical Illness Rider – Top 45' :
                            acronymUpper === 'GCIR5' ? 'Group Critical Illness Rider – Top 5' :
                            acronymUpper === 'GAMERR' ? 'Group Accidental Medical Expense Reimbursement Rider' :
                            acronymUpper === 'GADDSR' ? 'Group Special Accidental Death and Disability Rider' :
                            acronymUpper === 'GADDRP' ? 'Group Accidental Death and Disability Rider Plus' : 
                            acronymUpper === 'GADDR' ? 'Group Accidental Death and Disability Rider' : `${acronymUpper} Rider`,
                acronym: acronymUpper === 'GADDRP' ? 'GADDR+' : acronymUpper,
                min_amount: 10000,
                max_amount: 1000000,
                unit_value: 1000,
                is_active: 1
            };
        } else if (acronymUpper === 'GADDRP') {
            rider.acronym = 'GADDR+';
        }

        // 2. Dynamically import the template function (with cache-busting timestamp parameter to prevent stale ESM memory cache)
        const templateFilename = `${acronymUpper}.js`;
        const templateRelativePath = `../../templates/rider/${templateFilename}`;
        
        let generateTemplate;
        try {
            const templateModule = await import(`${templateRelativePath}?update=${Date.now()}`);
            generateTemplate = templateModule[`generate${acronymUpper}Template`] || templateModule.default || templateModule[`generate${acronymUpper}`];
        } catch (importErr) {
            console.error(`Failed to import template for ${acronymUpper}:`, importErr);
            return res.status(404).json({ 
                message: `Template file for rider '${acronymUpper}' is not implemented yet. Expected function generate${acronymUpper}Template in templates/rider/${templateFilename}` 
            });
        }

        if (typeof generateTemplate !== 'function') {
            return res.status(500).json({
                message: `Template file templates/rider/${templateFilename} does not export a valid generator function.`
            });
        }

        // 3. Render HTML content
        const mockApplication = {
            effective_date: new Date()
        };
        const mockDetails = {
            logoDataUri: getImageDataUri('img/phillife-logo-hd.png')
        };

        const htmlContent = generateTemplate(mockApplication, mockDetails, rider);

        // 4. Return HTML or PDF depending on format (defaults to PDF)
        const format = req.query.format || 'pdf';
        if (format.toLowerCase() === 'pdf') {
            try {
                const pdfBuffer = await generatePDFBuffer(htmlContent, {
                    preferCSSPageSize: true,
                    displayHeaderFooter: true,
                    headerTemplate: '<div></div>',
                    footerTemplate: `
                        <div style="width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; font-size: 7.5pt; color: #718096; line-height: 1.35; padding-top: 6px; border-top: 1px solid #cbd5e1; margin: 0 20mm;">
                            Philippine Life Financial Assurance Corporation<br>
                            11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
                            Tel. No: (632) 7798-5433 | www.phillife.com.ph
                        </div>
                    `,
                    margin: {
                        top: '12mm',
                        bottom: '22mm',
                        left: '0mm',
                        right: '0mm'
                    }
                });
                res.contentType("application/pdf");
                return res.send(pdfBuffer);
            } catch (pdfErr) {
                console.error("PDF generation failed:", pdfErr);
                return res.status(500).json({ message: "Failed to render PDF.", error: pdfErr.message });
            }
        }

        res.contentType("text/html");
        return res.send(htmlContent);

    } catch (err) {
        console.error("Controller Error:", err);
        return error(res, err.message);
    }
};