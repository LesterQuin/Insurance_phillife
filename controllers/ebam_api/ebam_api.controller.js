import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as EbamModel from '../../models/ebam_api/ebam_api.model.js';
import * as TatModel from '../../models/ebam_api/contract_tat.model.js';
import * as Helper from '../../middlewares/helper.js';
import { success, error } from '../../utils/response.js';
import { generateCOCTemplate } from '../../templates/coc/cocTemplate.js';
import { getApplicationRates } from '../../models/actuarial_api/actuarial.model.js';

// Helper to build application structure for template
const buildCOCTemplateData = (data) => {
    const { 
        appData, riders, rankings, rankingRiders, provisions, contribution_text, eligible_individuals, participation_requirements,
        participation_percentage, participation_minimum_no, termination_age,
        provision_enrollment, provision_rollover, provision_termination, provision_definitions, provision_claims, refund_of_premiums,
        amount_of_insurance, coverage_period, due_dates, first_due_date, renewal_due_date, additions_due_date,
        signing_location, doc_code,
        nel, nmed, med, max_limit, underwriting_notes,
        provision_face_amount, provision_premium_computation, provision_non_coverage
    } = data;

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
        signing_location: signing_location || appData.signing_location || null,
        doc_code: doc_code || appData.doc_code || null,
        special_underwriting_provisions: provisions || null,
        contribution_text: contribution_text || null,
        eligible_individuals: eligible_individuals || null,
        participation_requirements: participation_requirements || null,
        participation_percentage: participation_percentage || null,
        participation_minimum_no: participation_minimum_no || null,
        termination_age: termination_age || null,
        provision_enrollment: provision_enrollment || null,
        provision_rollover: provision_rollover || null,
        provision_termination: provision_termination || null,
        provision_definitions: provision_definitions || null,
        provision_claims: provision_claims || null,
        provision_face_amount: provision_face_amount || null,
        provision_premium_computation: provision_premium_computation || null,
        provision_non_coverage: provision_non_coverage || null,
        refund_of_premiums: refund_of_premiums || null,
        amount_of_insurance: amount_of_insurance || null,
        coverage_period: coverage_period || null,
        due_dates: due_dates || null,
        first_due_date: first_due_date || null,
        renewal_due_date: renewal_due_date || null,
        additions_due_date: additions_due_date || null,
        nel: nel || [],
        nmed: nmed || [],
        med: med || [],
        max_limit: max_limit || [],
        underwriting_notes: (underwriting_notes || '').trim() || null,
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

/**
 * Assemblies Master Policy Contract PDF with pdf-lib:
 * - Page 1 (Cover Page): Rendered with displayHeaderFooter: false (GUARANTEED NO FOOTER)
 * - Pages 2+: Rendered with displayHeaderFooter: true (REPEATING CORPORATE FOOTER)
 */
const getSpecificContractTemplateName = (application = {}) => {
    const basicPlanName = (application?.basic_plan_name || application?.plan_name || application?.basic_plan_acronym || application?.plan_acronym || '').toUpperCase();
    const amountLoansName = (application?.amount_loans_name || '').toUpperCase();

    // 1. GCLI (Group Credit Life Insurance)
    if (basicPlanName.includes('CREDIT LIFE') || basicPlanName.includes('GCLI') || basicPlanName.includes('G-CLI')) {
        if (amountLoansName.includes('INITIAL') || amountLoansName.includes('ANNUAL') || amountLoansName.includes('ORIGINAL') || amountLoansName.includes('PRINCIPAL') || amountLoansName.includes('DECREASING') || basicPlanName.includes('PRINCIPAL')) {
            return 'GCLI_policy_contract_principal';
        }
        return 'GCLI_policy_contract_outstanding';
    }

    // 2. GPA / GADDP (Group Personal Accident / Group Accidental Death & Disability Plan)
    if (basicPlanName.includes('ACCIDENTAL DEATH') || basicPlanName.includes('GADDP') || basicPlanName.includes('GPA') || basicPlanName.includes('G-ADD') || basicPlanName.includes('GADD')) {
        return 'GPA_policy_contract_GADDP';
    }

    // Uncreated basic plan templates return null
    return null;
};

const createMasterPolicyContractPDF = async (application, details, riderTemplatesHtml) => {
    const templateFileName = getSpecificContractTemplateName(application);
    if (!templateFileName) {
        const planDisplay = application?.basic_plan_name || application?.plan_name || 'this basic plan';
        const err = new Error(`The policy contract template for ${planDisplay} has not been created yet.`);
        err.statusCode = 422;
        throw err;
    }

    const templateModule = await import(`../../templates/policy_contract/${templateFileName}.js?update=${Date.now()}`);
    
    const generateFn = templateModule.generateGPAGADDPPolicyContract || 
                       templateModule.generateGCLIOutstandingPolicyContract || 
                       templateModule.generateGCLIPrincipalPolicyContract || 
                       templateModule.generateGYRTPolicyContract || 
                       templateModule.generateGCI45PolicyContract || 
                       templateModule.default;

    if (typeof generateFn !== 'function') {
        const planDisplay = application?.basic_plan_name || application?.plan_name || templateFileName;
        const err = new Error(`The policy contract template for ${planDisplay} has not been created yet.`);
        err.statusCode = 422;
        throw err;
    }

    const fullHtml = generateFn(application, details, riderTemplatesHtml);

    const pageBreakMarker = '<div class="page-break"></div>';
    const splitIndex = fullHtml.indexOf(pageBreakMarker);

    if (splitIndex === -1) {
        return await Helper.generatePDFBuffer(fullHtml, {
            preferCSSPageSize: true,
            displayHeaderFooter: false
        });
    }

    const headEndIndex = fullHtml.indexOf('</head>');
    const headHtml = fullHtml.substring(0, headEndIndex + 7);

    // Page 1 HTML
    const coverBodyHtml = fullHtml.substring(fullHtml.indexOf('<body>'), splitIndex);
    const htmlCover = `${headHtml}${coverBodyHtml}</div></body></html>`;

    // Pages 2+ HTML
    const remainingBodyHtml = fullHtml.substring(splitIndex + pageBreakMarker.length, fullHtml.indexOf('</body>'));
    const htmlBody = `${headHtml}<body><div class="page-container">${remainingBodyHtml}</body></html>`;

    // 1. Render Cover Page (Page 1) without footer
    const pdfBufferPage1 = await Helper.generatePDFBuffer(htmlCover, {
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '10mm', bottom: '10mm', left: '0mm', right: '0mm' }
    });

    // 2. Render Pages 2 to End with repeating corporate footer
    let pdfBufferBody = await Helper.generatePDFBuffer(htmlBody, {
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
            <div style="width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; font-size: 7.5pt; color: #718096; line-height: 1.35; padding-top: 4px; border-top: 1px solid #cbd5e1; margin: 0 20mm;">
                Philippine Life Financial Assurance Corporation<br>
                11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
                Tel. No: (632) 7798-5433 | www.phillife.com.ph
            </div>
        `,
        margin: { top: '12mm', bottom: '20mm', left: '0mm', right: '0mm' }
    });

    let docBody = await PDFDocument.load(pdfBufferBody);
    const measuredTotalPages = 1 + docBody.getPageCount();
    const measuredRiderEnd = measuredTotalPages - 1;

    let riderStart = 19;
    if (templateFileName.includes('principal')) {
        riderStart = 20;
    } else if (templateFileName.includes('GPA') || templateFileName.includes('GADDP') || templateFileName.includes('outstanding')) {
        riderStart = 19;
    }

    const hasRiders = Array.isArray(application?.riders) && application.riders.length > 0;
    const exactRiderRange = hasRiders
        ? (measuredRiderEnd >= riderStart ? `${riderStart}-${measuredRiderEnd}` : `${riderStart}`)
        : 'N/A';

    if (htmlBody.includes('{{RIDER_PAGE_RANGE}}')) {
        const updatedHtmlBody = htmlBody.replace(/\{\{RIDER_PAGE_RANGE\}\}/g, exactRiderRange);
        pdfBufferBody = await Helper.generatePDFBuffer(updatedHtmlBody, {
            preferCSSPageSize: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; font-size: 7.5pt; color: #718096; line-height: 1.35; padding-top: 4px; border-top: 1px solid #cbd5e1; margin: 0 20mm;">
                    Philippine Life Financial Assurance Corporation<br>
                    11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
                    Tel. No: (632) 7798-5433 | www.phillife.com.ph
                </div>
            `,
            margin: { top: '12mm', bottom: '20mm', left: '0mm', right: '0mm' }
        });
        docBody = await PDFDocument.load(pdfBufferBody);
    }

    // 3. Merge Page 1 + Pages 2 to End into single PDF package and apply page numbers
    const docPage1 = await PDFDocument.load(pdfBufferPage1);

    const mergedDoc = await PDFDocument.create();
    const [coverPage] = await mergedDoc.copyPages(docPage1, [0]);
    mergedDoc.addPage(coverPage);

    const bodyPages = await mergedDoc.copyPages(docBody, docBody.getPageIndices());
    bodyPages.forEach(p => mergedDoc.addPage(p));

    const font = await mergedDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = mergedDoc.getPageCount();

    for (let i = 1; i < totalPages; i++) {
        const page = mergedDoc.getPage(i);
        const { width } = page.getSize();
        const pageNumText = `Page ${i + 1} of ${totalPages}`;
        const textSize = 7.5;
        const textWidth = font.widthOfTextAtSize(pageNumText, textSize);

        page.drawText(pageNumText, {
            x: width - 56 - textWidth,
            y: 20,
            size: textSize,
            font: font,
            color: rgb(0.29, 0.33, 0.41)
        });
    }

    const mergedPdfBytes = await mergedDoc.save();
    return Buffer.from(mergedPdfBytes);
};

