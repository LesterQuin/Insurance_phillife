import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import * as Model from '../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../models/actuarial_api/actuarial.model.js';
import * as User from '../models/user/user_model.js';
import { generateGCLIPDFContent } from '../templates/customize/Group_Credit_Life_Insurance_GCLI.js';
import { generateGPAPDFContent } from '../templates/customize/Group_Personal_Accident_Insurance_GPA.js';
import { generateGYRTPDFContent } from '../templates/customize/Group_Term_Life_Insurance_GYRT.js';
import { generateGCIPDFContent } from '../templates/customize/Group_Critical_Illness_Insurance_GCI.js';
import { generateBarangayPDFContent } from '../templates/prototype/prototype_BarangayProtectPlan.js';
import { generateStudentsGTLIPPDFContent } from '../templates/prototype/prototype_StudentsGroupTermLifeInsurancePlan.js';
import { generateStudentsGPAPDFContent } from '../templates/prototype/prototype_StudentsGroupPersonalAccidentPlan.js';
import { generateGroupAssociationsPDFContent } from '../templates/prototype/prototype_GroupAssociationsPlan.js';
import { generateSecurityGuardsPDFContent } from '../templates/prototype/prototype_SecurityGuardsProtectionPlan.js';
import { generateGCLIInitialLoanPDFContent } from '../templates/prototype/prototype_GroupCreditLifePrototypePlanInitialLoan.js';
import { generateGCLIOutstandingLoanBalancePDFContent } from '../templates/prototype/prototype_GroupCreditLifeInsuranceOutstandingLoanBalance.js';
import { generateHotelEmployeesPDFContent } from '../templates/prototype/prototype_HotelEmployeesGroupTermLifeInsurancePlan.js';
import { generateSmallGroupsPDFContent } from '../templates/prototype/prototype_PlanforSmallGroups.js';

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

// Helper to ensure group-specific and requirement-specific directory exists
export const ensureRequirementsDir = (groupName, requirementType = '') => {
    const rootDir = path.resolve('uploads');
    // Sanitize group name for folder path (remove special chars, replace spaces with underscores)
    const sanitizedGroup = groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const appDir = path.join(rootDir, sanitizedGroup, 'requirements', requirementType);
    
    if (!fs.existsSync(appDir)) {
        fs.mkdirSync(appDir, { recursive: true });
    }
    return appDir;
};

