import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Model from '../models/financial_Insurance_form.model.js';
import * as User from '../models/user/user_model.js';
import puppeteer from 'puppeteer';
import { success, error } from '../utils/response.js';
import { auditLog, AuditStatus, AuditActions, normalizeIp } from '../utils/logger.js';
import sanitizeHtml from 'sanitize-html';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration for rich-text sanitization
const sanitizeOptions = {
    allowedTags: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'span', 'div'],
    allowedAttributes: {
        'span': ['style'],
    }
};

// Helper to clean "other" fields based on selected IDs
const cleanupOtherFields = async (data) => {
    const mutableData = { ...data };
    const idsToCheck = [];
    if (mutableData.group_classification_id !== undefined) idsToCheck.push(mutableData.group_classification_id);
    if (mutableData.business_type_id !== undefined) idsToCheck.push(mutableData.business_type_id);
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
    if (mutableData.business_type_id !== undefined && !isOther(mutableData.business_type_id)) {
        mutableData.other_business_type = null;
    }
    if (mutableData.group_type_id !== undefined && !isOther(mutableData.group_type_id)) {
        mutableData.other_group_type = null;
    }

    return mutableData;
};

// Helper to nullify fields based on proposal type (Prototype vs Product)
const cleanProposalFields = (data) => {
    const mutableData = { ...data };
    const PROTOTYPE_TYPE_ID = 30;

    if (mutableData.type_of_proposal_id && Number(mutableData.type_of_proposal_id) === PROTOTYPE_TYPE_ID) {
        mutableData.plan_id = null;
        mutableData.basic_plan_id = null;
        mutableData.riders = [];
        mutableData.amount_loans_id = null;
        mutableData.loans_amount = null;
        mutableData.payment = [];
        mutableData.coverage_type_id = null;
        mutableData.level_ranking = null;
        mutableData.uniform_coverage_amount = null;
        mutableData.salary_ranking = null;
        
        // Reset age bracket flags for prototypes to avoid constraint errors
        mutableData.borrower_age_66_70 = 0;
        mutableData.borrower_age_71_75 = 0;
        mutableData.borrower_age_76_80 = 0;
    } else if (mutableData.type_of_proposal_id) {
        mutableData.prototype_id = null;
    }

    // Coerce boolean age bracket flags to 0 or 1 to satisfy NOT NULL constraints
    ['borrower_age_66_70', 'borrower_age_71_75', 'borrower_age_76_80'].forEach(field => {
        if (mutableData[field] !== undefined) {
            mutableData[field] = mutableData[field] ? 1 : 0;
        }
    });

    return mutableData;
};

// Helper to handle channel type business rules
const handleChannelType = (data, user) => {
    const mutableData = { ...data };
    if (mutableData.channel_type_id !== undefined) {
        const channelId = Number(mutableData.channel_type_id);
        // If Direct (55) is selected, we set the channel_name to the logged-in user's name
        if (channelId === 55 && user) {
            mutableData.channel_name = [user.firstname, user.middlename, user.lastname, user.suffix]
                .filter(Boolean)
                .join(' ');
        }
    }
    return mutableData;
};

// Helper to expand simplified rider inputs and enforce rules
const preprocessRiders = (data) => {
    // 1. Get Designations from rankings if available
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

        // If values array has exactly one item, treat it as the base for expansion
        if (rider.values && rider.values.length === 1) {
            if (rider.values[0].amount !== undefined) baseAmount = Number(rider.values[0].amount);
            if (rider.values[0].unit !== undefined) baseUnit = Number(rider.values[0].unit);
        }

        // Business Rules / Validation
        if (riderId === 8) { // Group Hospital Income Rider
            if (baseAmount !== undefined && (baseAmount < 100 || baseAmount > 300)) {
                throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
            }
        } else if (riderId === 9) { // Group Accidental Medical Expense Reimbursement Rider
            if (baseAmount !== undefined && baseAmount < 500) {
                throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
            }
        } else if (riderId === 11) { // Burial (Memorial/Service)
            baseAmount = 50000; // Fixed amount
        } else if (riderId === 13) { // Group Dengue Rider
             // Ensure amount corresponds to unit if not explicitly provided
            if (baseUnit === 1) baseAmount = 30000;
            if (baseUnit === 2) baseAmount = 60000;
        }

        // Expand to all designations if applicable
        const isSingular = (rider.values && rider.values.length === 1) || (!rider.values && (baseAmount !== undefined || baseUnit !== undefined));
        
        if (designations.length > 0 && isSingular) {
            const newValues = designations.map(d => ({
                designation: d,
                amount: baseAmount,
                unit: baseUnit
            }));
            return { ...rider, values: newValues };
        }

        // Special case: If Rider 11 has multiple values (manual input), ensure they are all 50000
        if (riderId === 11 && rider.values && rider.values.length > 0) {
            rider.values = rider.values.map(v => ({ ...v, amount: 50000 }));
        }

        // Special case: If Rider 13 has multiple values, ensure amounts match units
        if (riderId === 13 && rider.values && rider.values.length > 0) {
            rider.values = rider.values.map(v => ({ ...v, amount: v.unit === 1 ? 30000 : (v.unit === 2 ? 60000 : v.amount) }));
        }

        return rider;
    });

    return data;
};

// Helper to format rates for template (extract numeric key from "6 months" or "71 age")
const formatRatesForTemplate = (ratesArray, keyField) => {
    if (!Array.isArray(ratesArray)) return {};
    return ratesArray.reduce((acc, item) => {
        let rawKey = item[keyField];
        if (rawKey && item.rate !== undefined) {
            let key = rawKey;
            if (typeof rawKey === 'string') {
                const match = rawKey.match(/\d+/);
                if (match) key = parseInt(match[0], 10);
            }
            acc[key] = typeof item.rate === 'number' ? item.rate.toFixed(2) : item.rate;
        }
        return acc;
    }, {});
};