// Helper to extract inner <body> HTML & <style> blocks from rider templates so multiple riders render with full CSS without truncating
const extractRiderBody = (html) => {
    if (!html) return '';
    let styles = '';
    const styleMatches = html.match(/<style[\s\S]*?<\/style>/gi);
    if (styleMatches) {
        styles = styleMatches.join('\n');
    }
    const bodyStart = html.indexOf('<body>');
    const bodyEnd = html.lastIndexOf('</body>');
    let bodyContent = html;
    if (bodyStart !== -1 && bodyEnd !== -1) {
        bodyContent = html.substring(bodyStart + 6, bodyEnd);
    }

    // Unwrap layout-table if present so the header logo and body details flow naturally on the same page
    bodyContent = bodyContent
        .replace(/<table[^>]*class=["']layout-table["'][^>]*>/gi, '')
        .replace(/<\/table>/gi, '')
        .replace(/<thead[^>]*>/gi, '<div class="rider-header-wrapper">')
        .replace(/<\/thead>/gi, '</div>')
        .replace(/<tbody[^>]*>/gi, '<div class="rider-body-wrapper">')
        .replace(/<\/tbody>/gi, '</div>');

    return `${styles}\n${bodyContent}`;
};

// View Master Policy Contract as PDF in browser
export const viewPolicyContractPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const data = await EbamModel.getCOCPdfData(id);
        if (!data) return error(res, "Application not found.", 404);

        const application = buildCOCTemplateData(data);
        const showWatermark = req.query.watermark !== '0' && req.query.watermark !== 'false' && req.query.watermark !== 'off';
        const showSignoff = req.query.signoff !== '0' && req.query.signoff !== 'false' && req.query.signoff !== 'off';
        const rates = await getApplicationRates(id);
        const tatData = await TatModel.getContractTat(id);
        const details = {
            logoDataUri: Helper.getImageDataUri('img/phillife-logo-hd.png'),
            riders: data.riders || [],
            isReview: showWatermark,
            showSignoff: showSignoff,
            rates: rates || [],
            tat: tatData.items || []
        };
        application.tat = tatData.items || [];

        // Dynamically compile selected riders
        let riderTemplatesHtml = '';
        if (Array.isArray(data.riders) && data.riders.length > 0) {
            for (const r of data.riders) {
                const acronymUpper = (r.acronym || '').trim().toUpperCase();
                try {
                    const templateModule = await import(`../../templates/rider/${acronymUpper}.js?update=${Date.now()}`);
                    const fn = templateModule[`generate${acronymUpper}Template`] || templateModule.default;
                    if (typeof fn === 'function') {
                        const riderHtml = fn(application, details, r);
                        riderTemplatesHtml += extractRiderBody(riderHtml) + '<div class="page-break"></div>';
                    }
                } catch (rErr) {
                    console.log(`Rider template ${acronymUpper} skipped:`, rErr.message);
                }
            }
        }

        const pdfBuffer = await createMasterPolicyContractPDF(application, details, riderTemplatesHtml);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename=MasterPolicyContract_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("Master Policy Contract PDF Error:", err);
        return error(res, err.message, err.statusCode || 500);
    }
};