// Helper to ensure group-specific and custom folder directory exists (e.g. uploaded_files, comments)
export const ensureCompanyDir = (groupName, folderType = '') => {
    const rootDir = path.resolve('uploads');
    const sanitizedGroup = groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const targetDir = path.join(rootDir, sanitizedGroup, folderType);
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
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

    // Prevent updating status if it is Released (15), Closed (6), or Rejected (17) (unless Super Admin)
    if (Number(app.status_id) === 15 || Number(app.status_id) === 6 || (Number(app.status_id) === 17 && !isSuperAdmin)) return;

    const rates = await ActuarialModel.getApplicationRates(applicationId);
    const hasRates = rates && rates.length > 0;
    const hasPremium = app.total_annual_premium !== null && app.total_annual_premium !== undefined;
    const hasNotes = app.evidence_notes !== null && app.evidence_notes !== '' && app.evidence_notes !== undefined;

    let newStatusId = app.status_id;
    if (hasRates && hasPremium && hasNotes) {
        newStatusId = 14; // Approved
    } else if (hasRates || hasPremium || hasNotes) {
        newStatusId = 13; // Rating
    } else {
        newStatusId = 8; // Pending
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

// Helper to nullify fields based on proposal type
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

    const isTrue = (val) => val === true || val === 'true' || val === 1 || val === '1';

    ['borrower_age_66_70', 'borrower_age_71_75', 'borrower_age_76_80'].forEach(field => {
        if (mutableData[field] !== undefined) mutableData[field] = isTrue(mutableData[field]) ? 1 : 0;
    });

    if (mutableData.borrower_under_min !== undefined) {
        if (!isTrue(mutableData.borrower_under_min)) {
            mutableData.borrower_amount_under_min = null;
        }
    }

    if (mutableData.borrower_under_max !== undefined) {
        if (!isTrue(mutableData.borrower_under_max)) {
            mutableData.borrower_amount_over_max = null;
        }
    }

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
            mutableData.channel_number = user.phoneNumber || null;
            mutableData.channel_email = user.email || null;
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

        const GHIR_IDS = [8];
        const GAMERR_IDS = [9, 14];
        const BMSR_IDS = [11];
        const GDR_IDS = [13];

        if (GHIR_IDS.includes(riderId) && baseAmount !== undefined && (baseAmount < 100 || baseAmount > 300)) {
            throw new Error('Group Hospital Income Rider amount must be between 100 and 300.');
        }
        if (GAMERR_IDS.includes(riderId) && baseAmount !== undefined && baseAmount < 500) {
            throw new Error('Group Accidental Medical Expense Reimbursement Rider amount must be at least 500.');
        }
        if (BMSR_IDS.includes(riderId)) {
            baseAmount = 50000;
        }
        if (GDR_IDS.includes(riderId)) {
            if (baseUnit === 1) baseAmount = 30000;
            if (baseUnit === 2) baseAmount = 60000;
        }

        const isSingular = (rider.values && rider.values.length === 1) || (!rider.values && (baseAmount !== undefined || baseUnit !== undefined));
        
        let processedRider = { ...rider };
        if (designations.length > 0 && isSingular) {
            processedRider.values = designations.map(d => ({ designation: d, amount: baseAmount, unit: baseUnit }));
        }

        if (processedRider.values && Array.isArray(processedRider.values)) {
            processedRider.values = processedRider.values.map(v => {
                const updatedVal = { ...v };
                const valAmount = updatedVal.amount !== undefined ? Number(updatedVal.amount) : undefined;
                const valUnit = updatedVal.unit !== undefined ? Number(updatedVal.unit) : undefined;

                if (GHIR_IDS.includes(riderId) && valAmount !== undefined && (valAmount < 100 || valAmount > 300)) {
                    throw new Error(`Group Hospital Income Rider amount for ${v.designation} must be between 100 and 300.`);
                }
                if (GAMERR_IDS.includes(riderId) && valAmount !== undefined && valAmount < 500) {
                    throw new Error(`Group Accidental Medical Expense Reimbursement Rider amount for ${v.designation} must be at least 500.`);
                }
                if (BMSR_IDS.includes(riderId)) {
                    updatedVal.amount = 50000;
                }
                if (GDR_IDS.includes(riderId)) {
                    if (valUnit === 1) updatedVal.amount = 30000;
                    else if (valUnit === 2) updatedVal.amount = 60000;
                }
                return updatedVal;
            });
        }

        return processedRider;
    });
    return data;
};