// Helper to transform DB rows (from new table) back to template format
const formatDbRatesForTemplate = (dbRows, category) => {
    if (!dbRows || dbRows.length === 0) return null;
    
    // Filter by category (e.g., '18_64')
    const filtered = dbRows.filter(row => row.borrower_category === category);
    if (filtered.length === 0) return null;

    return filtered.reduce((acc, row) => {
        const key = category === '76_80' ? row.attained_age : row.term_months;
        if (key) acc[key] = row.premium_amount ? row.premium_amount.toFixed(2) : '0.00';
        return acc;
    }, {});
};

// Helper to build structured response for a single application
const buildApplicationResponse = async (app) => {
    const subGroupTypes = await Model.getApplicationSubGroups(app.application_id);
    const paymentTermsRaw = await Model.getApplicationPaymentTerms(app.application_id);
    const paymentTerms = paymentTermsRaw.map(p => ({
        payment_term: { id: p.payment_term_id, name: p.payment_term_name },
        sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name }
    }));
    const riders = await Model.getApplicationRiders(app.application_id);
    const rankings = await Model.getCoverageRankingsByAppId(app.application_id);
    
    // Fetch nested ranking riders
    const rankingRiders = await Model.getCoverageRankingRiders(app.application_id);

    if ((app.coverage_type_id === 32 || app.coverage_type_id === 34) && rankingRiders.length > 0) {
        riders.forEach(mainRider => {
            const riderValues = rankingRiders
                .filter(rr => rr.rider_id === mainRider.rider_id)
                .map(rr => ({
                    designation: rr.designation,
                    amount: rr.rider_amount,
                    unit: rr.rider_unit
                }));
            
            if (riderValues.length > 0) {
                mainRider.values = riderValues;
            }
        });
    }

    let levelRanking = null;
    let salaryRanking = null;
    if (app.coverage_type_id === 32) { 
        levelRanking = rankings.map(({ salary_multiplier, uniform_coverage_amount, ...rest }) => rest);
    } else if (app.coverage_type_id === 34) { 
        salaryRanking = rankings.map(({ uniform_coverage_amount, ...rest }) => rest);
    }

    let coverage_totals = [];
    if (app.coverage_type_id !== 34) {
        coverage_totals = rankings.map(r => ({
            designation: r.designation,
            total_coverage_amount: r.total_coverage_amount
        }));
    }

    return {
        application_id: app.application_id,
        user_id: app.user_id,
        user_full_name: [app.creator_firstname, app.creator_middlename, app.creator_lastname, app.creator_suffix].filter(Boolean).join(' '),
        group_name: app.group_name,
        business_nature: app.business_nature_id ? {
            id: app.business_nature_id,
            name: app.business_nature_name,
            sub_nature: app.sub_business_nature_id ? {
                id: app.sub_business_nature_id,
                name: app.sub_business_nature_name
            } : null
        } : app.business_nature,
        number_of_lives: app.number_of_lives,
        business_address: app.business_address,
        contact_number: app.contact_number,
        fax_number: app.fax_number,
        email: app.email,
        contact_person: [app.contact_person_salutation, app.contact_person_firstname, app.contact_person_mi, app.contact_person_lastname].filter(Boolean).join(' '),
        contact_person_salutation: app.contact_person_salutation,
        contact_person_firstname: app.contact_person_firstname,
        contact_person_mi: app.contact_person_mi,
        contact_person_lastname: app.contact_person_lastname,
        designation: app.designation,
        proposal_addressee: app.proposal_addressee,
        addressee_designation: app.addressee_designation,
        minimum_age: app.minimum_age,
        maximum_age: app.maximum_age,
        status: { id: app.status_id, name: app.status_name },
        group_classification: {
            id: app.group_classification_id,
            name: app.group_classification_name,
            other_value: app.other_group_classification || null
        },
        business_type: {
            id: app.business_type_id,
            name: app.business_type_name,
            other_value: app.other_business_type || null
        },
        group_type: {
            id: app.group_type_id,
            name: app.group_type_name,
            other_value: app.other_group_type || null
        },
        sub_group_types: subGroupTypes,
        payment_mode: { id: app.payment_mode_id, name: app.payment_mode_name },
        coverage_type: {
            id: app.coverage_type_id,
            name: app.coverage_type_name,
            details: app.coverage_type_id === 32 ? levelRanking : 
                    app.coverage_type_id === 34 ? salaryRanking :
                    app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
        },
        channel_type: {
            id: app.channel_type_id,
            name: app.channel_type_name,
            channel_name: app.channel_name || null
        },
        commission_rate: app.commission_rate || null,
        service_fee: app.service_fee || null,
        total_annual_premium: app.total_annual_premium || 0,
        max_amount_18_64: app.max_amount_18_64 || 0,
        max_amount_66_70: app.max_amount_66_70 || 0,
        max_amount_71_75: app.max_amount_71_75 || 0,
        max_amount_76_80: app.max_amount_76_80 || 0,
        payment: paymentTerms,
        type_of_proposal: { id: app.type_of_proposal_id, name: app.type_of_proposal_name },
        prototype_plan: { 
            id: app.prototype_id, 
            name: app.prototype_plan_name && app.prototype_plan_acronym ? `${app.prototype_plan_name} (${app.prototype_plan_acronym})` : app.prototype_plan_name 
        },
        plan: { 
            id: app.plan_id, 
            name: app.plan_name && app.plan_acronym ? `${app.plan_name} (${app.plan_acronym})` : app.plan_name 
        },
        basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
        amount_loans: app.amount_loans_id ? {
            id: app.amount_loans_id,
            name: app.amount_loans_name
        } : null,
        loans_amount: app.loans_amount,
        borrower_age_66_70: app.borrower_age_66_70,
        borrower_age_71_75: app.borrower_age_71_75,
        borrower_age_76_80: app.borrower_age_76_80,
        riders: riders,
        level_ranking: levelRanking,
        salary_ranking: salaryRanking,
        uniform_coverage_amount: app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
        coverage_totals: coverage_totals,
        notes: app.notes,
        created_at: app.created_at,
        updated_at: app.updated_at
    };
};