// Download Master Policy Contract PDF
export const downloadPolicyContractPDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const data = await EbamModel.getCOCPdfData(id);
        if (!data) return error(res, "Application not found.", 404);

        const application = buildCOCTemplateData(data);
        const showWatermark = req.query.watermark !== '0' && req.query.watermark !== 'false' && req.query.watermark !== 'off';
        const showSignoff = req.query.signoff !== '0' && req.query.signoff !== 'false' && req.query.signoff !== 'off';
        const rates = await getApplicationRates(id);
        const tatData = await TatModel.getContractTat(id);
        const details = {
            logoDataUri: Helper.getImageDataUri('img/phillife-logo-hd.png'),
            riders: data.riders || [],
            isReview: showWatermark,
            showSignoff: showSignoff,
            rates: rates || [],
            tat: tatData.items || []
        };
        application.tat = tatData.items || [];

        let riderTemplatesHtml = '';
        if (Array.isArray(data.riders) && data.riders.length > 0) {
            for (const r of data.riders) {
                const acronymUpper = (r.acronym || '').trim().toUpperCase();
                try {
                    const templateModule = await import(`../../templates/rider/${acronymUpper}.js?update=${Date.now()}`);
                    const fn = templateModule[`generate${acronymUpper}Template`] || templateModule.default;
                    if (typeof fn === 'function') {
                        const riderHtml = fn(application, details, r);
                        riderTemplatesHtml += extractRiderBody(riderHtml) + '<div class="page-break"></div>';
                    }
                } catch (rErr) {
                    console.log(`Rider template ${acronymUpper} skipped:`, rErr.message);
                }
            }
        }

        const pdfBuffer = await createMasterPolicyContractPDF(application, details, riderTemplatesHtml);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=MasterPolicyContract_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("Master Policy Contract Download Error:", err);
        return error(res, err.message, err.statusCode || 500);
    }
};

