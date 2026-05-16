import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import * as Model from '../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../models/actuarial_api/actuarial.model.js';
import * as User from '../models/user/user_model.js';
import { generateGCLIPDFContent } from '../templates/proposal_generator.js';
import { generateBarangayPDFContent } from '../templates/prototype_BarangayProtectPlan.js';
import { generateStudentsGTLIPPDFContent } from '../templates/prototype_StudentsGroupTermLifeInsurancePlan.js';
import { generateStudentsGPAPDFContent } from '../templates/prototype_StudentsGroupPersonalAccidentPlan.js';
import { generateGroupAssociationsPDFContent } from '../templates/prototype_GroupAssociationsPlan.js';
import { generateSecurityGuardsPDFContent } from '../templates/prototype_SecurityGuardsProtectionPlan.js';
import { generateGCLIInitialLoanPDFContent } from '../templates/prototype_GroupCreditLifePrototypePlanInitialLoan.js';
import { generateGCLIOutstandingLoanBalancePDFContent } from '../templates/prototype_GroupCreditLifeInsuranceOutstandingLoanBalance.js';
import { generateHotelEmployeesPDFContent } from '../templates/prototype_HotelEmployeesGroupTermLifeInsurancePlan.js';
import { generateSmallGroupsPDFContent } from '../templates/prototype_PlanforSmallGroups.js';