// Create Application
export const createApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        let dataToSave = { ...req.body };

        // Set status to Pending (ID: 1) since validateFinancialApplication middleware passed
        const STATUS_PENDING = 1;
        dataToSave.status_id = STATUS_PENDING;

        dataToSave = cleanProposalFields(dataToSave);
        const cleanedData = await cleanupOtherFields(dataToSave);
        const channelData = handleChannelType(cleanedData, req.user);
        const processedData = preprocessRiders(channelData);
        processedData.ip_address = normalizeIp(req.ip);

        // Sanitize notes if they exist
        if (processedData.notes) {
            processedData.notes = sanitizeHtml(processedData.notes, sanitizeOptions);
        }

        // Handle Excel file if provided (Required for Salary Ranking via Validator)
        const excelFile = req.files?.excel_file; // Assuming req.files is populated by formidable
        if (excelFile) {
            const tempFilePath = excelFile.filepath;
            const originalFilename = excelFile.originalFilename;
            
            // Define the target directory (e.g., 'uploads' in your project root)
            // This assumes your 'uploads' folder is one level up from the 'controllers' folder
            const uploadDir = path.join(__dirname, '..', 'uploads'); 
            
            // Ensure the upload directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Create a new file path for the permanent storage
            const uniqueFilename = `${Date.now()}-${originalFilename}`;
            const newFilePath = path.join(uploadDir, uniqueFilename);

            // Move the file from the temporary location to the permanent location
            await fs.promises.rename(tempFilePath, newFilePath);
            console.log(`File saved permanently to: ${newFilePath}`);
            
            // Store the path in the data object so the Model can save it (if column exists)
            processedData.excel_file_path = newFilePath; 
        }

        const newRecord = await Model.createApplication(processedData, userId);

        if (!newRecord || !newRecord.application_id) {
            return error(res, 'Failed to create the application.', 500);
        }

        // Fetch the raw application data
        const app = await Model.getApplicationById(newRecord.application_id);
        
        // Format it to match the standard response structure
        const response = await buildApplicationResponse(app);

        return success(res, response, 'Application submitted successfully', 201);
    } catch (err) {
        await auditLog(req, {
            action: AuditActions.CREATE_APPLICATION,
            entity: 'FinancialApplication',
            status: AuditStatus.ERROR,
            metadata: { error: err.message }
        });
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Save Application as Draft
export const saveDraft = async (req, res) => {
    try {
        const userId = req.user.user_id;
        let dataToSave = { ...req.body };
        const agentCodeFromBody = req.body.agent_code;
        const applicationId = dataToSave.application_id;

        // Set status to Draft. 
        const STATUS_DRAFT = 4;
        dataToSave.status_id = STATUS_DRAFT;

        dataToSave = cleanProposalFields(dataToSave);
        const cleanedData = await cleanupOtherFields(dataToSave);
        const channelData = handleChannelType(cleanedData, req.user);
        const processedData = preprocessRiders(channelData);
        processedData.ip_address = normalizeIp(req.ip);

        if (processedData.notes) {
            // Sanitize notes if they exist
            processedData.notes = sanitizeHtml(processedData.notes, sanitizeOptions);
        }

        let app;
        if (applicationId) {
            // If an ID exists, we update the existing draft (Auto-save mode)
            const existingDraft = await Model.getApplicationById(applicationId);
            if (!existingDraft) return error(res, 'Draft not found', 404);
            
            const loggedInId = Number(userId);
            const creatorId = Number(existingDraft.user_id);
            let isAuthorized = false;

            if (loggedInId === creatorId) {
                isAuthorized = true;
            } else if (agentCodeFromBody) {
                const creatorUser = await User.getUserById(existingDraft.user_id);
                if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                return error(res, 'You are not authorized to update this draft.', 403);
            }

            const { agent_code, ...finalData } = processedData;
            await Model.updateApplication(applicationId, finalData, userId);
            app = await Model.getApplicationById(applicationId);
        } else {
            // If no ID exists, create a new draft entry
            const newRecord = await Model.createApplication(processedData, userId);
            app = await Model.getApplicationById(newRecord.application_id);
        }
        
        const response = await buildApplicationResponse(app);
        return success(res, response, 'Application saved as draft successfully', applicationId ? 200 : 201);
    } catch (err) {
        console.error('Draft Save Error:', err);
        return error(res, err.message);
    }
};

// Get List of Industries (Business Nature)
export const getIndustries = async (req, res) => {
    try {
        const list = await Model.getIndustries();
        return success(res, list, 'Industries fetched successfully.');
    } catch (err) {
        console.error('Get Industries Error:', err);
        return error(res, err.message);
    }
};

// Helper to generate HTML for a proposal (Internal use only)
const generateProposalHtml = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) throw new Error("Application not found.");

    const ratesRows = await Model.getApplicationRates(id);
    let user = appData.user_id ? await User.getUserById(appData.user_id) : null;
    if (!user) {
        user = { firstname: 'Phillife', lastname: 'Representative', departmentName: 'Head Office', locationName: 'Main Office' };
    }

    // Load logo and convert to base64 for PDF embedding
    let logoDataUri = null;
    try {
        const logoPath = path.join(process.cwd(), 'img', 'phillife-logo-hd.jpg');
        if (fs.existsSync(logoPath)) {
            const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
            logoDataUri = `data:image/jpeg;base64,${logoBase64}`;
        }
    } catch (logoErr) {
        console.error("Logo loading error:", logoErr);
    }

    // Load center photo and convert to base64 for PDF embedding
    let centerPhotoUri = null;
    try {
        const photoPath = path.join(process.cwd(), 'img', 'cover.png');
        if (fs.existsSync(photoPath)) {
            const photoBase64 = fs.readFileSync(photoPath, { encoding: 'base64' });
            centerPhotoUri = `data:image/jpeg;base64,${photoBase64}`;
        }
    } catch (photoErr) {
        console.error("Center photo loading error:", photoErr);
    }

    // Load Left Logo (Up.png) and convert to base64 for PDF embedding
    let leftLogoUri = null;
    try {
        const leftLogoPath = path.join(process.cwd(), 'img', 'Up.png');
        if (fs.existsSync(leftLogoPath)) {
            const leftLogoBase64 = fs.readFileSync(leftLogoPath, { encoding: 'base64' });
            leftLogoUri = `data:image/png;base64,${leftLogoBase64}`;
        }
    } catch (leftLogoErr) {
        console.error("Left logo loading error:", leftLogoErr);
    }

    // Load Footer Image (footer.png)
    let footerPhotoUri = null;
    try {
        const footerPath = path.join(process.cwd(), 'img', 'footer.png');
        if (fs.existsSync(footerPath)) {
            const footerBase64 = fs.readFileSync(footerPath, { encoding: 'base64' });
            footerPhotoUri = `data:image/png;base64,${footerBase64}`;
        }
    } catch (footerErr) {
        console.error("Footer photo loading error:", footerErr);
    }

    const application = {
        ...appData,
        status: { name: appData.status_name || 'Pending' },
        basic_plan: { name: appData.basic_plan_name || appData.prototype_plan_name || 'N/A' },
        payment_mode: { name: appData.payment_mode_name || 'N/A' },
        group_name: appData.group_name,
        proposal_addressee: appData.proposal_addressee,
        addressee_designation: appData.addressee_designation,
        business_address: appData.business_address,
        minimum_age: appData.minimum_age,
        maximum_age: appData.maximum_age,
    };

    const details = {
        totalAnnualPremium: appData.total_annual_premium || 0, 
        maxAmount18_64: appData.max_amount_18_64 || 0,
        maxAmount66_70: appData.max_amount_66_70 || 0,
        maxAmount71_75: appData.max_amount_71_75 || 0,
        maxAmount76_80: appData.max_amount_76_80 || 0,
        contactLocal: '123',
        rates18_64: formatDbRatesForTemplate(ratesRows, '18_64') || { 6: 'n/a', 12: 'n/a', 18: 'n/a', 24: 'n/a', 30: 'n/a', 36: 'n/a' },
        rates66_70: formatDbRatesForTemplate(ratesRows, '66_70') || { 6: 'n/a', 12: 'n/a', 18: 'n/a', 24: 'n/a', 30: 'n/a', 36: 'n/a' },
        rates71_75: formatDbRatesForTemplate(ratesRows, '71_75') || { 6: 'n/a', 12: 'n/a', 18: 'n/a', 24: 'n/a', 30: 'n/a', 36: 'n/a' },
        rates76_80: formatDbRatesForTemplate(ratesRows, '76_80') || { 76: 'n/a', 77: 'n/a', 78: 'n/a', 79: 'n/a', 80: 'n/a' },
        // ...maxAmountsMap, // Merges values like maxAmount18_64 into details
        nelAmount: 500000,
        nelAge: 65,
        nmlAmount: 1000000,
        nmlAge: 60,
        participationPercentage: 100,
        logoDataUri,
        centerPhotoUri,
        leftLogoUri,
        footerPhotoUri
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

// Get Template By ID (View HTML)
export const getTemplateById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const htmlContent = await generateProposalHtml(id);
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (err) {
        console.error("Proposal Generation Error:", err);
        return error(res, err.message, 500);
    }
};