// Get list of EBAM Status lookup items
export const getEbamStatusList = async (req, res) => {
    try {
        const statuses = await EbamModel.getEbamStatusLookupList();
        return success(res, statuses, "EBAM statuses fetched successfully.", 200);
    } catch (err) {
        console.error("Get EBAM Statuses Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Contract TAT (Turn-Around Time) SLA items for an application
export const getContractTatController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const tatData = await TatModel.getContractTat(id);
        return success(res, tatData, "Contract TAT data fetched successfully.", 200);
    } catch (err) {
        console.error("Get Contract TAT Error:", err);
        return error(res, err.message, 500);
    }
};

// Save or Update Contract TAT (Turn-Around Time) SLA items for an application
export const saveContractTatController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked (status_id === 7) before allowing saves
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot input or modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        const currentEbamStatus = application.appData.ebam_status_id || 18;
        const lockedStatuses = [20, 22, 23, 24]; // For Contract Review, Approved, Ready for Issuance, Issued
        if (lockedStatuses.includes(currentEbamStatus)) {
            return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        }

        const items = req.body.items || req.body.tat_items || req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: [
                    {
                        field: "items",
                        message: "Invalid payload. 'items' must be a non-empty array of TAT entries."
                    }
                ]
            });
        }

        const maxSortOrder = TatModel.DEFAULT_TAT_ITEMS.length; // 37
        const validationErrors = [];

        items.forEach((item, idx) => {
            const fieldPrefix = `items[${idx}]`;

            if (item.sort_order !== undefined && item.sort_order !== null) {
                const parsedOrder = parseInt(item.sort_order);
                if (isNaN(parsedOrder) || parsedOrder < 1 || parsedOrder > maxSortOrder) {
                    validationErrors.push({
                        field: `${fieldPrefix}.sort_order`,
                        message: `Invalid sort_order '${item.sort_order}'. Must be an existing sort order between 1 and ${maxSortOrder}.`
                    });
                }
            } else if (item.activity) {
                const actName = String(item.activity).trim().toUpperCase();
                const exists = TatModel.DEFAULT_TAT_ITEMS.some(d => (d.activity || '').trim().toUpperCase() === actName);
                if (!exists) {
                    validationErrors.push({
                        field: `${fieldPrefix}.activity`,
                        message: `Invalid activity '${item.activity}'. Activity does not exist in standard TAT items (must be one of the standard activities 1 to ${maxSortOrder}).`
                    });
                }
            } else {
                validationErrors.push({
                    field: fieldPrefix,
                    message: `Each item must specify either an existing 'sort_order' (1 to ${maxSortOrder}) or a valid 'activity' name.`
                });
            }
        });

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: validationErrors
            });
        }

        const userId = req.user?.user_id || req.user?.id || null;
        const savedTat = await TatModel.saveContractTat(id, items, userId, req.ip);

        return success(res, savedTat, "Contract TAT data saved successfully.", 200);
    } catch (err) {
        console.error("Save Contract TAT Error:", err);
        return error(res, err.message, 500);
    }
};

