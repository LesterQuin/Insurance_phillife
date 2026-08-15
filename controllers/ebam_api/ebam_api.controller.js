import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as EbamModel from '../../models/ebam_api/ebam_api.model.js';
import * as Helper from '../../middlewares/helper.js';
import { success, error } from '../../utils/response.js';
import { generateCOCTemplate } from '../../templates/coc/cocTemplate.js';
import { getApplicationRates } from '../../models/actuarial_api/actuarial.model.js';

// Helper to build application structure for template
const buildCOCTemplateData = (data) => {
    const { 
        appData, riders, rankings, rankingRiders, provisions, contribution_text, eligible_individuals, participation_requirements, termination_age,
        provision_enrollment, provision_rollover, provision_termination, provision_definitions, provision_claims, refund_of_premiums,
        amount_of_insurance, coverage_period, due_dates,
        nel, nmed, med, max_limit, underwriting_notes
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
        special_underwriting_provisions: provisions || null,
        contribution_text: contribution_text || null,
        eligible_individuals: eligible_individuals || null,
        participation_requirements: participation_requirements || null,
        termination_age: termination_age || null,
        provision_enrollment: provision_enrollment || null,
        provision_rollover: provision_rollover || null,
        provision_termination: provision_termination || null,
        provision_definitions: provision_definitions || null,
        provision_claims: provision_claims || null,
        refund_of_premiums: refund_of_premiums || null,
        amount_of_insurance: amount_of_insurance || null,
        coverage_period: coverage_period || null,
        due_dates: due_dates || null,
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
const createMasterPolicyContractPDF = async (application, details, riderTemplatesHtml) => {
    const { generateMasterPolicyContractTemplate } = await import('../../templates/policy_contract/policy_contract_generator.js');
    const fullHtml = await generateMasterPolicyContractTemplate(application, details, riderTemplatesHtml);

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
    const exactRiderRange = measuredRiderEnd >= 18 ? `18-${measuredRiderEnd}` : '18';

    if (htmlBody.includes('{{RIDER_PAGE_RANGE}}')) {
        const updatedHtmlBody = htmlBody.replace('{{RIDER_PAGE_RANGE}}', exactRiderRange);
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
        const rates = await getApplicationRates(id);
        const details = {
            logoDataUri: Helper.getImageDataUri('img/phillife-logo-hd.png'),
            riders: data.riders || [],
            isReview: showWatermark,
            rates: rates || []
        };

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
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("Master Policy Contract PDF Error:", err);
        return error(res, err.message, 500);
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
        const rates = await getApplicationRates(id);
        const details = {
            logoDataUri: Helper.getImageDataUri('img/phillife-logo-hd.png'),
            riders: data.riders || [],
            isReview: showWatermark,
            rates: rates || []
        };

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
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("Master Policy Contract Download Error:", err);
        return error(res, err.message, 500);
    }
};