// Helper for unified PDF generation logic to ensure consistent pagination and layout
const generatePDFBuffer = async (htmlContent) => {
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

            headerTemplate: `<div></div>`,

            footerTemplate: `
                <div style="
                    width: 100%;
                    font-size: 15px;
                    color: white;
                    padding: 0 30px;
                    text-align: right;
                ">
                    Page <span class="pageNumber"></span>
                </div>
            `,

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

// Download Template as PDF
export const downloadTemplatePDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const htmlContent = await generateProposalHtml(id);
        const pdfBuffer = await generatePDFBuffer(htmlContent);

        // Using res.writeHead to set multiple headers clearly
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Proposal_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("PDF Download Error:", err);
        return error(res, err.message, 500);
    }
};

// View Template as PDF (inline in browser)
export const viewTemplatePDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const htmlContent = await generateProposalHtml(id);
        const pdfBuffer = await generatePDFBuffer(htmlContent);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename=Proposal_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("PDF View Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Prototype Plan View (HTML)
export const getPrototypePlanView = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let filename = '';

        // Map IDs to static HTML files (IDs based on seed order)
        switch (id) {
            case 1: filename = 'prototype_StudentsGroupTermLifeInsurancePlan.js'; break;
            case 2: filename = 'prototype_StudentsGroupPersonalAccidentPlan.js'; break;
            case 3: filename = 'prototype_GroupAssociationsPlan.js'; break;
            case 4: filename = 'prototype_SecurityGuardsProtectionPlan.js'; break;
            case 5: filename = 'prototype_GroupCreditLifePrototypePlanInitialLoan.js'; break;
            case 6: filename = 'prototype_GroupCreditLifeInsuranceOutstandingLoanBalance.js'; break;
            case 7: filename = 'prototype_HotelEmployeesGroupTermLifeInsurancePlan.js'; break;
            case 8: filename = 'prototype_PlanforSmallGroups.js'; break;
            case 9: filename = 'prototype_BarangayProtectPlan.js'; break;
            default: return error(res, 'Prototype plan view not found.', 404);
        }

        const filePath = path.join(__dirname, '../templates', filename);
        if (!fs.existsSync(filePath)) {
            console.error(`[getPrototypePlanView] File not found at: ${filePath}`);
            return error(res, 'Template file not found on server.', 404);
        }

        const html = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        return error(res, err.message);
    }
};