// Reset Contract TAT (Turn-Around Time) SLA items back to template defaults
export const resetContractTatController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        const currentEbamStatus = application.appData.ebam_status_id || 18;
        const lockedStatuses = [20, 22, 23, 24];
        if (lockedStatuses.includes(currentEbamStatus)) {
            return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        }

        const userId = req.user?.user_id || req.user?.id || null;
        const resetData = await TatModel.resetContractTat(id, userId, req.ip);

        return success(res, resetData, "Contract TAT data reset to default template values successfully.", 200);
    } catch (err) {
        console.error("Reset Contract TAT Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Contract Conforme Signing Address
export const getContractSigningAddressController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const fallbackAddress = application.appData.business_address;
        const customAddress = application.signing_location || null;
        const activeAddress = customAddress || fallbackAddress;

        return success(res, {
            application_id: id,
            is_custom: Boolean(customAddress),
            signing_location: customAddress,
            fallback_address: fallbackAddress,
            active_address: activeAddress
        }, "Signing address fetched successfully.", 200);
    } catch (err) {
        console.error("Get Signing Address Error:", err);
        return error(res, err.message, 500);
    }
};

// Save or Update Contract Conforme Signing Address
export const saveContractSigningAddressController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked (status_id === 7)
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        // const currentEbamStatus = application.appData.ebam_status_id || 18;
        // const lockedStatuses = [20, 22, 23, 24];
        // if (lockedStatuses.includes(currentEbamStatus)) {
        //     return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        // }

        const signingLocation = req.body.signing_location ?? req.body.address ?? req.body.signing_address;
        if (signingLocation === undefined || signingLocation === null || String(signingLocation).trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: [
                    {
                        field: "signing_location",
                        message: "signing_location is required and must not be empty."
                    }
                ]
            });
        }

        const updatedApp = await EbamModel.saveSigningAddress(id, String(signingLocation).trim());
        const fallbackAddress = updatedApp.appData.business_address;
        const customAddress = updatedApp.signing_location || null;

        return success(res, {
            application_id: id,
            is_custom: true,
            signing_location: customAddress,
            fallback_address: fallbackAddress,
            active_address: customAddress || fallbackAddress
        }, "Signing address updated successfully.", 200);
    } catch (err) {
        console.error("Save Signing Address Error:", err);
        return error(res, err.message, 500);
    }
};