// Helper to generate a human-readable timestamp (DDMMYYYY-HHMMSS) for filenames
export const getFileTimestamp = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${dd}${mm}${yyyy}-${hh}${min}${ss}`;
};

// Helper to convert local images to Base64 Data URIs for PDF rendering
export const getImageDataUri = (imagePath) => {
    try {
        const fullPath = path.resolve(imagePath);
        if (fs.existsSync(fullPath)) {
            const fileBuffer = fs.readFileSync(fullPath);
            const ext = path.extname(imagePath).slice(1).toLowerCase();
            const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
            return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        }
    } catch (e) {}
    return null;
};

// Configuration for rich-text sanitization
export const sanitizeOptions = {
    allowedTags: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'span', 'div'],
    allowedAttributes: {
        'span': ['style'],
    }
};

// Helper to determine and update status based on actuarial input completion
export const updateActuarialStatus = async (applicationId, userId) => {
    const app = await Model.getApplicationById(applicationId);
    if (!app) return;

    const user = await User.getUserById(userId);
    const isSuperAdmin = user && user.roleName === 'Super Admin';

    if (app.status_id === 4 || app.status_id === 6 || (app.status_id === 3 && !isSuperAdmin)) return;

    const rates = await ActuarialModel.getApplicationRates(applicationId);
    const hasRates = rates && rates.length > 0;
    const hasPremium = app.total_annual_premium !== null && app.total_annual_premium !== undefined;
    const hasNotes = app.evidence_notes !== null && app.evidence_notes !== '' && app.evidence_notes !== undefined;

    let newStatusId = app.status_id;
    if (hasRates && hasPremium && hasNotes) {
        newStatusId = 2; // Approved
    } else if (hasRates || hasPremium || hasNotes) {
        newStatusId = 1; // Pending
    } else {
        newStatusId = 5; // Checking
    }

    if (newStatusId !== app.status_id) {
        await Model.updateApplication(applicationId, { status_id: newStatusId }, userId);
    }
};

// Helper to clean "other" fields based on selected IDs
export const cleanupOtherFields = async (data) => {
    const mutableData = { ...data };
    const idsToCheck = [];
    if (mutableData.group_classification_id !== undefined) idsToCheck.push(mutableData.group_classification_id);
    if (mutableData.group_type_id !== undefined) idsToCheck.push(mutableData.group_type_id);

    if (idsToCheck.length === 0) return mutableData;

    const namesMap = await Model.getLookupNamesByIds(idsToCheck);
    const isOther = (id) => {
        if (id == null) return false;
        const name = namesMap.get(id);
        return name === 'Other' || name === 'Others';
    };

    if (mutableData.group_classification_id !== undefined && !isOther(mutableData.group_classification_id)) {
        mutableData.other_group_classification = null;
    }
    if (mutableData.group_type_id !== undefined && !isOther(mutableData.group_type_id)) {
        mutableData.other_group_type = null;
    }
    return mutableData;
};

// Helper to nullify fields based on proposal type (Prototype vs Product)
export const cleanProposalFields = (data) => {
    const mutableData = { ...data };
    const PROTOTYPE_TYPE_ID = 30;

    if (mutableData.type_of_proposal_id && Number(mutableData.type_of_proposal_id) === PROTOTYPE_TYPE_ID) {
        mutableData.plan_id = null;
        mutableData.basic_plan_id = null;
        mutableData.riders = [];
        mutableData.amount_loans_id = null;
        mutableData.max_loan_amount = null;
        mutableData.min_loan_amount = null;
        mutableData.loan_portfolio_amount = null;
        mutableData.loans_amount = null;
        mutableData.commission_rate = null;
        mutableData.service_fee = null;
        mutableData.borrower_amount_18_65 = null;
        mutableData.borrower_amount_66_70 = null;
        mutableData.borrower_amount_71_75 = null;
        mutableData.borrower_amount_76_80 = null;
        mutableData.payment = [];
        mutableData.coverage_type_id = null;
        mutableData.level_ranking = null;
        mutableData.uniform_coverage_amount = null;
        mutableData.salary_ranking = null;
        mutableData.borrower_age_66_70 = 0;
        mutableData.borrower_age_71_75 = 0;
        mutableData.borrower_age_76_80 = 0;
    } else if (mutableData.type_of_proposal_id) {
        mutableData.prototype_id = null;
    }

    ['borrower_age_66_70', 'borrower_age_71_75', 'borrower_age_76_80'].forEach(field => {
        if (mutableData[field] !== undefined) mutableData[field] = mutableData[field] ? 1 : 0;
    });

    if (mutableData.plan_id && Number(mutableData.plan_id) !== 1) {
        mutableData.amount_loans_id = null;
        mutableData.max_loan_amount = null;
        mutableData.min_loan_amount = null;
        mutableData.loan_portfolio_amount = null;
        mutableData.loans_amount = null;
    }

    if (mutableData.plan_id && ![1, 2, 3].includes(Number(mutableData.plan_id))) {
        ['18_65', '66_70', '71_75', '76_80'].forEach(s => mutableData[`borrower_amount_${s}`] = null);
    }

    ['66_70', '71_75', '76_80'].forEach(suffix => {
        if (mutableData[`borrower_age_${suffix}`] === 0) mutableData[`borrower_amount_${suffix}`] = null;
    });

    return mutableData;
};

// Helper to handle channel type business rules
export const handleChannelType = (data, user) => {
    const mutableData = { ...data };
    if (mutableData.channel_type_id !== undefined) {
        if (Number(mutableData.channel_type_id) === 55 && user) {
            mutableData.channel_name = [user.firstname, user.middlename, user.lastname, user.suffix].filter(Boolean).join(' ');
        }
    }
    return mutableData;
};

// Helper to expand simplified rider inputs and enforce rules
export const preprocessRiders = (data) => {
    let designations = [];
    if (data.salary_ranking && Array.isArray(data.salary_ranking)) {
        designations = data.salary_ranking.map(r => r.designation).filter(Boolean);
    } else if (data.level_ranking && Array.isArray(data.level_ranking)) {
        designations = data.level_ranking.map(r => r.designation).filter(Boolean);
    }

    if (!data.riders || !Array.isArray(data.riders)) return data;

    data.riders = data.riders.map(rider => {
        const riderId = Number(rider.rider_id);
        let baseAmount = rider.amount !== undefined ? Number(rider.amount) : undefined;
        let baseUnit = rider.unit !== undefined ? Number(rider.unit) : undefined;

        if (rider.values && rider.values.length === 1) {
            if (rider.values[0].amount !== undefined) baseAmount = Number(rider.values[0].amount);
            if (rider.values[0].unit !== undefined) baseUnit = Number(rider.values[0].unit);
        }

        if (riderId === 8 && baseAmount !== undefined && (baseAmount < 100 || baseAmount > 300)) throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
        if (riderId === 9 && baseAmount !== undefined && baseAmount < 500) throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
        if (riderId === 11) baseAmount = 50000;
        if (riderId === 13) {
            if (baseUnit === 1) baseAmount = 30000;
            if (baseUnit === 2) baseAmount = 60000;
        }

        const isSingular = (rider.values && rider.values.length === 1) || (!rider.values && (baseAmount !== undefined || baseUnit !== undefined));
        if (designations.length > 0 && isSingular) {
            return { ...rider, values: designations.map(d => ({ designation: d, amount: baseAmount, unit: baseUnit })) };
        }
        if (riderId === 11 && rider.values) rider.values = rider.values.map(v => ({ ...v, amount: 50000 }));
        if (riderId === 13 && rider.values) rider.values = rider.values.map(v => ({ ...v, amount: v.unit === 1 ? 30000 : (v.unit === 2 ? 60000 : v.amount) }));
        return rider;
    });
    return data;
};

// Helper to transform DB rows back to template format
export const formatDbRatesForTemplate = (dbRows, category, planId) => {
    if (!dbRows || dbRows.length === 0) return {};
    const filtered = dbRows.filter(row => row.borrower_category === category);
    if (filtered.length === 0) return {};
    const isGCLI = planId === 1;
    if (category !== '18_65') {
        return filtered.reduce((acc, row) => {
            const ageKey = `Age ${row.attained_age}`;
            if (!acc[ageKey]) acc[ageKey] = {};
            acc[ageKey][isGCLI ? row.term_months : (row.rider_name || `Rider ${row.rider_id}`)] = row.premium_amount ? row.premium_amount.toFixed(2) : '0.00';
            return acc;
        }, {});
    }
    return filtered.reduce((acc, row) => {
        acc[isGCLI ? row.term_months : (row.rider_name || `Rider ${row.rider_id}`)] = row.premium_amount ? row.premium_amount.toFixed(2) : '0.00';
        return acc;
    }, {});
};

// Helper to build structured response for a single application
export const buildApplicationResponse = async (app) => {
    const subGroupTypes = await Model.getApplicationSubGroups(app.application_id);
    const paymentTermsRaw = await Model.getApplicationPaymentTerms(app.application_id);
    const riders = await Model.getApplicationRiders(app.application_id);
    const rankings = await Model.getCoverageRankingsByAppId(app.application_id);
    const rankingRiders = await Model.getCoverageRankingRiders(app.application_id);

    if ((app.coverage_type_id === 32 || app.coverage_type_id === 34) && rankingRiders.length > 0) {
        riders.forEach(mainRider => {
            const riderValues = rankingRiders.filter(rr => rr.rider_id === mainRider.rider_id).map(rr => ({ designation: rr.designation, acronym: rr.acronym, amount: rr.rider_amount, unit: rr.rider_unit }));
            if (riderValues.length > 0) mainRider.values = riderValues;
        });
    }

    let levelRanking = app.coverage_type_id === 32 ? rankings.map(({ salary_multiplier, uniform_coverage_amount, ...rest }) => rest) : null;
    let salaryRanking = app.coverage_type_id === 34 ? rankings.map(({ uniform_coverage_amount, ...rest }) => rest) : null;

    // Calculate coverage_totals based on rankings
    let coverage_totals = [];
    if (app.coverage_type_id !== 34) {
        coverage_totals = rankings.map(r => ({
            designation: r.designation,
            total_coverage_amount: r.total_coverage_amount
        }));
    }
    
    const {
        status_id, status_name,
        group_classification_id, group_classification_name, other_group_classification,
        business_type_id, business_type_name, other_business_type,
        group_type_id, group_type_name, other_group_type,
        payment_mode_id, payment_mode_name,
        coverage_type_id, coverage_type_name,
        channel_type_id, channel_type_name, channel_name,
        business_nature_name, sub_business_nature_name,
        type_of_proposal_id, type_of_proposal_name,
        prototype_id, prototype_plan_name, prototype_plan_acronym,
        plan_id, plan_name, plan_acronym,
        basic_plan_id, basic_plan_name,
        amount_loans_id, amount_loans_name,
        creator_firstname, creator_middlename, creator_lastname, creator_suffix,
        contact_person_salutation, contact_person_firstname, contact_person_mi, contact_person_lastname,
        loan_maturity_month_name,
        payment_term_id, sub_payment_term_id,
        excel_file_path,
        ...cleanedApp
    } = app;

    return {
        ...cleanedApp,
        user_full_name: [creator_firstname, creator_middlename, creator_lastname, creator_suffix].filter(Boolean).join(' '),
        contact_person: {
            full_name: [contact_person_salutation, contact_person_firstname, contact_person_mi, contact_person_lastname].filter(Boolean).join(' '),
            salutation: contact_person_salutation,
            firstname: contact_person_firstname,
            mi: contact_person_mi,
            lastname: contact_person_lastname
        },
        excel_file_path: excel_file_path ? path.basename(excel_file_path) : null,
        business_nature_id: app.business_nature_id,
        sub_business_nature_id: app.sub_business_nature_id,
        status: { id: status_id, name: status_name },
        group_classification: { 
            id: group_classification_id, 
            name: group_classification_name,
            other_value: other_group_classification
        },
        business_type: {
            id: business_type_id,
            name: business_type_name,
            other_value: other_business_type
        },
        group_type: { 
            id: group_type_id, 
            name: group_type_name,
            other_value: other_group_type
        },
        payment_mode: { id: payment_mode_id, name: payment_mode_name },
        coverage_type: {
            id: coverage_type_id,
            name: coverage_type_name,
            details: coverage_type_id === 32 ? levelRanking : 
                    coverage_type_id === 34 ? salaryRanking :
                    coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
        },
        channel_type: {
            id: channel_type_id,
            name: channel_type_name,
            channel_name: channel_name || null
        },
        business_nature: app.business_nature_id ? {
            id: app.business_nature_id,
            name: business_nature_name,
            sub_nature: app.sub_business_nature_id ? {
                id: app.sub_business_nature_id,
                name: sub_business_nature_name
            } : null
        } : null,
        sub_group_types: subGroupTypes,
        payment: paymentTermsRaw.map(p => ({ 
            payment_term: { id: p.payment_term_id, name: p.payment_term_name }, 
            sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name || p.sub_payment_term_id?.toString() } 
        })),
        type_of_proposal: {
            id: type_of_proposal_id,
            name: type_of_proposal_name
        },
        prototype_plan: { 
            id: prototype_id, 
            name: prototype_plan_name && prototype_plan_acronym ? `${prototype_plan_name} (${prototype_plan_acronym})` : prototype_plan_name 
        },
        plan: { 
            id: plan_id, 
            name: plan_name && plan_acronym ? `${plan_name} (${plan_acronym})` : plan_name 
        },
        basic_plan: { id: basic_plan_id, name: basic_plan_name },
        amount_loans: amount_loans_id ? { id: amount_loans_id, name: amount_loans_name } : null,
        riders,
        coverage_totals,
        level_ranking: levelRanking,
        salary_ranking: salaryRanking,
        uniform_coverage_amount: coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
    };
};

// Helper to generate HTML for a proposal
export const generateProposalHtml = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) throw new Error("Application not found.");
    const ratesRows = await ActuarialModel.getApplicationRates(id);
    const paymentTerms = await Model.getApplicationPaymentTerms(id);
    const maturity = paymentTerms.length > 0 ? Number(paymentTerms[0].sub_payment_term_id) : 0;
    const planId = Number(appData.plan_id);
    let user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    const application = { 
        ...appData, 
        status: { name: appData.status_name || 'Pending' },
        basic_plan: { name: appData.basic_plan_name || appData.prototype_plan_name || 'N/A' },
        payment_mode: { name: appData.payment_mode_name || 'N/A' }
    };
    const details = {
        totalAnnualPremium: appData.total_annual_premium || 0,
        maturity,
        maxAmount18_65: appData.borrower_amount_18_65 || 0,
        maxAmount66_70: appData.borrower_amount_66_70 || 0,
        maxAmount71_75: appData.borrower_amount_71_75 || 0,
        maxAmount76_80: appData.borrower_amount_76_80 || 0,
        rates18_65: formatDbRatesForTemplate(ratesRows, '18_65', planId),
        rates66_70: formatDbRatesForTemplate(ratesRows, '66_70', planId),
        rates71_75: formatDbRatesForTemplate(ratesRows, '71_75', planId),
        rates76_80: formatDbRatesForTemplate(ratesRows, '76_80', planId),
        logoDataUri: getImageDataUri('img/phillife-logo-hd.jpg'), 
        centerPhotoUri: getImageDataUri('img/cover.png'), 
        footerPhotoUri: getImageDataUri('img/footer.png') 
    };

    if (application.type_of_proposal_id === 30) {
        switch (application.prototype_id) {
            case 1: return generateStudentsGTLIPPDFContent(application, user, details);
            case 2: return generateStudentsGPAPDFContent(application, user, details);
            case 3: return generateGroupAssociationsPDFContent(application, user, details);
            case 4: return generateSecurityGuardsPDFContent(application, user, details);
            case 5: return generateGCLIInitialLoanPDFContent(application, user, details);
            case 6: return generateGCLIOutstandingLoanBalancePDFContent(application, user, details);
            case 7: return generateHotelEmployeesPDFContent(application, user, details);
            case 8: return generateSmallGroupsPDFContent(application, user, details);
            case 9: return generateBarangayPDFContent(application, user, details);
            default: return generateGCLIPDFContent(application, user, details);
        }
    }
    return generateGCLIPDFContent(application, user, details);
};

// Helper for unified PDF generation logic
export const generatePDFBuffer = async (htmlContent) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--single-process',
                '--font-render-hinting=none',
                '--force-color-profile=srgb',
            ]
        });

        const page = await browser.newPage();
        // Standard A4 dimensions at 96 DPI helps accurate pagination calculation
        await page.setViewport({ width: 794, height: 1122, deviceScaleFactor: 1 });

        await page.setContent(htmlContent, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');

        // Small delay to allow layout engine to stabilize for counter(page) calculations
        await new Promise(resolve => setTimeout(resolve, 500));

        return await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="
                    width: 100%;
                    font-size: 15px;
                    color: white;
                    padding: 0 30px;
                    text-align: right;
                ">
                    Page <span class="pageNumber"></span>
                </div>`,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '0mm',
                right: '0mm'
            }
        });
    } finally {
        // Ensure browser is always closed to prevent memory leaks
        if (browser) await browser.close();
    }
};