// Get List of Prototype Plan Definitions (Dropdown List)
export const getPrototypePlans = async (req, res) => {
    try {
        const list = await Model.getPrototypePlans();
        return success(res, list, 'Prototype plans fetched successfully.');
    } catch (err) {
        return error(res, err.message);
    }
};

// Get List of Prototypes
export const getPrototypes = async (req, res) => {
    try {
        const prototypes = await Model.getPrototypes();

        if (prototypes.length === 0) {
            return success(res, [], 'No prototypes found.');
        }

        // --- Bulk fetch related data ---
        const appIds = prototypes.map(app => app.application_id);

        const allRiders = await Model.getBulkApplicationRiders(appIds);
        const ridersByAppId = allRiders.reduce((acc, rider) => {
            (acc[rider.application_id] = acc[rider.application_id] || []).push(rider);
            return acc;
        }, {});
        
        const allSubGroups = await Model.getBulkApplicationSubGroups(appIds);
        const subGroupsByAppId = allSubGroups.reduce((acc, sg) => {
            (acc[sg.application_id] = acc[sg.application_id] || []).push({ id: sg.id, name: sg.name });
            return acc;
        }, {});

        const allPayments = await Model.getBulkApplicationPaymentTerms(appIds);
        const paymentsByAppId = allPayments.reduce((acc, p) => {
            (acc[p.application_id] = acc[p.application_id] || []).push({
                payment_term: { id: p.payment_term_id, name: p.payment_term_name },
                sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name }
            });
            return acc;
        }, {});

        const allRankings = await Model.getBulkCoverageRankings(appIds);
        const rankingsByAppId = allRankings.reduce((acc, r) => {
            (acc[r.application_id] = acc[r.application_id] || []).push(r);
            return acc;
        }, {});

        const allRankingRiders = await Model.getBulkCoverageRankingRiders(appIds);
        const rankingRidersByAppId = allRankingRiders.reduce((acc, rr) => {
            (acc[rr.application_id] = acc[rr.application_id] || []).push(rr);
            return acc;
        }, {});

        // --- Map the bulk-fetched data back to each application ---
        const formattedPrototypes = prototypes.map(app => {
            const rankings = rankingsByAppId[app.application_id] || [];
            const appRiders = ridersByAppId[app.application_id] || [];
            const appRankingRiders = rankingRidersByAppId[app.application_id] || [];

            // Map ranking-specific riders back to the riders array
            if ((app.coverage_type_id === 32 || app.coverage_type_id === 34) && appRankingRiders.length > 0) {
                appRiders.forEach(mainRider => {
                    const riderValues = appRankingRiders
                        .filter(rr => rr.rider_id === mainRider.rider_id)
                        .map(rr => ({ designation: rr.designation, amount: rr.rider_amount, unit: rr.rider_unit }));
                    if (riderValues.length > 0) mainRider.values = riderValues;
                });
            }

            let levelRanking = null;
            let salaryRanking = null;
            if (app.coverage_type_id === 32) { 
                levelRanking = rankings.map(({ salary_multiplier, uniform_coverage_amount, application_id, ...rest }) => rest);
            } else if (app.coverage_type_id === 34) { 
                salaryRanking = rankings.map(({ uniform_coverage_amount, application_id, ...rest }) => rest);
            }

            let coverage_totals = [];
            if (app.coverage_type_id !== 34) {
                coverage_totals = rankings.map(r => ({
                    designation: r.designation,
                    total_coverage_amount: r.total_coverage_amount
                }));
            }

            return {
                application_id: app.application_id,
                user_id: app.user_id,
                user_full_name: [app.creator_firstname, app.creator_middlename, app.creator_lastname, app.creator_suffix].filter(Boolean).join(' '),
                group_name: app.group_name,
                number_of_lives: app.number_of_lives,
                contact_person: [app.contact_person_salutation, app.contact_person_firstname, app.contact_person_mi, app.contact_person_lastname].filter(Boolean).join(' '),
                contact_person_salutation: app.contact_person_salutation,
                contact_person_firstname: app.contact_person_firstname,
                contact_person_mi: app.contact_person_mi,
                contact_person_lastname: app.contact_person_lastname,
                status: { id: app.status_id, name: app.status_name },
                group_classification: { 
                    id: app.group_classification_id, 
                    name: app.group_classification_name,
                    other_value: app.other_group_classification
                },
                business_type: {
                    id: app.business_type_id,
                    name: app.business_type_name,
                    other_value: app.other_business_type
                },
                group_type: { 
                    id: app.group_type_id, 
                    name: app.group_type_name,
                    other_value: app.other_group_type
                },
                sub_group_types: subGroupsByAppId[app.application_id] || [],
                payment: paymentsByAppId[app.application_id] || [],
                coverage_type: {
                    id: app.coverage_type_id,
                    name: app.coverage_type_name,
                    details: app.coverage_type_id === 32 ? levelRanking : 
                            app.coverage_type_id === 34 ? salaryRanking :
                            app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
                },
                channel_type: {
                    id: app.channel_type_id,
                    name: app.channel_type_name,
                    channel_name: app.channel_name || null
                },
                commission_rate: app.commission_rate || null,
                service_fee: app.service_fee || null,
                level_ranking: levelRanking,
                salary_ranking: salaryRanking,
                uniform_coverage_amount: app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
                coverage_totals: coverage_totals,
                amount_loans: app.amount_loans_id ? { id: app.amount_loans_id, name: app.amount_loans_name } : null,
                loans_amount: app.loans_amount,
                borrower_age_66_70: app.borrower_age_66_70,
                borrower_age_71_75: app.borrower_age_71_75,
                borrower_age_76_80: app.borrower_age_76_80,
                type_of_proposal: {
                    id: app.type_of_proposal_id,
                    name: app.type_of_proposal_name
                },
                prototype_plan: { 
                    id: app.prototype_id, 
                    name: app.prototype_plan_name && app.prototype_plan_acronym ? `${app.prototype_plan_name} (${app.prototype_plan_acronym})` : app.prototype_plan_name 
                },
                plan: { 
                    id: app.plan_id, 
                    name: app.plan_name && app.plan_acronym ? `${app.plan_name} (${app.plan_acronym})` : app.plan_name 
                },
                basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
                riders: appRiders,
                notes: app.notes,
                created_at: app.created_at,
                updated_at: app.updated_at,
            };
        });

        return success(res, formattedPrototypes, 'Prototypes fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get All Applications
export const getAllApplications = async (req, res) => {
    try {
        const rawApplications = await Model.getAllApplications();
        if (rawApplications.length === 0) {
            return success(res, [], 'Applications fetched successfully.');
        }

        // --- Bulk fetch related data ---
        const appIds = rawApplications.map(app => app.application_id);

        const allRiders = await Model.getBulkApplicationRiders(appIds);
        const ridersByAppId = allRiders.reduce((acc, rider) => {
            (acc[rider.application_id] = acc[rider.application_id] || []).push(rider);
            return acc;
        }, {});
        
        const allSubGroups = await Model.getBulkApplicationSubGroups(appIds);
        const subGroupsByAppId = allSubGroups.reduce((acc, sg) => {
            (acc[sg.application_id] = acc[sg.application_id] || []).push({ id: sg.id, name: sg.name });
            return acc;
        }, {});

        const allPayments = await Model.getBulkApplicationPaymentTerms(appIds);
        const paymentsByAppId = allPayments.reduce((acc, p) => {
            (acc[p.application_id] = acc[p.application_id] || []).push({
                payment_term: { id: p.payment_term_id, name: p.payment_term_name },
                sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name }
            });
            return acc;
        }, {});

        const allRankings = await Model.getBulkCoverageRankings(appIds);
        const rankingsByAppId = allRankings.reduce((acc, r) => {
            (acc[r.application_id] = acc[r.application_id] || []).push(r);
            return acc;
        }, {});

        const allRankingRiders = await Model.getBulkCoverageRankingRiders(appIds);
        const rankingRidersByAppId = allRankingRiders.reduce((acc, rr) => {
            (acc[rr.application_id] = acc[rr.application_id] || []).push(rr);
            return acc;
        }, {});

        // --- Map the bulk-fetched data back to each application ---
        const formattedApplications = rawApplications.map(app => {
            const rankings = rankingsByAppId[app.application_id] || [];
            const appRiders = ridersByAppId[app.application_id] || [];
            const appRankingRiders = rankingRidersByAppId[app.application_id] || [];

            // Map ranking-specific riders back to the riders array
            if ((app.coverage_type_id === 32 || app.coverage_type_id === 34) && appRankingRiders.length > 0) {
                appRiders.forEach(mainRider => {
                    const riderValues = appRankingRiders
                        .filter(rr => rr.rider_id === mainRider.rider_id)
                        .map(rr => ({ designation: rr.designation, amount: rr.rider_amount, unit: rr.rider_unit }));
                    if (riderValues.length > 0) mainRider.values = riderValues;
                });
            }

            let levelRanking = null;
            let salaryRanking = null;
            if (app.coverage_type_id === 32) { 
                levelRanking = rankings.map(({ salary_multiplier, uniform_coverage_amount, application_id, ...rest }) => rest);
            } else if (app.coverage_type_id === 34) { 
                salaryRanking = rankings.map(({ uniform_coverage_amount, application_id, ...rest }) => rest);
            }

            let coverage_totals = [];
            if (app.coverage_type_id !== 34) {
                coverage_totals = rankings.map(r => ({
                    designation: r.designation,
                    total_coverage_amount: r.total_coverage_amount
                }));
            }

            return {
                application_id: app.application_id,
                user_id: app.user_id,
                user_full_name: [app.creator_firstname, app.creator_middlename, app.creator_lastname, app.creator_suffix].filter(Boolean).join(' '),
                group_name: app.group_name,
                business_nature: app.business_nature_id ? {
                    id: app.business_nature_id,
                    name: app.business_nature_name,
                    sub_nature: app.sub_business_nature_id ? {
                        id: app.sub_business_nature_id,
                        name: app.sub_business_nature_name
                    } : null
                } : app.business_nature,
                number_of_lives: app.number_of_lives,
                business_address: app.business_address,
                contact_number: app.contact_number,
                fax_number: app.fax_number,
                email: app.email,
                contact_person: [app.contact_person_salutation, app.contact_person_firstname, app.contact_person_mi, app.contact_person_lastname].filter(Boolean).join(' '),
                contact_person_salutation: app.contact_person_salutation,
                contact_person_firstname: app.contact_person_firstname,
                contact_person_mi: app.contact_person_mi,
                contact_person_lastname: app.contact_person_lastname,
                designation: app.designation,
                proposal_addressee: app.proposal_addressee,
                addressee_designation: app.addressee_designation,
                minimum_age: app.minimum_age,
                maximum_age: app.maximum_age,
                status: { id: app.status_id, name: app.status_name },
                group_classification: { 
                    id: app.group_classification_id, 
                    name: app.group_classification_name,
                    other_value: app.other_group_classification
                },
                business_type: {
                    id: app.business_type_id,
                    name: app.business_type_name,
                    other_value: app.other_business_type
                },
                group_type: { 
                    id: app.group_type_id, 
                    name: app.group_type_name,
                    other_value: app.other_group_type
                },
                sub_group_types: subGroupsByAppId[app.application_id] || [],
                payment_mode: { id: app.payment_mode_id, name: app.payment_mode_name },
                coverage_type: {
                    id: app.coverage_type_id,
                    name: app.coverage_type_name,
                    details: app.coverage_type_id === 32 ? levelRanking : 
                            app.coverage_type_id === 34 ? salaryRanking :
                            app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
                },
                channel_type: {
                    id: app.channel_type_id,
                    name: app.channel_type_name,
                    channel_name: app.channel_name || null
                },
                commission_rate: app.commission_rate || null,
                service_fee: app.service_fee || null,
                payment: paymentsByAppId[app.application_id] || [],
                type_of_proposal: {
                    id: app.type_of_proposal_id,
                    name: app.type_of_proposal_name
                },
                prototype_plan: { 
                    id: app.prototype_id, 
                    name: app.prototype_plan_name && app.prototype_plan_acronym ? `${app.prototype_plan_name} (${app.prototype_plan_acronym})` : app.prototype_plan_name 
                },
                plan: { 
                    id: app.plan_id, 
                    name: app.plan_name && app.plan_acronym ? `${app.plan_name} (${app.plan_acronym})` : app.plan_name 
                },
                basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
                amount_loans: app.amount_loans_id ? { id: app.amount_loans_id, name: app.amount_loans_name } : null,
                loans_amount: app.loans_amount,
                level_ranking: levelRanking,
                salary_ranking: salaryRanking,
                uniform_coverage_amount: app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
                borrower_age_66_70: app.borrower_age_66_70,
                borrower_age_71_75: app.borrower_age_71_75,
                borrower_age_76_80: app.borrower_age_76_80,
                coverage_totals: coverage_totals,
                riders: appRiders,
        excel_file_path: app.excel_file_path || null,
                notes: app.notes,
                created_at: app.created_at,
                updated_at: app.updated_at,
            };
        });

        return success(res, formattedApplications, 'Applications fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Rates for Application
export const saveRates = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // 1. Department Check: Only Actuarial (ID 18) can set or update rates
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input or update rates.', 403);
        }

        const { application_id, ...ratesData } = req.body;

        const existingApplication = await Model.getApplicationById(application_id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }

        // 2. Save Rates to Normalized Table
        await Model.saveApplicationRates(application_id, ratesData);

        // Automatically transition to Approved status (ID: 2) when rates are input
        const STATUS_APPROVED = 2;
        await Model.updateApplication(application_id, { status_id: STATUS_APPROVED }, userId);
        
        // Fetch updated application to return
        const updatedApp = await Model.getApplicationById(application_id);
        return success(res, updatedApp, 'Rates saved successfully.');

    } catch (err) {
        console.error('Save Rates Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Total Annual Premium for Application
export const saveTotalAnnualPremium = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        const { total_annual_premium } = req.body;

        // Department Check: Only Actuarial (ID 18) can input or update total premium
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input the total annual premium.', 403);
        }

        const existingApplication = await Model.getApplicationById(id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }

        // Validation: If total annual premium is already set, POST should fail
        if (req.method === 'POST' && existingApplication.total_annual_premium !== null) {
            return error(res, 'Total annual premium already exists for this application. Please use PUT to update existing data.', 400);
        }

        await Model.updateApplication(id, { total_annual_premium }, userId);

        const updatedApp = await Model.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);
        return success(res, response, 'Total Annual Premium saved successfully.');
    } catch (err) {
        console.error('Save Total Premium Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Max Loan Amounts for Application
// export const saveMaxAmounts = async (req, res) => {
//     try {
//         const userId = req.user.user_id;
//         const id = req.params.id;
//         const { max_amount_18_64, max_amount_66_70, max_amount_71_75, max_amount_76_80 } = req.body;

//         const loggedInUser = await User.getUserById(userId);
//         const DEPT_ACTUARIAL_ID = 18;

//         if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
//             return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input maximum amounts.', 403);
//         }

//         const existingApplication = await Model.getApplicationById(id);
//         if (!existingApplication) {
//             return error(res, 'Application not found', 404);
//         }

//         // Validation: If any max amount is already set, POST should fail
//         const hasExistingMaxAmounts = [
//             existingApplication.max_amount_18_64, existingApplication.max_amount_66_70,
//             existingApplication.max_amount_71_75, existingApplication.max_amount_76_80
//         ].some(val => val !== null);

//         if (req.method === 'POST' && hasExistingMaxAmounts) {
//             return error(res, 'Maximum amounts already exist for this application. Please use PUT to update existing data.', 400);
//         }

//         await Model.updateApplication(id, { max_amount_18_64, max_amount_66_70, max_amount_71_75, max_amount_76_80 }, userId);

//         const updatedApp = await Model.getApplicationById(id);
//         const response = await buildApplicationResponse(updatedApp);
//         return success(res, response, 'Maximum amounts saved successfully.');
//     } catch (err) {
//         console.error('Save Max Amounts Error:', err);
//         return error(res, err.message);
//     }
// };

// Get applications pending actuarial rate input
export const getApplicationsPendingRates = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department can view the rate input queue.', 403);
        }

        const list = await Model.getApplicationsPendingRates();
        return success(res, list, 'Applications pending rates fetched successfully.');
    } catch (err) {
        console.error('Pending Rates Queue Error:', err);
        return error(res, err.message);
    }
};