// Reset Contract Conforme Signing Address back to default fallback
export const resetContractSigningAddressController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked (status_id === 7)
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        const currentEbamStatus = application.appData.ebam_status_id || 18;
        const lockedStatuses = [20, 22, 23, 24];
        if (lockedStatuses.includes(currentEbamStatus)) {
            return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        }

        const updatedApp = await EbamModel.resetSigningAddress(id);
        const fallbackAddress = updatedApp.appData.business_address;

        return success(res, {
            application_id: id,
            is_custom: false,
            signing_location: null,
            fallback_address: fallbackAddress,
            active_address: fallbackAddress
        }, "Signing address reset to default company business address successfully.", 200);
    } catch (err) {
        console.error("Reset Signing Address Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Cover Page Document Code (Page 1 bottom left)
export const getContractDocCodeController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        const customDocCode = application.doc_code || null;

        return success(res, {
            application_id: id,
            has_doc_code: Boolean(customDocCode),
            doc_code: customDocCode
        }, "Document code fetched successfully.", 200);
    } catch (err) {
        console.error("Get Document Code Error:", err);
        return error(res, err.message, 500);
    }
};

// Save or Update Cover Page Document Code (Page 1 bottom left)
export const saveContractDocCodeController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked (status_id === 7)
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        // const currentEbamStatus = application.appData.ebam_status_id || 18;
        // const lockedStatuses = [20, 22, 23, 24];
        // if (lockedStatuses.includes(currentEbamStatus)) {
        //     return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        // }

        const docCode = req.body.doc_code ?? req.body.document_code ?? req.body.form_code;
        if (docCode === undefined || docCode === null || String(docCode).trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: [
                    {
                        field: "doc_code",
                        message: "doc_code is required and must not be empty."
                    }
                ]
            });
        }

        const updatedApp = await EbamModel.saveDocCode(id, String(docCode).trim());

        return success(res, {
            application_id: id,
            has_doc_code: true,
            doc_code: updatedApp.doc_code || String(docCode).trim()
        }, "Document code saved successfully.", 200);
    } catch (err) {
        console.error("Save Document Code Error:", err);
        return error(res, err.message, 500);
    }
};

// Clear Cover Page Document Code (Page 1 bottom left)
export const clearContractDocCodeController = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid application ID format.", 400);

        const application = await EbamModel.getCOCPdfData(id);
        if (!application) return error(res, "Application not found.", 404);

        // Verify proposal is booked (status_id === 7)
        if (application.appData.status_id !== 7) {
            return error(res, "Cannot modify contract details unless GMS status is Booked.", 400);
        }

        // Edit lock verification
        // const currentEbamStatus = application.appData.ebam_status_id || 18;
        // const lockedStatuses = [20, 22, 23, 24];
        // if (lockedStatuses.includes(currentEbamStatus)) {
        //     return error(res, "Contract is locked for editing while under review, approved, or issued. Change status to 'For Revision' to make updates.", 400);
        // }

        await EbamModel.clearDocCode(id);

        return success(res, {
            application_id: id,
            has_doc_code: false,
            doc_code: null
        }, "Document code cleared successfully.", 200);
    } catch (err) {
        console.error("Clear Document Code Error:", err);
        return error(res, err.message, 500);
    }
};