// Helper to transform DB rows back to template format
export const formatDbRatesForTemplate = (dbRows, category, planId, app) => {
    const normalizedCategory = category.replace('-', '_');
    const isBaseBracket = (cat) => cat === '18_65' || cat === '18_64';

    if (!dbRows || dbRows.length === 0) return isBaseBracket(normalizedCategory) ? [] : {};

    const filtered = dbRows.filter(row => {
        const rowCat = (row.borrower_category || '').replace('-', '_');
        
        if (isBaseBracket(normalizedCategory) && isBaseBracket(rowCat)) return true;

        return rowCat === normalizedCategory;
    });

    if (filtered.length === 0) return isBaseBracket(normalizedCategory) ? [] : {};

    const formatRateVal = (val) => {
        if (val === null || val === undefined) return '0.000';
        const num = parseFloat(String(val).replace(/,/g, ''));
        return isNaN(num) ? String(val) : num.toFixed(3);
    };

    // Special handling for GPA (3), GYRT (2), or GCI (4): Always restructure into a nested format with basic_rate and riders.
    if ([2, 3, 4].includes(planId)) {
        const result = {
            basic_plan_id: filtered[0]?.basic_plan_id || null,
            basic_plan_name: filtered[0]?.basic_plan_name || null,
            basic_plan_acronym: filtered[0]?.basic_plan_acronym || null
        };

        const groups = {};
        filtered.forEach(row => {
            let key = '';
            if (row.age_band && row.age_band.toUpperCase() !== 'BASIC') {
                key = `age_${row.age_band.replace('-', '_')}`;
            } else if (row.attained_age) {
                key = `age_${row.attained_age}`;
            } else {
                key = 'rates';
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
        });

        for (const ageKey in groups) {
            const rows = groups[ageKey];
            const basicRow = rows.find(r => r.rider_id === null || r.rider_id === 0 || r.rider_id === '0');
            const riders = rows.filter(r => r.rider_id !== null && r.rider_id !== 0 && r.rider_id !== '0');

            result[ageKey] = [{
                basic_rate: formatRateVal(basicRow ? (basicRow.premium_rate ?? basicRow.premium_amount) : '0'),
                riders: riders.map(r => ({
                    rider_id: (r.rider_id !== null && r.rider_id !== undefined && !isNaN(r.rider_id)) ? Number(r.rider_id) : r.rider_id,
                    rider_name: r.rider_name || null,
                    acronym: r.acronym || null,
                    rider_rate: formatRateVal(r.premium_rate ?? r.premium_amount)
                }))
            }];
        }
        return result;
    }

    // Special handling for GCLI (1): Restructure into a nested format with basic_plan array for months.
    if (planId === 1) {
        const result = {
            basic_plan_id: filtered[0]?.basic_plan_id || null,
            basic_plan_name: filtered[0]?.basic_plan_name || null,
            basic_plan_acronym: filtered[0]?.basic_plan_acronym || null
        };

        const groups = {};
        if (isBaseBracket(normalizedCategory)) {
            // GCLI base bracket: Group by month
            filtered.forEach(row => {
                const month = row.term_months || 1;
                const key = `month_${month}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(row);
            });

            const months = [...new Set(filtered.map(r => r.term_months || 1))].sort((a, b) => a - b);
            result.basic_plan = months.map(m => {
                const monthRows = groups[`month_${m}`];
                const basicRow = monthRows.find(r => r.rider_id === null || r.rider_id === 0 || r.rider_id === '0');
                const riders = monthRows.filter(r => r.rider_id !== null && r.rider_id !== 0 && r.rider_id !== '0');

                return {
                    term_of_months: m,
                    basic_rate: formatRateVal(basicRow ? (basicRow.premium_rate ?? basicRow.premium_amount) : '0'),
                    riders: riders.map(r => ({
                        rider_id: (r.rider_id !== null && r.rider_id !== undefined && !isNaN(r.rider_id)) ? Number(r.rider_id) : r.rider_id,
                        rider_name: r.rider_name || null,
                        acronym: r.acronym || null,
                        rider_rate: formatRateVal(r.premium_rate ?? r.premium_amount)
                    }))
                };
            });
            return result;
        } else {
            // For senior brackets in GCLI, group by age and month
            const ageGroups = {};
            filtered.forEach(row => {
                const ageKey = row.attained_age ? `age_${row.attained_age}` : 'rates';
                if (!ageGroups[ageKey]) ageGroups[ageKey] = {};
                
                const month = row.term_months || 1;
                if (!ageGroups[ageKey][month]) ageGroups[ageKey][month] = [];
                ageGroups[ageKey][month].push(row);
            });

            for (const ageKey in ageGroups) {
                const monthMap = ageGroups[ageKey];
                const sortedMonths = Object.keys(monthMap).map(Number).sort((a, b) => a - b);
                
                result[ageKey] = sortedMonths.map(m => {
                    const monthRows = monthMap[m];
                    const basicRow = monthRows.find(r => r.rider_id === null || r.rider_id === 0 || r.rider_id === '0');
                    const riders = monthRows.filter(r => r.rider_id !== null && r.rider_id !== 0 && r.rider_id !== '0');

                    return {
                        term_of_months: m,
                        basic_rate: formatRateVal(basicRow ? (basicRow.premium_rate ?? basicRow.premium_amount) : '0'),
                        riders: riders.map(r => ({
                            rider_id: (r.rider_id !== null && r.rider_id !== undefined && !isNaN(r.rider_id)) ? Number(r.rider_id) : r.rider_id,
                            rider_name: r.rider_name || null,
                            acronym: r.acronym || null,
                            rider_rate: formatRateVal(r.premium_rate ?? r.premium_amount)
                        }))
                    };
                });
            }
            return result;
        }
    }

    const transformRow = (row) => {
        const rawRate = row.premium_rate !== null && row.premium_rate !== undefined 
            ? row.premium_rate 
            : row.premium_amount;
        
        let displayRate = '0.000';
        if (rawRate !== null && rawRate !== undefined) {
            const num = parseFloat(String(rawRate).replace(/,/g, ''));
            displayRate = isNaN(num) ? String(rawRate) : num.toFixed(3);
        }

        return {
            id: row.id,
            // Standardize rider_id: return numeric ID for riders, null for the basic plan (ID 0)
            rider_id: (row.rider_id !== null && row.rider_id !== undefined && row.rider_id !== 0 && row.rider_id !== '0')
                ? (!isNaN(row.rider_id) ? Number(row.rider_id) : String(row.rider_id))
                : null,
            rider_name: row.rider_name || null,
            acronym: row.acronym || null,
            basic_plan_id: row.basic_plan_id || null,
            basic_plan_name: row.basic_plan_name || null,
            basic_plan_acronym: row.basic_plan_acronym || null,
            term_months: (row.term_months !== null && row.term_months !== undefined && Number(row.term_months) !== 0) 
                ? Number(row.term_months) 
                : (planId === 1 && row.rider_id && row.rider_id !== '0' ? 1 : null),
            attained_age: row.attained_age || null,
            age_band: row.age_band || null,
            rate: displayRate
        };
    };

    if (isBaseBracket(normalizedCategory)) {
        return filtered.map(transformRow);
    } else {
        // For senior brackets, return a flat array of all rates
        return filtered.map(transformRow);
    }
};

// Helper to build structured response for a single application
export const buildApplicationResponse = async (app, loggedInUserId = null) => {
    const subGroupTypes = await Model.getApplicationSubGroups(app.application_id);
    const paymentTermsRaw = await Model.getApplicationPaymentTerms(app.application_id);
    const riders = await Model.getApplicationRiders(app.application_id);
    const rankings = await Model.getCoverageRankingsByAppId(app.application_id);
    const rankingRiders = await Model.getCoverageRankingRiders(app.application_id);
    const ratesRows = await ActuarialModel.getApplicationRates(app.application_id);
    const affiliates = await Model.getApplicationAffiliates(app.application_id);
    const planId = Number(app.plan_id);
    const STATUS_BOOKED = 7;
    const STATUS_CLOSED = 6;
    const STATUS_DRAFT = 11;

    // Countdown Logic: Prioritizes explicit expiry_date, otherwise defaults to 8 days from creation
    const createdAt = new Date(app.created_at);
    const expiryDate = app.expiry_date ? new Date(app.expiry_date) : new Date(createdAt);
    // if (!app.expiry_date) expiryDate.setDate(expiryDate.getDate() + 30); // Production: default to 30 days
    if (!app.expiry_date) expiryDate.setDate(expiryDate.getDate() + 8); // Testing: default to 8 days
    
    const now = new Date();
    // Ensure 'now' isn't before 'createdAt' to avoid 31-day race conditions during creation
    const effectiveNow = new Date(Math.max(now.getTime(), createdAt.getTime()));
    
    const currentStatus = Number(app.status_id);
    const isExpiredByTime = currentStatus !== STATUS_DRAFT && effectiveNow > expiryDate;
    const isFinalized = currentStatus === STATUS_BOOKED || currentStatus === STATUS_CLOSED || isExpiredByTime;
    
    let proposalDaysRemaining = 0;
    if (currentStatus === STATUS_BOOKED || currentStatus === STATUS_CLOSED) {
        proposalDaysRemaining = 0;
    } else if (currentStatus === STATUS_DRAFT) {
        const defaultExpiry = new Date(createdAt);
        // if (true) defaultExpiry.setDate(defaultExpiry.getDate() + 30); // Production: default to 30 days
        defaultExpiry.setDate(defaultExpiry.getDate() + 8); // Testing: default to 8 days
        proposalDaysRemaining = Math.max(0, Math.ceil((defaultExpiry.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
        proposalDaysRemaining = Math.max(0, Math.ceil((expiryDate.getTime() - effectiveNow.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const policyDaysBeforeRenew = (currentStatus === STATUS_BOOKED)
        ? Math.max(0, Math.ceil((expiryDate.getTime() - effectiveNow.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

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
        channel_type_id, channel_type_name, channel_name, channel_number, channel_email,
        business_nature_name, sub_business_nature_name,
        proposal_status_id, proposal_status_name,
        type_of_proposal_id, type_of_proposal_name,
        prototype_id, prototype_plan_name, prototype_plan_acronym,
        plan_id, plan_name, plan_acronym,
        basic_plan_id, basic_plan_name, basic_plan_acronym,
        amount_loans_id, amount_loans_name,
        creator_firstname, creator_middlename, creator_lastname, creator_suffix,
        contact_person_salutation, contact_person_firstname, contact_person_mi, contact_person_lastname,
        loan_maturity_month_name,
        payment_term_id, sub_payment_term_id,
        excel_file_path,
        actuarial_files,
        department_files,
        signed_proposal_path, group_app_path, dti_path, sec_reg_path,
        articles_of_inc_path, by_laws_path, business_permit_path,
        masterlist_file_path, authorized_id_path, booking_date,
        ...cleanedApp
    } = app;
    const extension_request_status_id = app.extension_request_status_id;
    const extension_request_status_name = app.extension_request_status_name;

    const creatorName = [creator_firstname, creator_middlename, creator_lastname, creator_suffix].filter(Boolean).join(' ') || 'System';

    return {
        ...cleanedApp,
        borrower_under_min: app.borrower_amount_under_min !== null && app.borrower_amount_under_min !== undefined,
        borrower_under_max: app.borrower_amount_over_max !== null && app.borrower_amount_over_max !== undefined,
        borrower_age_66_70: app.borrower_age_66_70 === true || app.borrower_age_66_70 === 1,
        borrower_age_71_75: app.borrower_age_71_75 === true || app.borrower_age_71_75 === 1,
        borrower_age_76_80: app.borrower_age_76_80 === true || app.borrower_age_76_80 === 1,
        user_full_name: creatorName,
        contact_person: {
            full_name: [contact_person_salutation, contact_person_firstname, contact_person_mi, contact_person_lastname].filter(Boolean).join(' '),
            salutation: contact_person_salutation,
            firstname: contact_person_firstname,
            mi: contact_person_mi,
            lastname: contact_person_lastname
        },
        excel_file_path: (() => {
            if (!excel_file_path) return null;
            try {
                const parsed = JSON.parse(excel_file_path);
                if (Array.isArray(parsed)) {
                    return parsed.map(p => path.basename(p));
                }
            } catch (e) {
                // Ignore error, fallback to single path string
            }
            return path.basename(excel_file_path);
        })(),
        actuarial_files: (department_files || [])
            .filter(f => f.department === 'actuarial')
            .map(f => ({
                file_name: f.file_name,
                file_path: path.basename(f.file_path),
                department: f.uploader_department || f.department,
                uploaded_at: f.created_at,
                uploaded_by: f.firstname && f.lastname ? `${f.firstname} ${f.lastname}` : creatorName
            })),
        installation_requirements: {
            signed_proposal: signed_proposal_path ? path.basename(signed_proposal_path) : null,
            group_app: group_app_path ? path.basename(group_app_path) : null,
            dti: dti_path ? path.basename(dti_path) : null,
            sec_reg: sec_reg_path ? path.basename(sec_reg_path) : null,
            articles_of_inc: articles_of_inc_path ? path.basename(articles_of_inc_path) : null,
            by_laws: by_laws_path ? path.basename(by_laws_path) : null,
            business_permit: business_permit_path ? path.basename(business_permit_path) : null,
            masterlist: masterlist_file_path ? path.basename(masterlist_file_path) : null,
            auth_id: authorized_id_path ? path.basename(authorized_id_path) : null,
            booking_date: booking_date || null
        },
        supporting_details: (department_files || [])
            // .filter(f => !loggedInUserId || Number(f.uploaded_by_user_id) === Number(loggedInUserId))
            .map(f => ({
                file_name: f.file_name,
                file_path: path.basename(f.file_path),
                department: f.uploader_department || f.department,
                uploaded_at: f.created_at,
                uploaded_by: f.firstname && f.lastname ? `${f.firstname} ${f.lastname}` : creatorName
            })),
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
            channel_name: channel_name || null,
            channel_number: channel_number || null,
            channel_email: channel_email || null
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
        affiliates: affiliates,
        payment: paymentTermsRaw.map(p => ({ 
            payment_term: { id: p.payment_term_id, name: p.payment_term_name }, 
            sub_payment_term: { id: p.sub_payment_term_id, name: p.sub_payment_term_name || p.sub_payment_term_id?.toString() } 
        })),
        proposal_type: {
            id: proposal_status_id,
            name: proposal_status_name
        },
        type_of_proposal: {
            id: type_of_proposal_id,
            name: type_of_proposal_name
        },
        prototype_plan: { 
            id: prototype_id, 
            name: prototype_plan_name && prototype_plan_acronym ? `${prototype_plan_name} (${prototype_plan_acronym})` : prototype_plan_name,
            acronym: prototype_plan_acronym || null
        },
        plan: { 
            id: plan_id, 
            name: plan_name && plan_acronym ? `${plan_name} (${plan_acronym})` : plan_name,
            acronym: plan_acronym || null
        },
        basic_plan: { 
            id: basic_plan_id, 
            name: basic_plan_name && basic_plan_acronym ? `${basic_plan_name} (${basic_plan_acronym})` : basic_plan_name,
            acronym: basic_plan_acronym || null
        },
        amount_loans: amount_loans_id ? { id: amount_loans_id, name: amount_loans_name } : null,
        riders,
        rates: (() => {
            const minAge = app.minimum_age || 18;
            const maxAge = app.maximum_age || 65;
            const isCustomAge = minAge !== 18 || maxAge !== 65;
            const numLives = Number(app.number_of_lives);
            const isScale2 = numLives > 30;

            const ratesObj = {};
            if (planId !== 1 && isScale2 && isCustomAge) {
                ratesObj[`${minAge}-${maxAge}`] = formatDbRatesForTemplate(ratesRows, `${minAge}_${maxAge}`, planId, app);
                if (maxAge < 65) {
                    ratesObj[`${maxAge + 1}-65`] = formatDbRatesForTemplate(ratesRows, `${maxAge + 1}_65`, planId, app);
                }
            } else {
                ratesObj["18-65"] = formatDbRatesForTemplate(ratesRows, '18_65', planId, app);
            }
            ratesObj["66-70"] = formatDbRatesForTemplate(ratesRows, '66_70', planId, app);
            ratesObj["71-75"] = formatDbRatesForTemplate(ratesRows, '71_75', planId, app);
            ratesObj["76-80"] = formatDbRatesForTemplate(ratesRows, '76_80', planId, app);
            return ratesObj;
        })(),
        validity: {
            expiry_date: currentStatus === STATUS_DRAFT ? null : expiryDate,
            proposal_days_remaining: proposalDaysRemaining,
            policy_days_before_renew_remaining: policyDaysBeforeRenew,
            is_expired: (currentStatus === STATUS_CLOSED || isExpiredByTime) && currentStatus !== STATUS_BOOKED,
            countdown_active: !isFinalized && currentStatus !== STATUS_BOOKED && currentStatus !== STATUS_CLOSED && currentStatus !== STATUS_DRAFT,
            extension_requested: !!app.extension_requested,
            extension_status_id: extension_request_status_id || null,
            extension_status_name: extension_request_status_name || (
                extension_request_status_id === 62 ? 'Approved' :
                extension_request_status_id === 63 ? 'Declined' :
                app.extension_requested ? 'Pending' : null
            )
        },
        coverage_totals,
        level_ranking: levelRanking,
        salary_ranking: salaryRanking,
        uniform_coverage_amount: coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
        amendment_request: await (async () => {
            const latest = await Model.getLatestAmendmentRequestByAppId(app.application_id);
            if (!latest) return null;
            return {
                id: latest.id,
                status: latest.status,
                request_notes: latest.request_notes,
                response_notes: latest.response_notes,
                requested_by: latest.requested_by,
                requested_by_name: latest.requested_by_name,
                request_dept_name: latest.request_dept_name,
                responded_by: latest.responded_by,
                responded_by_name: latest.responded_by_name,
                requested_at: latest.requested_at,
                responded_at: latest.responded_at
            };
        })()
    };
};

// Helper to generate HTML for a proposal
export const generateProposalHtml = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) throw new Error("Application not found.");
    const ratesRows = await ActuarialModel.getApplicationRates(id);
    const paymentTerms = await Model.getApplicationPaymentTerms(id);
    const riders = await Model.getApplicationRiders(id);
    const maturity = paymentTerms.length > 0 ? Number(paymentTerms[0].sub_payment_term_id) : 0;
    const planId = Number(appData.plan_id);
    let user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);

    if ((appData.coverage_type_id === 32 || appData.coverage_type_id === 34) && rankingRiders.length > 0) {
        riders.forEach(mainRider => {
            const riderValues = rankingRiders.filter(rr => rr.rider_id === mainRider.rider_id).map(rr => ({ designation: rr.designation, acronym: rr.acronym, amount: rr.rider_amount, unit: rr.rider_unit }));
            if (riderValues.length > 0) mainRider.values = riderValues;
        });
    }

    const levelRanking = appData.coverage_type_id === 32 ? rankings.map(({ salary_multiplier, uniform_coverage_amount, ...rest }) => rest) : null;
    const salaryRanking = appData.coverage_type_id === 34 ? rankings.map(({ uniform_coverage_amount, ...rest }) => rest) : null;

    const application = { 
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
        payment_mode: { name: appData.payment_mode_name || 'N/A' }
    };
    const details = {
        totalAnnualPremium: appData.total_annual_premium || 0,
        maturity,
        maxAmount18_65: appData.borrower_amount_18_65 || 0,
        maxAmount66_70: appData.borrower_amount_66_70 || 0,
        maxAmount71_75: appData.borrower_amount_71_75 || 0,
        maxAmount76_80: appData.borrower_amount_76_80 || 0,
        rates18_65: (() => {
            const minAge = application.minimum_age || 18;
            const maxAge = application.maximum_age || 65;
            const isCustomAge = minAge !== 18 || maxAge !== 65;
            const numLives = Number(application.number_of_lives);
            const isScale2 = numLives > 30;
            return (planId !== 1 && isScale2 && isCustomAge)
                ? formatDbRatesForTemplate(ratesRows, `${minAge}_${maxAge}`, planId, application)
                : formatDbRatesForTemplate(ratesRows, '18_65', planId, application);
        })(),
        ratesCustomRemaining: (() => {
            const minAge = application.minimum_age || 18;
            const maxAge = application.maximum_age || 65;
            const isCustomAge = minAge !== 18 || maxAge !== 65;
            const numLives = Number(application.number_of_lives);
            const isScale2 = numLives > 30;
            return (planId !== 1 && isScale2 && isCustomAge && maxAge < 65)
                ? formatDbRatesForTemplate(ratesRows, `${maxAge + 1}_65`, planId, application)
                : null;
        })(),
        rates66_70: formatDbRatesForTemplate(ratesRows, '66_70', planId, application),
        rates71_75: formatDbRatesForTemplate(ratesRows, '71_75', planId, application),
        rates76_80: formatDbRatesForTemplate(ratesRows, '76_80', planId, application),
        logoDataUri: getImageDataUri('img/phillife-logo-hd.png'), 
        centerPhotoUri: getImageDataUri((planId === 1 || appData.prototype_id === 5 || appData.prototype_id === 6) ? 'img/GCLI.png' : 'img/cover.png'), 
        footerPhotoUri: getImageDataUri('img/footer.png'),
        page2FooterPhotoUri: getImageDataUri('img/page 2 footer.png') 
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

    // Route to specialized templates for Customized Proposals (Type 31)
    if (planId === 2) return generateGYRTPDFContent(application, user, details);
    if (planId === 3) return generateGPAPDFContent(application, user, details);
    if (planId === 4) return generateGCIPDFContent(application, user, details);
    return generateGCLIPDFContent(application, user, details); // Default/fallback for Plan ID 1
};

// Helper for unified PDF generation logic
export const generatePDFBuffer = async (htmlContent, options = {}) => {
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
        await page.setViewport({ width: 794, height: 1122, deviceScaleFactor: 1 });

        await page.setContent(htmlContent, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');

        await new Promise(resolve => setTimeout(resolve, 500));

        const displayHeaderFooter = options.displayHeaderFooter !== false;

        const margins = options.margin || {
            top: '20mm',
            bottom: '20mm',
            left: '0mm',
            right: '0mm'
        };

        return await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            displayHeaderFooter,
            headerTemplate: options.headerTemplate || '<div></div>',
            footerTemplate: options.footerTemplate || `
                <div style="
                    width: 100%;
                    font-size: 11px;
                    color: white;
                    padding: 0 30px;
                    text-align: right;
                ">
                    Page <span class="pageNumber"></span>
                </div>`,
            margin: margins
        });
    } finally {
        if (browser) await browser.close();
    }
};

// Generate COC letter HTML
export const generateCOCHtml = async (id) => {
    const appData = await Model.getApplicationById(id);
    if (!appData) throw new Error("Application not found.");
    
    const riders = await Model.getApplicationRiders(id);
    const planId = Number(appData.plan_id);
    let user = appData.user_id ? await User.getUserById(appData.user_id) : { firstname: 'Phillife', lastname: 'Representative' };

    const rankings = await Model.getCoverageRankingsByAppId(id);
    const rankingRiders = await Model.getCoverageRankingRiders(id);

    if ((appData.coverage_type_id === 32 || appData.coverage_type_id === 34) && rankingRiders.length > 0) {
        riders.forEach(mainRider => {
            const riderValues = rankingRiders.filter(rr => rr.rider_id === mainRider.rider_id).map(rr => ({ designation: rr.designation, acronym: rr.acronym, amount: rr.rider_amount, unit: rr.rider_unit }));
            if (riderValues.length > 0) mainRider.values = riderValues;
        });
    }

    const levelRanking = appData.coverage_type_id === 32 ? rankings.map(({ salary_multiplier, uniform_coverage_amount, ...rest }) => rest) : null;
    const salaryRanking = appData.coverage_type_id === 34 ? rankings.map(({ uniform_coverage_amount, ...rest }) => rest) : null;

    const application = { 
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

    const details = {
        logoDataUri: getImageDataUri('img/phillife-logo-hd.png')
    };

    const { generateCOCTemplate } = await import('../templates/coc/cocTemplate.js');
    return generateCOCTemplate(application, user, details);
};

/**
 * Helper to fetch internal email recipients and generate a dynamic salutation for proposal notifications.
 * Dynamically retrieves:
 * 1. Configured static users (e.g. User ID 17 - Marvin Mayo Catapang)
 * 2. Head / Team Lead of the CFE Creator (via creator.reporting_to_id)
 * (Note: CFE Creator email and salutation are excluded from internal email recipients as CFE details are listed in the email body)
 */
export const getProposalNotificationRecipients = async (creatorUserId) => {
    const emailSet = new Set();
    const salutationParts = [];
    let creator = null;
    let head = null;

    // List of static internal recipients (Add any user IDs, fallback emails, or custom salutation titles here)
    const staticUsers = [
        { id: 6, fallbackEmail: 'lehzter@gmail.com', fallbackLastName: 'Quinones', salutationName: 'Sir Lester' },
        // { id: 17, fallbackEmail: 'marvinc@phillife.com.ph', fallbackLastName: 'Catapang', salutationName: 'Sir Marvin' },
        // To add another user by ID or email, simply add objects here:
        // { id: 25, fallbackEmail: 'john.doe@phillife.com.ph', fallbackLastName: 'Kwong' },
        // { email: 'customteam@phillife.com.ph', salutationName: 'EBAM Team' }
    ];

    // 1. Fetch static internal recipients
    for (const target of staticUsers) {
        let u = null;
        if (target.id) {
            try {
                u = await User.getUserById(target.id);
                if (u && u.email) {
                    emailSet.add(u.email.trim());
                }
            } catch (e) {}
        }

        if (!u && (target.fallbackEmail || target.email)) {
            emailSet.add((target.fallbackEmail || target.email).trim());
        }

        // Determine salutation name for static user (using salutationName or fetched last name)
        const nameToUse = target.salutationName 
            ? target.salutationName 
            : (u && u.lastname ? `Sir/Ms. ${u.lastname}` : (target.fallbackLastName ? `Sir/Ms. ${target.fallbackLastName}` : null));
            
        if (nameToUse && !salutationParts.includes(nameToUse)) {
            salutationParts.push(nameToUse);
        }
    }

    // 2. Fetch CFE Creator & Head (Head gets the email, Creator is only fetched for head lookup & template info)
    if (creatorUserId) {
        try {
            creator = await User.getUserById(creatorUserId);

            // Fetch CFE Creator's Head (via reporting_to_id)
            if (creator && creator.reporting_to_id) {
                head = await User.getUserById(creator.reporting_to_id);
                if (head && head.email) {
                    emailSet.add(head.email.trim());
                }
            }
        } catch (e) {
            console.error('Error fetching creator or head for notification:', e);
        }
    }

    // Include Head's Last Name in salutation if available
    if (head && head.lastname) {
        const headSalutation = `Sir/Ms. ${head.lastname} (Team Lead)`;
        if (!salutationParts.includes(headSalutation)) {
            salutationParts.push(headSalutation);
        }
    } else if (!salutationParts.includes('Team Lead')) {
        salutationParts.push('Team Lead');
    }

    // Add "EBAM Team" at the end if not already included
    if (!salutationParts.includes('EBAM Team')) {
        salutationParts.push('EBAM Team');
    }

    // Construct internalSalutation string dynamically
    let internalSalutation = "";
    if (salutationParts.length === 1) {
        internalSalutation = salutationParts[0];
    } else if (salutationParts.length === 2) {
        internalSalutation = `${salutationParts[0]} and ${salutationParts[1]}`;
    } else {
        const lastPart = salutationParts.pop();
        internalSalutation = `${salutationParts.join(', ')}, and ${lastPart}`;
    }

    return {
        creator,
        head,
        recipientEmails: Array.from(emailSet),
        internalSalutation
    };
};