// Get applications pending total annual premium input
export const getApplicationsPendingTotalPremium = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department can view the total annual premium input queue.', 403);
        }

        const list = await Model.getApplicationsPendingTotalPremium();
        return success(res, list, 'Applications pending total annual premium fetched successfully.');
    } catch (err) {
        console.error('Pending Total Premium Queue Error:', err);
        return error(res, err.message);
    }
};

// Get applications pending max amounts input
// export const getApplicationsPendingMaxAmounts = async (req, res) => {
//     try {
//         const userId = req.user.user_id;
//         const loggedInUser = await User.getUserById(userId);
//         const DEPT_ACTUARIAL_ID = 18;

//         if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
//             return error(res, 'Access Denied: Only users from the Actuarial department can view the maximum amounts input queue.', 403);
//         }

//         const list = await Model.getApplicationsPendingMaxAmounts();
//         return success(res, list, 'Applications pending maximum amounts fetched successfully.');
//     } catch (err) {
//         console.error('Pending Max Amounts Queue Error:', err);
//         return error(res, err.message);
//     }
// };

// Get Application History Logs
export const getApplicationHistory = async (req, res) => {
    try {
        const history = await Model.getApplicationHistory(req.params.id);
        return success(res, history, 'Application history fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get Application by ID
export const getApplicationById = async (req, res) => {
    try {
        const app = await Model.getApplicationById(req.params.id);
        if (!app) return error(res, 'Application not found', 404);

        const response = await buildApplicationResponse(app);

        return success(res, response);
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Update Application
export const updateApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        console.log('=== UPDATE DEBUG ===');
        console.log('Logged in userId:', userId, 'Type:', typeof userId);
        const agentCodeFromBody = req.body.agent_code;
        
        // Get the existing application to check ownership
        const existingApplication = await Model.getApplicationById(req.params.id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }
        
        console.log('Application user_id:', existingApplication.user_id, 'Type:', typeof existingApplication.user_id);

        const loggedInId = Number(userId);
        const creatorId = Number(existingApplication.user_id);
        
        console.log('Comparing:', loggedInId, '===', creatorId);
        
        let isAuthorized = false;
        
        if (loggedInId === creatorId) {
            console.log('User is the creator - authorized');
            isAuthorized = true;
        } else if (agentCodeFromBody) {
            const creatorUser = await User.getUserById(existingApplication.user_id);
            console.log('Creator user agent_code:', creatorUser?.agent_code, 'Provided:', agentCodeFromBody);
            if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                isAuthorized = true;
            }
        }
        
        if (!isAuthorized) {
            return error(res, 'You are not authorized to update this application. Only the original agent can update it.', 403);
        }
        
        const { agent_code, ...updateData } = req.body;
        
        // Automatically transition from Draft to Processing status
        const STATUS_DRAFT = 4;
        const STATUS_PENDING = 1;
        if (Number(existingApplication.status_id) === STATUS_DRAFT) {
            updateData.status_id = STATUS_PENDING;
        }

        // const cleanedData = await cleanupOtherFields(updateData);
        // const processedData = preprocessRiders(cleanedData);

        const cleanedProposal = cleanProposalFields(updateData);
        const cleanedData = await cleanupOtherFields(cleanedProposal);
        const channelData = handleChannelType(cleanedData, req.user);
        const processedData = preprocessRiders(channelData);
        processedData.ip_address = normalizeIp(req.ip);

        // Sanitize notes if they exist
        if (processedData.notes) {
            processedData.notes = sanitizeHtml(processedData.notes, sanitizeOptions);
        }

        // Handle Excel file during update
        const excelFile = req.files?.excel_file; // Assuming req.files is populated by formidable
        if (excelFile) {
            const tempFilePath = excelFile.filepath;
            const originalFilename = excelFile.originalFilename;
            
            // Define the target directory (e.g., 'uploads' in your project root)
            const uploadDir = path.join(__dirname, '..', 'uploads'); 
            
            // Ensure the upload directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            // Create a new file path for the permanent storage
            const uniqueFilename = `${Date.now()}-${originalFilename}`;
            const newFilePath = path.join(uploadDir, uniqueFilename);

            // Move the file from the temporary location to the permanent location
            await fs.promises.rename(tempFilePath, newFilePath);
            console.log(`File saved permanently to: ${newFilePath}`);
            
            processedData.excel_file_path = newFilePath;
        }

        const updated = await Model.updateApplication(req.params.id, processedData, userId);
        const response = await buildApplicationResponse(updated);

        await auditLog(req, {
            userId: userId,
            action: AuditActions.UPDATE_APPLICATION,
            entity: 'FinancialApplication',
            entityId: req.params.id,
            status: AuditStatus.INFO
        });

        return success(res, response, 'Application updated successfully.');
    } catch (err) {
        await auditLog(req, {
            action: AuditActions.UPDATE_APPLICATION,
            entity: 'FinancialApplication',
            entityId: req.params.id,
            status: AuditStatus.ERROR,
            metadata: { error: err.message }
        });
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Delete Application
export const deleteApplication = async (req, res) => {
    try {
        await Model.deleteApplication(req.params.id);
        return success(res, null, 'Application deleted successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};
