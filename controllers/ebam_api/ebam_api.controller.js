import * as EbamModel from '../../models/ebam_api/ebam_api.model.js';
import * as Helper from '../../middlewares/helper.js';
import { error } from '../../utils/response.js';
import { generateCOCTemplate } from '../../templates/coc/cocTemplate.js';

// Helper to build application structure for template
const buildCOCTemplateData = (data) => {
    const { appData, riders, rankings, rankingRiders } = data;

    if ((appData.coverage_type_id === 32 || appData.coverage_type_id === 34) && rankingRiders.length > 0) {
        riders.forEach(mainRider => {
            const riderValues = rankingRiders
                .filter(rr => rr.rider_id === mainRider.rider_id)
                .map(rr => ({ 
                    designation: rr.designation, 
                    acronym: rr.acronym, 
                    amount: rr.rider_amount, 
                    unit: rr.rider_unit 
                }));
            if (riderValues.length > 0) mainRider.values = riderValues;
        });
    }

    const levelRanking = appData.coverage_type_id === 32 ? rankings.map(({ salary_multiplier, uniform_coverage_amount, ...rest }) => rest) : null;
    const salaryRanking = appData.coverage_type_id === 34 ? rankings.map(({ uniform_coverage_amount, ...rest }) => rest) : null;

    return { 
        ...appData, 
        riders,
        level_ranking: levelRanking,
        salary_ranking: salaryRanking,
        uniform_coverage_amount: appData.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
        status: { id: appData.status_id, name: appData.status_name || 'Pending' },
        plan: { id: appData.plan_id, name: appData.plan_name && appData.plan_acronym ? `${appData.plan_name} (${appData.plan_acronym})` : appData.plan_name, acronym: appData.plan_acronym || null },
        basic_plan: { 
            id: appData.basic_plan_id, 
            name: appData.basic_plan_name 
                ? (appData.basic_plan_acronym ? `${appData.basic_plan_name} (${appData.basic_plan_acronym})` : appData.basic_plan_name)
                : (appData.prototype_plan_name && appData.prototype_plan_acronym 
                    ? `${appData.prototype_plan_name} (${appData.prototype_plan_acronym})` 
                    : (appData.prototype_plan_name || 'N/A')),
            acronym: appData.basic_plan_acronym || appData.prototype_plan_acronym || null
        },
        group_type: {
            id: appData.group_type_id,
            name: appData.group_type_name
        }
    };
};

// View Confirmation of Coverage (COC) as PDF inline in browser
export const viewCOCPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const data = await EbamModel.getCOCPdfData(id);
        if (!data) return error(res, "Application not found.", 404);

        const application = buildCOCTemplateData(data);
        const details = {
            logoDataUri: Helper.getImageDataUri('img/phillife-logo-hd.png')
        };

        const htmlContent = generateCOCTemplate(application, data.user, details);
        const pdfBuffer = await Helper.generatePDFBuffer(htmlContent, { 
            displayHeaderFooter: false,
            margin: { top: '15mm', bottom: '0mm', left: '0mm', right: '0mm' }
        });

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename=COC_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("COC View Error:", err);
        return error(res, err.message, 500);
    }
};

// Download Confirmation of Coverage (COC) as PDF
export const downloadCOCPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const data = await EbamModel.getCOCPdfData(id);
        if (!data) return error(res, "Application not found.", 404);

        const application = buildCOCTemplateData(data);
        const details = {
            logoDataUri: Helper.getImageDataUri('img/phillife-logo-hd.png')
        };

        const htmlContent = generateCOCTemplate(application, data.user, details);
        const pdfBuffer = await Helper.generatePDFBuffer(htmlContent, { 
            displayHeaderFooter: false,
            margin: { top: '15mm', bottom: '0mm', left: '0mm', right: '0mm' }
        });

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=COC_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("COC Download Error:", err);
        return error(res, err.message, 500);
    }
};
